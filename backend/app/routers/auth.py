from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.dependencies import get_current_user, get_db
from app.models import LoginActivity, User
from app.schemas import TokenResponse, UserCreate, UserLogin, UserRead, UserUpdate


router = APIRouter(prefix="/auth", tags=["auth"])
ADMIN_SIGNUP_PASSCODE = "admin"


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    normalized_role = payload.role.lower()
    if normalized_role not in {"user", "admin"}:
        raise HTTPException(status_code=400, detail="Please choose a valid account type.")

    if normalized_role == "admin" and payload.admin_passcode != ADMIN_SIGNUP_PASSCODE:
        raise HTTPException(status_code=403, detail="Invalid admin passcode.")

    user = User(
        full_name=payload.full_name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        bio=payload.bio,
        role=normalized_role,
        last_active_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email or password.")
    if user.role != payload.role.lower():
        raise HTTPException(status_code=403, detail=f"This account is registered as a {user.role}, not a {payload.role}.")

    user.last_active_at = datetime.utcnow()
    # Store a separate immutable login event so analytics can count monthly active users over time.
    db.add(LoginActivity(user_id=user.id, logged_in_at=user.last_active_at))
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return UserRead.model_validate(current_user)


@router.put("/me", response_model=UserRead)
def update_me(payload: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing_user = db.scalar(select(User).where(User.email == payload.email.lower(), User.id != current_user.id))
    if existing_user:
        raise HTTPException(status_code=400, detail="Another account already uses this email address.")

    current_user.full_name = payload.full_name
    current_user.email = payload.email.lower()
    current_user.bio = payload.bio
    current_user.last_active_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return UserRead.model_validate(current_user)

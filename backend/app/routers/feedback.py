from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_current_admin, get_current_user, get_db
from app.models import Feedback, User
from app.schemas import FeedbackCreate, FeedbackRead, FeedbackStatusUpdate


router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackRead, status_code=201)
def submit_feedback(
    payload: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    feedback = Feedback(**payload.model_dump(), user_id=current_user.id)
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return FeedbackRead(
        id=feedback.id,
        rating=feedback.rating,
        category=feedback.category,
        message=feedback.message,
        status=feedback.status,
        created_at=feedback.created_at,
        user_id=current_user.id,
        user_name=current_user.full_name,
    )


@router.get("", response_model=list[FeedbackRead])
def list_feedback(_: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    feedback_items = db.scalars(select(Feedback).order_by(Feedback.created_at.desc())).all()
    return [
        FeedbackRead(
            id=item.id,
            rating=item.rating,
            category=item.category,
            message=item.message,
            status=item.status,
            created_at=item.created_at,
            user_id=item.user.id,
            user_name=item.user.full_name,
        )
        for item in feedback_items
    ]


@router.put("/{feedback_id}", response_model=FeedbackRead)
def update_feedback_status(
    feedback_id: int,
    payload: FeedbackStatusUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    feedback = db.get(Feedback, feedback_id)
    if feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found.")

    feedback.status = payload.status
    db.commit()
    db.refresh(feedback)
    return FeedbackRead(
        id=feedback.id,
        rating=feedback.rating,
        category=feedback.category,
        message=feedback.message,
        status=feedback.status,
        created_at=feedback.created_at,
        user_id=feedback.user.id,
        user_name=feedback.user.full_name,
    )

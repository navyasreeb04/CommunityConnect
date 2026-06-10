from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_current_admin, get_current_user, get_db
from app.models import Community, User, UserCommunity
from app.schemas import (
    CommunityCreate,
    CommunityRead,
    CommunitySubscriptionCreate,
    CommunitySubscriptionUpdate,
    CommunityUpdate,
)


router = APIRouter(prefix="/communities", tags=["communities"])


def _build_community_payload(community: Community, membership: UserCommunity | None = None) -> CommunityRead:
    return CommunityRead(
        id=community.id,
        name=community.name,
        slug=community.slug,
        description=community.description,
        color=community.color,
        created_at=community.created_at,
        subscription_priority=membership.priority if membership else None,
        is_subscribed=membership is not None,
    )


@router.get("", response_model=list[CommunityRead])
def list_communities(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    communities = db.scalars(select(Community).order_by(Community.name)).all()
    memberships = db.scalars(select(UserCommunity).where(UserCommunity.user_id == current_user.id)).all()
    membership_map = {membership.community_id: membership for membership in memberships}
    return [_build_community_payload(community, membership_map.get(community.id)) for community in communities]


@router.get("/subscriptions", response_model=list[CommunityRead])
def list_subscriptions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memberships = db.scalars(
        select(UserCommunity).where(UserCommunity.user_id == current_user.id).order_by(UserCommunity.priority)
    ).all()
    return [_build_community_payload(membership.community, membership) for membership in memberships]


@router.post("/subscriptions/{community_id}", response_model=CommunityRead, status_code=status.HTTP_201_CREATED)
def subscribe_to_community(
    community_id: int,
    payload: CommunitySubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    community = db.get(Community, community_id)
    if community is None:
        raise HTTPException(status_code=404, detail="Community not found.")

    membership = db.scalar(
        select(UserCommunity).where(
            UserCommunity.user_id == current_user.id,
            UserCommunity.community_id == community_id,
        )
    )
    if membership:
        raise HTTPException(status_code=400, detail="You already joined this community.")

    membership = UserCommunity(user_id=current_user.id, community_id=community_id, priority=payload.priority)
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return _build_community_payload(community, membership)


@router.put("/subscriptions/{community_id}", response_model=CommunityRead)
def update_subscription_priority(
    community_id: int,
    payload: CommunitySubscriptionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    membership = db.scalar(
        select(UserCommunity).where(
            UserCommunity.user_id == current_user.id,
            UserCommunity.community_id == community_id,
        )
    )
    if membership is None:
        raise HTTPException(status_code=404, detail="You are not subscribed to this community.")

    membership.priority = payload.priority
    db.commit()
    db.refresh(membership)
    return _build_community_payload(membership.community, membership)


@router.delete("/subscriptions/{community_id}", status_code=status.HTTP_204_NO_CONTENT)
def leave_community(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    membership = db.scalar(
        select(UserCommunity).where(
            UserCommunity.user_id == current_user.id,
            UserCommunity.community_id == community_id,
        )
    )
    if membership is None:
        raise HTTPException(status_code=404, detail="You are not subscribed to this community.")

    db.delete(membership)
    db.commit()


@router.post("", response_model=CommunityRead, status_code=status.HTTP_201_CREATED)
def create_community(
    payload: CommunityCreate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if db.scalar(select(Community).where((Community.slug == payload.slug) | (Community.name == payload.name))):
        raise HTTPException(status_code=400, detail="Community name or slug already exists.")

    community = Community(**payload.model_dump())
    db.add(community)
    db.commit()
    db.refresh(community)
    return _build_community_payload(community)


@router.put("/{community_id}", response_model=CommunityRead)
def update_community(
    community_id: int,
    payload: CommunityUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    community = db.get(Community, community_id)
    if community is None:
        raise HTTPException(status_code=404, detail="Community not found.")

    for key, value in payload.model_dump(exclude_none=True).items():
        setattr(community, key, value)

    db.commit()
    db.refresh(community)
    return _build_community_payload(community)


@router.delete("/{community_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_community(
    community_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    community = db.get(Community, community_id)
    if community is None:
        raise HTTPException(status_code=404, detail="Community not found.")

    db.delete(community)
    db.commit()

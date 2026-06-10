from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.dependencies import get_current_admin, get_current_user, get_db
from app.models import Comment, Community, Event, Feedback, LoginActivity, Post, PostLike, Registration, User, UserCommunity
from app.schemas import (
    AdminAnalyticsRead,
    CommunityAnalyticsPoint,
    MetricCard,
    PostEngagementPoint,
    RankedItem,
    TimeSeriesPoint,
    UserAnalyticsRead,
)


router = APIRouter(prefix="/analytics", tags=["analytics"])


def _month_key(value):
    return value.strftime("%Y-%m")


def _recent_months(total_months: int = 8) -> list[str]:
    today = datetime.utcnow().replace(day=1)
    months = []
    for offset in range(total_months - 1, -1, -1):
        month = today
        for _ in range(offset):
            if month.month == 1:
                month = month.replace(year=month.year - 1, month=12)
            else:
                month = month.replace(month=month.month - 1)
        months.append(month.strftime("%Y-%m"))
    return months


def _monthly_counts(db: Session, model, date_column) -> dict[str, int]:
    # SQLite strftime keeps aggregation in the database so the dashboard can scale beyond demo data.
    # rows = db.execute(
    #     select(func.strftime("%Y-%m", date_column).label("month"), func.count(model.id)).group_by("month")
    # ).all()
    # return {month: count for month, count in rows}
    stmt = (
        select(
            func.date_format(date_column, '%Y-%m').label("month"), 
            func.count(model.id).label("count")
        )
        .group_by(func.date_format(date_column, '%Y-%m'))
        # .order_by(func.date_format(date_column, '%Y-%m'))
    )
    
    # Execute the updated statement
    rows = db.execute(stmt).all()
    return {month: count for month, count in rows}


@router.get("/user", response_model=UserAnalyticsRead)
def get_user_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    joined_count = db.scalar(select(func.count()).select_from(UserCommunity).where(UserCommunity.user_id == current_user.id)) or 0
    registered_events = db.scalar(
        select(func.count()).select_from(Registration).where(Registration.user_id == current_user.id)
    ) or 0
    post_count = db.scalar(select(func.count()).select_from(Post).where(Post.user_id == current_user.id)) or 0

    trending_communities_rows = db.execute(
        select(Community.name, func.count(Post.id).label("post_count"))
        .join(Post, Post.community_id == Community.id, isouter=True)
        .group_by(Community.id)
        .order_by(func.count(Post.id).desc(), Community.name)
        .limit(5)
    ).all()

    top_posts_rows = db.execute(
        select(
            Post.id,
            Post.title,
            Community.name,
            func.count(func.distinct(PostLike.id)).label("likes"),
            func.count(func.distinct(Comment.id)).label("comments"),
        )
        .join(Community, Community.id == Post.community_id)
        .join(PostLike, PostLike.post_id == Post.id, isouter=True)
        .join(Comment, Comment.post_id == Post.id, isouter=True)
        .group_by(Post.id, Community.name)
        .order_by((func.count(func.distinct(PostLike.id)) + func.count(func.distinct(Comment.id))).desc(), Post.created_at.desc())
        .limit(5)
    ).all()

    community_member_rows = db.execute(
        select(Community.name, func.count(UserCommunity.id).label("members"))
        .join(UserCommunity, UserCommunity.community_id == Community.id, isouter=True)
        .group_by(Community.id)
        .order_by(func.count(UserCommunity.id).desc(), Community.name)
    ).all()

    overview = [
        MetricCard(label="Joined Communities", value=joined_count, description="Communities you actively follow."),
        MetricCard(label="My Posts", value=post_count, description="Discussion threads created by you."),
        MetricCard(label="Registered Events", value=registered_events, description="Events on your roadmap."),
    ]
    trending_communities = [
        RankedItem(label=name, value=post_count, meta="posts shared") for name, post_count in trending_communities_rows
    ]
    popular_posts = [
        PostEngagementPoint(
            id=post_id,
            title=title,
            community=community,
            likes=likes,
            comments=comments,
            engagement=likes + comments,
        )
        for post_id, title, community, likes, comments in top_posts_rows
    ]
    top_posts = [RankedItem(label=item.title, value=item.engagement, meta=f"{item.community} engagement") for item in popular_posts]
    community_members = [
        CommunityAnalyticsPoint(community=name, members=members) for name, members in community_member_rows
    ]
    return UserAnalyticsRead(
        overview=overview,
        trending_communities=trending_communities,
        top_posts=top_posts,
        community_members=community_members,
        popular_posts=popular_posts,
    )


@router.get("/admin", response_model=AdminAnalyticsRead)
def get_admin_analytics(_: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    active_since = datetime.utcnow() - timedelta(days=30)
    active_users = (
        db.scalar(
            select(func.count(func.distinct(LoginActivity.user_id))).where(LoginActivity.logged_in_at >= active_since)
        )
        or 0
    )
    total_posts = db.scalar(select(func.count()).select_from(Post)) or 0
    total_communities = db.scalar(select(func.count()).select_from(Community)) or 0

    community_rows = db.execute(
        select(
            Community.name,
            func.count(func.distinct(UserCommunity.id)).label("member_count"),
            func.count(func.distinct(Post.id)).label("post_count"),
            func.count(func.distinct(PostLike.id)).label("like_count"),
            func.count(func.distinct(Comment.id)).label("comment_count"),
        )
        .join(UserCommunity, UserCommunity.community_id == Community.id, isouter=True)
        .join(Post, Post.community_id == Community.id, isouter=True)
        .join(PostLike, PostLike.post_id == Post.id, isouter=True)
        .join(Comment, Comment.post_id == Post.id, isouter=True)
        .group_by(Community.id, Community.name)
        .order_by((func.count(func.distinct(Post.id)) + func.count(func.distinct(PostLike.id)) + func.count(func.distinct(Comment.id))).desc(), Community.name)
    ).all()

    active_user_rows = db.execute(
        select(
            User.full_name,
            (
                func.count(func.distinct(Post.id))
                + func.count(func.distinct(Comment.id))
                + func.count(func.distinct(PostLike.id))
            ).label("activity")
        )
        .join(Post, Post.user_id == User.id, isouter=True)
        .join(Comment, Comment.user_id == User.id, isouter=True)
        .join(PostLike, PostLike.user_id == User.id, isouter=True)
        .group_by(User.id, User.full_name)
        .order_by(desc("activity"), User.full_name)
        .limit(5)
    ).all()

    event_rows = db.execute(
        select(Event.title, func.count(Registration.id).label("registrations"))
        .join(Registration, Registration.event_id == Event.id, isouter=True)
        .group_by(Event.id)
        .order_by(func.count(Registration.id).desc(), Event.start_time)
        .limit(5)
    ).all()

    average_rating = db.scalar(select(func.avg(Feedback.rating)).select_from(Feedback)) or 0
    feedback_count = db.scalar(select(func.count()).select_from(Feedback)) or 0
    pending_feedback = db.scalar(select(func.count()).select_from(Feedback).where(Feedback.status == "new")) or 0

    overview = [
        MetricCard(label="Total Users", value=total_users, description="All accounts in the platform."),
        MetricCard(label="Active Users (30d)", value=active_users, description="Recently active users."),
        MetricCard(label="Posts Shared", value=total_posts, description="Knowledge-sharing posts created."),
        MetricCard(label="Total Communities", value=total_communities, description="Active community spaces."),
    ]
    popular_communities = [
        RankedItem(label=name, value=member_count, meta="members") for name, member_count, *_ in community_rows[:5]
    ]
    active_users_list = [RankedItem(label=name, value=activity, meta="posts, comments, and likes") for name, activity in active_user_rows]
    event_participation = [
        RankedItem(label=title, value=registrations, meta="registrations") for title, registrations in event_rows
    ]
    feedback_summary = [
        RankedItem(label="Average Rating", value=round(float(average_rating), 2), meta="out of 5"),
        RankedItem(label="Feedback Entries", value=feedback_count, meta="messages received"),
        RankedItem(label="Pending Review", value=pending_feedback, meta="still marked new"),
    ]
    signup_counts = _monthly_counts(db, User, User.created_at)
    login_counts = _monthly_counts(db, LoginActivity, LoginActivity.logged_in_at)
    monthly_active_rows = db.execute(
        select(
            func.date_format(LoginActivity.logged_in_at, '%Y-%m').label("month"),
            func.count(func.distinct(LoginActivity.user_id)).label("count")
        )
        .group_by(func.date_format(LoginActivity.logged_in_at, '%Y-%m'))
        .order_by(func.date_format(LoginActivity.logged_in_at, '%Y-%m'))
    ).all()
    active_counts = {month: count for month, count in monthly_active_rows}
    user_growth = [
        TimeSeriesPoint(month=month, signups=signup_counts.get(month, 0), active_users=active_counts.get(month, 0))
        for month in _recent_months()
    ]
    activity_trends = [
        TimeSeriesPoint(month=month, logins=login_counts.get(month, 0), active_users=active_counts.get(month, 0))
        for month in _recent_months()
    ]
    community_engagement = [
        CommunityAnalyticsPoint(
            community=name,
            members=members,
            posts=posts,
            likes=likes,
            comments=comments,
            engagement=posts + likes + comments,
        )
        for name, members, posts, likes, comments in community_rows
    ]
    community_distribution = sorted(community_engagement, key=lambda item: item.members, reverse=True)

    growth_cutoff = datetime.utcnow() - timedelta(days=30)
    fastest_row = db.execute(
        select(Community.name, func.count(UserCommunity.id).label("new_members"))
        .join(UserCommunity, UserCommunity.community_id == Community.id, isouter=True)
        .where((UserCommunity.joined_at >= growth_cutoff) | (UserCommunity.id.is_(None)))
        .group_by(Community.id, Community.name)
        .order_by(func.count(UserCommunity.id).desc(), Community.name)
        .limit(1)
    ).first()
    fastest_growing_community = (
        RankedItem(label=fastest_row[0], value=fastest_row[1], meta="new members in 30 days") if fastest_row else None
    )
    most_active = max(community_engagement, key=lambda item: item.engagement, default=None)
    most_active_community = (
        RankedItem(label=most_active.community, value=most_active.engagement, meta="posts + likes + comments")
        if most_active
        else None
    )

    return AdminAnalyticsRead(
        overview=overview,
        popular_communities=popular_communities,
        active_users=active_users_list,
        event_participation=event_participation,
        feedback_summary=feedback_summary,
        user_growth=user_growth,
        community_engagement=community_engagement[:8],
        community_distribution=community_distribution,
        activity_trends=activity_trends,
        fastest_growing_community=fastest_growing_community,
        most_active_community=most_active_community,
    )

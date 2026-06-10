from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import Community, Event, Feedback, LoginActivity, Post, Registration, User, UserCommunity


def seed_database(db: Session):
    if db.scalar(select(User).limit(1)):
        return

    admin = User(
        full_name="Asha Admin",
        email="admin@communityconnect.dev",
        password_hash=hash_password("Admin@123"),
        role="admin",
        bio="Community moderator and event curator.",
    )
    user = User(
        full_name="Riya Student",
        email="riya@communityconnect.dev",
        password_hash=hash_password("User@123"),
        role="user",
        bio="Exploring hackathons and machine learning communities.",
    )
    db.add_all([admin, user])
    db.flush()

    communities = [
        Community(name="Machine Learning", slug="machine-learning", description="Models, papers, and experimentation.", color="#d97706"),
        Community(name="Competitive Coding", slug="competitive-coding", description="Practice, contests, and problem-solving.", color="#f59e0b"),
        Community(name="Blockchain", slug="blockchain", description="Web3, smart contracts, and decentralized apps.", color="#fbbf24"),
        Community(name="Data Science", slug="data-science", description="Data workflows, analytics, and dashboards.", color="#ea580c"),
    ]
    db.add_all(communities)
    db.flush()

    db.add_all(
        [
            UserCommunity(user_id=user.id, community_id=communities[0].id, priority=1),
            UserCommunity(user_id=user.id, community_id=communities[1].id, priority=2),
            UserCommunity(user_id=admin.id, community_id=communities[0].id, priority=1),
            UserCommunity(user_id=admin.id, community_id=communities[3].id, priority=2),
        ]
    )

    posts = [
        Post(
            title="Best ML roadmap for 2026 hackathon prep",
            content="I grouped the latest prep path into math refresh, model intuition, and project demos. Start with a narrow problem and document each iteration.",
            user_id=user.id,
            community_id=communities[0].id,
        ),
        Post(
            title="Contest strategy for weekend coding rounds",
            content="Focus on solving the first three problems fast, then revisit edge cases. Time discipline usually beats raw speed.",
            user_id=admin.id,
            community_id=communities[1].id,
        ),
    ]
    db.add_all(posts)
    db.flush()

    upcoming_event = Event(
        title="CommunityConnect Hack Sprint",
        description="A 24-hour campus hackathon focused on practical products and strong demos.",
        location="Innovation Lab",
        event_type="Hackathon",
        start_time=datetime.utcnow() + timedelta(days=7),
        end_time=datetime.utcnow() + timedelta(days=8),
        registration_deadline=datetime.utcnow() + timedelta(days=5),
        community_id=communities[0].id,
        created_by_id=admin.id,
    )
    workshop = Event(
        title="Data Storytelling Workshop",
        description="Learn how to turn dashboard metrics into a convincing narrative for project reviews.",
        location="Seminar Hall 2",
        event_type="Workshop",
        start_time=datetime.utcnow() + timedelta(days=4),
        end_time=datetime.utcnow() + timedelta(days=4, hours=2),
        registration_deadline=datetime.utcnow() + timedelta(days=3),
        community_id=communities[3].id,
        created_by_id=admin.id,
    )
    db.add_all([upcoming_event, workshop])
    db.flush()

    db.add(Registration(user_id=user.id, event_id=upcoming_event.id, reminder_offsets="10080,1440,60"))
    db.add(LoginActivity(user_id=admin.id, logged_in_at=datetime.utcnow()))
    db.add(LoginActivity(user_id=user.id, logged_in_at=datetime.utcnow()))
    db.add(
        Feedback(
            user_id=user.id,
            rating=5,
            category="Feature Request",
            message="A timeline view for reminders would make event planning even easier.",
            status="new",
        )
    )
    db.commit()

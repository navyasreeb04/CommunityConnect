from datetime import datetime, timedelta
import random

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import Comment, Community, Event, Feedback, LoginActivity, Post, PostLike, Registration, User, UserCommunity


DEMO_PASSWORD = "Demo@123"
DEMO_DOMAINS = [
    ("Machine Learning", "machine-learning", "Models, papers, and applied AI projects.", "#d97706"),
    ("Competitive Coding", "competitive-coding", "Contests, DSA practice, and interview prep.", "#f59e0b"),
    ("Blockchain", "blockchain", "Smart contracts, wallets, and decentralized apps.", "#fbbf24"),
    ("Data Science", "data-science", "Analytics, pipelines, notebooks, and dashboards.", "#ea580c"),
    ("UI UX Design", "ui-ux-design", "Research, prototypes, accessibility, and product polish.", "#c2410c"),
    ("Cloud DevOps", "cloud-devops", "Deployments, containers, monitoring, and reliability.", "#b45309"),
    ("Cybersecurity", "cybersecurity", "Secure coding, CTFs, privacy, and threat modeling.", "#92400e"),
]
INTERESTS = [
    "machine learning",
    "analytics",
    "hackathons",
    "frontend design",
    "cloud",
    "cybersecurity",
    "blockchain",
    "competitive programming",
]
FIRST_NAMES = [
    "Aarav",
    "Anaya",
    "Dev",
    "Diya",
    "Ishan",
    "Kavya",
    "Meera",
    "Neil",
    "Priya",
    "Rohan",
    "Sara",
    "Vihaan",
]
LAST_NAMES = ["Mehta", "Sharma", "Iyer", "Rao", "Kapoor", "Nair", "Das", "Patel", "Khan", "Sen"]


def _months_ago(months: int, day_offset: int = 0) -> datetime:
    value = datetime.utcnow().replace(day=15, hour=10, minute=0, second=0, microsecond=0)
    for _ in range(months):
        if value.month == 1:
            value = value.replace(year=value.year - 1, month=12)
        else:
            value = value.replace(month=value.month - 1)
    return value + timedelta(days=day_offset)


def seed_demo_data(db: Session, user_count: int = 80) -> dict[str, int]:
    """Insert deterministic demo data with month-spread timestamps for analytics dashboards."""
    random.seed(42)

    admin = db.scalar(select(User).where(User.email == "admin@communityconnect.dev"))
    if admin is None:
        admin = User(
            full_name="Asha Admin",
            email="admin@communityconnect.dev",
            password_hash=hash_password("Admin@123"),
            role="admin",
            bio="Community moderator and analytics reviewer.",
            created_at=_months_ago(8),
            last_active_at=datetime.utcnow(),
        )
        db.add(admin)
        db.flush()
        db.add(LoginActivity(user_id=admin.id, logged_in_at=datetime.utcnow()))
        db.commit()

    existing_demo = db.scalar(select(User).where(User.email == "demo.user001@communityconnect.dev"))
    if existing_demo:
        return {"status": "already_seeded", "users": 0, "communities": 0, "posts": 0, "logins": 0}

    communities = []
    for name, slug, description, color in DEMO_DOMAINS:
        community = db.scalar(select(Community).where(Community.slug == slug))
        if community is None:
            community = Community(
                name=name,
                slug=slug,
                description=description,
                color=color,
                created_at=_months_ago(random.randint(5, 8), random.randint(-6, 6)),
            )
            db.add(community)
        communities.append(community)
    db.flush()

    users = []
    for index in range(1, user_count + 1):
        full_name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)} {index:02d}"
        interests = random.sample(INTERESTS, k=random.randint(2, 4))
        created_at = _months_ago(random.randint(0, 7), random.randint(-10, 10))
        user = User(
            full_name=full_name,
            email=f"demo.user{index:03d}@communityconnect.dev",
            password_hash=hash_password(DEMO_PASSWORD),
            role="user",
            bio=f"Interested in {', '.join(interests)}.",
            created_at=created_at,
            last_active_at=created_at + timedelta(days=random.randint(1, 24)),
        )
        db.add(user)
        users.append(user)
    db.flush()

    memberships = []
    for user in users:
        for community in random.sample(communities, k=random.randint(2, 4)):
            joined_at = max(user.created_at, community.created_at) + timedelta(days=random.randint(0, 35))
            memberships.append(
                UserCommunity(
                    user_id=user.id,
                    community_id=community.id,
                    priority=random.randint(1, 5),
                    joined_at=joined_at,
                )
            )
    db.add_all(memberships)
    db.flush()

    posts = []
    post_templates = [
        "Weekly learning plan for {community}",
        "Project ideas that fit {community}",
        "Resources that helped me in {community}",
        "Common mistakes to avoid in {community}",
        "How our team prepared for {community}",
    ]
    for index in range(160):
        community = random.choice(communities)
        author = random.choice(users)
        created_at = _months_ago(random.randint(0, 7), random.randint(-12, 12))
        posts.append(
            Post(
                title=random.choice(post_templates).format(community=community.name),
                content=(
                    f"Demo discussion {index + 1}: sharing practical notes, blockers, and next steps for "
                    f"{community.name.lower()} learners."
                ),
                user_id=author.id,
                community_id=community.id,
                created_at=created_at,
            )
        )
    db.add_all(posts)
    db.flush()

    like_pairs = set()
    comments = []
    for post in posts:
        for liker in random.sample(users, k=random.randint(2, 14)):
            if (post.id, liker.id) in like_pairs:
                continue
            like_pairs.add((post.id, liker.id))
            db.add(PostLike(post_id=post.id, user_id=liker.id, created_at=post.created_at + timedelta(days=random.randint(0, 6))))
        for commenter in random.sample(users, k=random.randint(0, 5)):
            comments.append(
                Comment(
                    post_id=post.id,
                    user_id=commenter.id,
                    content="This is useful for planning the next community sprint.",
                    created_at=post.created_at + timedelta(days=random.randint(0, 8)),
                )
            )
    db.add_all(comments)

    events = []
    for index, community in enumerate(communities):
        for event_number in range(2):
            start = datetime.utcnow() + timedelta(days=7 + index * 3 + event_number * 14)
            events.append(
                Event(
                    title=f"{community.name} Demo Meetup {event_number + 1}",
                    description=f"Hands-on community session for {community.name}.",
                    location=f"Lab {index + 1}",
                    event_type=random.choice(["Workshop", "Hackathon", "Seminar"]),
                    start_time=start,
                    end_time=start + timedelta(hours=2),
                    registration_deadline=start - timedelta(days=2),
                    community_id=community.id,
                    created_by_id=users[0].id,
                    created_at=start - timedelta(days=20),
                )
            )
    db.add_all(events)
    db.flush()

    registration_pairs = set()
    for event in events:
        for user in random.sample(users, k=random.randint(15, 36)):
            if (event.id, user.id) in registration_pairs:
                continue
            registration_pairs.add((event.id, user.id))
            db.add(
                Registration(
                    user_id=user.id,
                    event_id=event.id,
                    reminder_offsets="10080,1440,60",
                    created_at=event.created_at + timedelta(days=random.randint(0, 12)),
                )
            )

    logins = []
    for user in users:
        for months_back in range(0, 8):
            for _ in range(random.randint(1, 5)):
                logged_in_at = _months_ago(months_back, random.randint(-13, 13)) + timedelta(hours=random.randint(8, 22))
                logins.append(LoginActivity(user_id=user.id, logged_in_at=logged_in_at))
                if logged_in_at > user.last_active_at:
                    user.last_active_at = logged_in_at
    db.add_all(logins)

    for user in random.sample(users, k=22):
        db.add(
            Feedback(
                user_id=user.id,
                rating=random.randint(3, 5),
                category=random.choice(["Feature Request", "Bug", "Experience", "Events"]),
                message="Demo feedback for validating admin analytics and review queues.",
                status=random.choice(["new", "in-review", "resolved"]),
                created_at=_months_ago(random.randint(0, 5), random.randint(-8, 8)),
            )
        )

    db.commit()
    return {
        "status": "seeded",
        "users": len(users),
        "communities": len(communities),
        "posts": len(posts),
        "logins": len(logins),
    }

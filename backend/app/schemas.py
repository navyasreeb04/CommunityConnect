from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str
    password: str = Field(min_length=6, max_length=64)
    bio: str | None = None
    role: str = Field(default="user")
    admin_passcode: str | None = None


class UserLogin(BaseModel):
    email: str
    password: str
    role: str = Field(default="user")


class UserUpdate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str
    bio: str | None = None


class UserRead(ORMModel):
    id: int
    full_name: str
    email: str
    role: str
    bio: str | None = None
    last_active_at: datetime
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class CommunityBase(BaseModel):
    name: str
    slug: str
    description: str
    color: str = "#e58a38"


class CommunityCreate(CommunityBase):
    pass


class CommunityUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    color: str | None = None


class CommunityRead(ORMModel):
    id: int
    name: str
    slug: str
    description: str
    color: str
    created_at: datetime
    subscription_priority: int | None = None
    is_subscribed: bool = False


class CommunitySubscriptionCreate(BaseModel):
    priority: int = Field(ge=1, le=5)


class CommunitySubscriptionUpdate(BaseModel):
    priority: int = Field(ge=1, le=5)


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1000)


class CommentRead(BaseModel):
    id: int
    content: str
    created_at: datetime
    author_name: str
    author_id: int


class PostCreate(BaseModel):
    title: str = Field(min_length=4, max_length=180)
    content: str = Field(min_length=10, max_length=4000)
    community_id: int


class PostRead(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime
    community_id: int
    community_name: str
    community_color: str
    author_id: int
    author_name: str
    like_count: int
    comment_count: int
    liked_by_me: bool
    priority: int | None = None
    is_joined_community: bool = False
    comments: list[CommentRead]


class EventBase(BaseModel):
    title: str
    description: str
    location: str
    event_type: str
    start_time: datetime
    end_time: datetime
    registration_deadline: datetime
    community_id: int | None = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    location: str | None = None
    event_type: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    registration_deadline: datetime | None = None
    community_id: int | None = None


class RegistrationCreate(BaseModel):
    reminder_offsets: list[int] = Field(default_factory=lambda: [10080, 1440, 60])


class EventRead(BaseModel):
    id: int
    title: str
    description: str
    location: str
    event_type: str
    start_time: datetime
    end_time: datetime
    registration_deadline: datetime
    community_id: int | None = None
    community_name: str | None = None
    registration_count: int
    is_registered: bool
    reminder_offsets: list[int]


class ReminderRead(BaseModel):
    event_id: int
    event_title: str
    location: str
    start_time: datetime
    trigger_offset_minutes: int
    minutes_until_event: int
    status: str


class NotificationRead(ORMModel):
    id: int
    user_id: int
    message: str
    is_read: bool
    created_at: datetime


class FeedbackCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    category: str
    message: str = Field(min_length=10, max_length=2000)


class FeedbackStatusUpdate(BaseModel):
    status: str


class FeedbackRead(BaseModel):
    id: int
    rating: int
    category: str
    message: str
    status: str
    created_at: datetime
    user_id: int
    user_name: str


class MetricCard(BaseModel):
    label: str
    value: int | float
    description: str


class RankedItem(BaseModel):
    label: str
    value: int | float
    meta: str | None = None


class TimeSeriesPoint(BaseModel):
    month: str
    signups: int = 0
    active_users: int = 0
    logins: int = 0


class CommunityAnalyticsPoint(BaseModel):
    community: str
    members: int = 0
    posts: int = 0
    likes: int = 0
    comments: int = 0
    engagement: int = 0


class PostEngagementPoint(BaseModel):
    id: int
    title: str
    community: str
    likes: int = 0
    comments: int = 0
    engagement: int = 0


class UserAnalyticsRead(BaseModel):
    overview: list[MetricCard]
    trending_communities: list[RankedItem]
    top_posts: list[RankedItem]
    community_members: list[CommunityAnalyticsPoint]
    popular_posts: list[PostEngagementPoint]


class AdminAnalyticsRead(BaseModel):
    overview: list[MetricCard]
    popular_communities: list[RankedItem]
    active_users: list[RankedItem]
    event_participation: list[RankedItem]
    feedback_summary: list[RankedItem]
    user_growth: list[TimeSeriesPoint]
    community_engagement: list[CommunityAnalyticsPoint]
    community_distribution: list[CommunityAnalyticsPoint]
    activity_trends: list[TimeSeriesPoint]
    fastest_growing_community: RankedItem | None = None
    most_active_community: RankedItem | None = None

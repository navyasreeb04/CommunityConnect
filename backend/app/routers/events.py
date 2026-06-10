from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.dependencies import get_current_admin, get_current_user, get_db
from app.email_service import send_event_email
from app.models import Event, Registration, Reminder, User
from app.notifications import create_notification
from app.schemas import EventCreate, EventRead, EventUpdate, RegistrationCreate, ReminderRead


router = APIRouter(prefix="/events", tags=["events"])


def _serialize_offsets(offsets: str) -> list[int]:
    if not offsets:
        return []
    return [int(offset.strip()) for offset in offsets.split(",") if offset.strip()]


def _serialize_event(event: Event, current_user: User) -> EventRead:
    registration = next((item for item in event.registrations if item.user_id == current_user.id), None)
    return EventRead(
        id=event.id,
        title=event.title,
        description=event.description,
        location=event.location,
        event_type=event.event_type,
        start_time=event.start_time,
        end_time=event.end_time,
        registration_deadline=event.registration_deadline,
        community_id=event.community_id,
        community_name=event.community.name if event.community else None,
        registration_count=len(event.registrations),
        is_registered=registration is not None,
        reminder_offsets=_serialize_offsets(registration.reminder_offsets) if registration else [],
    )


def _reminder_type_for_offset(offset: int) -> str | None:
    return {10080: "week", 1440: "day", 60: "hour"}.get(offset)


def _create_future_reminders(db: Session, user_id: int, event: Event, reminder_offsets: list[int]):
    now = datetime.utcnow()
    for offset in set(reminder_offsets):
        reminder_type = _reminder_type_for_offset(offset)
        if reminder_type is None:
            continue

        reminder_time = event.start_time - timedelta(minutes=offset)
        # Reminder logic: only future reminder times are stored, preventing instant duplicate sends.
        if reminder_time <= now:
            continue

        db.add(
            Reminder(
                user_id=user_id,
                event_id=event.id,
                reminder_time=reminder_time,
                type=reminder_type,
                is_sent=False,
            )
        )


@router.get("", response_model=list[EventRead])
def list_events(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    events = db.scalars(
        select(Event)
        .options(selectinload(Event.community), selectinload(Event.registrations))
        .order_by(Event.start_time)
    ).all()
    return [_serialize_event(event, current_user) for event in events]


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    event = Event(**payload.model_dump(), created_by_id=current_user.id)
    db.add(event)
    db.commit()
    db.refresh(event)
    event = db.scalar(
        select(Event)
        .where(Event.id == event.id)
        .options(selectinload(Event.community), selectinload(Event.registrations))
    )
    return _serialize_event(event, current_user)


@router.put("/{event_id}", response_model=EventRead)
def update_event(
    event_id: int,
    payload: EventUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    event = db.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found.")

    for key, value in payload.model_dump(exclude_none=True).items():
        setattr(event, key, value)

    db.commit()
    db.refresh(event)
    event = db.scalar(
        select(Event)
        .where(Event.id == event.id)
        .options(selectinload(Event.community), selectinload(Event.registrations))
    )
    return _serialize_event(event, current_user)


@router.post("/{event_id}/register", response_model=EventRead, status_code=status.HTTP_201_CREATED)
async def register_for_event(
    event_id: int,
    payload: RegistrationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found.")
    # Time comparison logic: registration is disabled once the event has fully ended.
    if event.end_time < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Event has ended.")
    if event.registration_deadline < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Registration deadline has passed.")

    existing_registration = db.scalar(
        select(Registration).where(Registration.event_id == event_id, Registration.user_id == current_user.id)
    )
    if existing_registration:
        raise HTTPException(status_code=400, detail="You are already registered.")

    registration = Registration(
        event_id=event_id,
        user_id=current_user.id,
        reminder_offsets=",".join(str(offset) for offset in payload.reminder_offsets),
    )
    db.add(registration)
    _create_future_reminders(db, current_user.id, event, payload.reminder_offsets)
    db.commit()

    await create_notification(db, current_user.id, f"You have successfully registered for {event.title}.")
    await send_event_email(
        current_user,
        event,
        "CommunityConnect event registration",
        "You have successfully registered",
    )
    event = db.scalar(
        select(Event)
        .where(Event.id == event_id)
        .options(selectinload(Event.community), selectinload(Event.registrations))
    )
    return _serialize_event(event, current_user)


@router.delete("/{event_id}/register", status_code=status.HTTP_204_NO_CONTENT)
def unregister_from_event(event_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    registration = db.scalar(
        select(Registration).where(Registration.event_id == event_id, Registration.user_id == current_user.id)
    )
    if registration is None:
        raise HTTPException(status_code=404, detail="Registration not found.")

    unsent_reminders = db.scalars(
        select(Reminder).where(
            Reminder.event_id == event_id,
            Reminder.user_id == current_user.id,
            Reminder.is_sent.is_(False),
        )
    ).all()
    for reminder in unsent_reminders:
        db.delete(reminder)
    db.delete(registration)
    db.commit()


@router.get("/reminders/upcoming", response_model=list[ReminderRead])
def get_upcoming_reminders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    registrations = db.scalars(
        select(Registration)
        .where(Registration.user_id == current_user.id)
        .options(selectinload(Registration.event))
    ).all()
    now = datetime.utcnow()
    reminders: list[ReminderRead] = []
    for registration in registrations:
        if registration.event.start_time < now:
            continue
        minutes_until_event = int((registration.event.start_time - now).total_seconds() // 60)
        for offset in _serialize_offsets(registration.reminder_offsets):
            if minutes_until_event <= offset:
                reminders.append(
                    ReminderRead(
                        event_id=registration.event.id,
                        event_title=registration.event.title,
                        location=registration.event.location,
                        start_time=registration.event.start_time,
                        trigger_offset_minutes=offset,
                        minutes_until_event=minutes_until_event,
                        status="due-now" if minutes_until_event <= offset else "scheduled",
                    )
                )
    reminders.sort(key=lambda item: (item.minutes_until_event, item.trigger_offset_minutes))
    return reminders

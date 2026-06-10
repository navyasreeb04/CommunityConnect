from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db import SessionLocal
from app.email_service import send_event_email
from app.models import Reminder
from app.notifications import create_notification


scheduler = AsyncIOScheduler()


async def process_due_reminders():
    with SessionLocal() as db:
        reminders = db.scalars(
            select(Reminder)
            .where(Reminder.reminder_time <= datetime.utcnow(), Reminder.is_sent.is_(False))
            .options(selectinload(Reminder.user), selectinload(Reminder.event))
        ).all()

        for reminder in reminders:
            message = f"Reminder for your event: {reminder.event.title}"
            # Scheduler logic: each reminder is selected only while is_sent is false, then marked true.
            await send_event_email(reminder.user, reminder.event, "CommunityConnect event reminder", "Reminder for your event")
            await create_notification(db, reminder.user_id, message)
            reminder.is_sent = True
            db.commit()


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(process_due_reminders, "interval", minutes=1, id="event-reminders", replace_existing=True)
        scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()

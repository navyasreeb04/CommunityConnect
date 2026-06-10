from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

from app.core.config import settings
from app.models import Event, User


def _mail_config() -> ConnectionConfig | None:
    if not settings.mail_username or not settings.mail_password or not settings.mail_from:
        return None

    return ConnectionConfig(
        MAIL_USERNAME=settings.mail_username,
        MAIL_PASSWORD=settings.mail_password,
        MAIL_FROM=settings.mail_from,
        MAIL_PORT=settings.mail_port,
        MAIL_SERVER=settings.mail_server,
        MAIL_FROM_NAME="CommunityConnect",
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
    )


async def send_event_email(user: User, event: Event, subject: str, message: str):
    config = _mail_config()
    if config is None:
        return

    body = (
        f"<h2>{event.title}</h2>"
        f"<p><strong>Event time:</strong> {event.start_time}</p>"
        f"<p>{message}</p>"
    )
    email = MessageSchema(
        subject=subject,
        recipients=[user.email],
        body=body,
        subtype=MessageType.html,
    )

    # Email sending: FastAPI-Mail uses Gmail SMTP credentials from environment variables.
    await FastMail(config).send_message(email)

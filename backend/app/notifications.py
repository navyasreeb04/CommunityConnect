from fastapi import WebSocket
from sqlalchemy.orm import Session

from app.models import Notification


class NotificationConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        connections = self.active_connections.get(user_id, [])
        if websocket in connections:
            connections.remove(websocket)
        if not connections:
            self.active_connections.pop(user_id, None)

    async def send_to_user(self, user_id: int, payload: dict):
        # WebSocket communication: push fresh notifications only to sockets owned by this user.
        for websocket in list(self.active_connections.get(user_id, [])):
            try:
                await websocket.send_json(payload)
            except RuntimeError:
                self.disconnect(user_id, websocket)


manager = NotificationConnectionManager()


async def create_notification(db: Session, user_id: int, message: str, push: bool = True) -> Notification:
    notification = Notification(user_id=user_id, message=message)
    db.add(notification)
    db.commit()
    db.refresh(notification)

    if push:
        await manager.send_to_user(
            user_id,
            {
                "id": notification.id,
                "user_id": notification.user_id,
                "message": notification.message,
                "is_read": notification.is_read,
                "created_at": notification.created_at.isoformat(),
            },
        )
    return notification

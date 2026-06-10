import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db import Base, SessionLocal, engine
from app.routers import analytics, auth, communities, events, feedback, notifications, posts
from app.scheduler import start_scheduler, stop_scheduler
from app.seed import seed_database


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="1.0.0")
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173",
    "http://localhost:3000",
    frontend_url,],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)

    app.include_router(auth.router, prefix="/api")
    app.include_router(communities.router, prefix="/api")
    app.include_router(posts.router, prefix="/api")
    app.include_router(events.router, prefix="/api")
    app.include_router(feedback.router, prefix="/api")
    app.include_router(analytics.router, prefix="/api")
    app.include_router(notifications.router, prefix="/api")
    app.include_router(notifications.ws_router)
    app.add_event_handler("startup", start_scheduler)
    app.add_event_handler("shutdown", stop_scheduler)

    @app.get("/health")
    def health_check():
        return {"status": "ok", "service": settings.app_name}

    return app


app = create_app()

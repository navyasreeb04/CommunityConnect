from dataclasses import dataclass
import os


@dataclass
class Settings:
    app_name: str = "CommunityConnect API"
    # SQLite fallback keeps local development easy, while the code remains MySQL-ready.
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./communityconnect.db")
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "communityconnect-dev-secret")
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    mail_username: str = os.getenv("MAIL_USERNAME", "")
    mail_password: str = os.getenv("MAIL_PASSWORD", "")
    mail_from: str = os.getenv("MAIL_FROM", os.getenv("MAIL_USERNAME", ""))
    mail_server: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    mail_port: int = int(os.getenv("MAIL_PORT", "587"))


settings = Settings()

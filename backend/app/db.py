from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings


connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
elif settings.database_url.startswith("mysql"):
    # Finds the ca.pem file you placed in the root backend folder
    ca_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ca.pem")
    
    connect_args["ssl"] = {
        "sslmode": "REQUIRED",
        "ca": ca_path
    }
engine = create_engine(settings.database_url, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()

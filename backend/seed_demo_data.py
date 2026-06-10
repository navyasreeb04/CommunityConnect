from app.db import Base, SessionLocal, engine
from app.demo_seed import seed_demo_data


def main():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        result = seed_demo_data(db)
    print(result)


if __name__ == "__main__":
    main()

import argparse
from sqlmodel import Session, SQLModel, select

from app.database import engine
from app.models.user import User
from app.models.course import Course
from app.models.notes import Note  # ensures model metadata is registered
from app.utilities.security import encrypt_password


DEFAULT_COURSES = [
    {"code": "INFO2602", "name": "Web Information Technologies"},
    {"code": "COMP2605", "name": "Computer Architecture"},
    {"code": "MATH2110", "name": "Linear Algebra II"},
    {"code": "INFO2600", "name": "Database Management"},
    {"code": "COMP2501", "name": "Operating Systems"},
    {"code": "COMP2603", "name": "Object-Oriented Programming"},
    {"code": "COMP2604", "name": "Data Structures"},
    {"code": "COMP2606", "name": "Computer Networks"},
    {"code": "COMP3601", "name": "Cybersecurity Fundamentals"},
    {"code": "MATH1141", "name": "Calculus I"},
]


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    print("Database tables initialized.")


def seed_courses() -> None:
    added = 0

    with Session(engine) as db:
        for course_data in DEFAULT_COURSES:
            existing = db.exec(
                select(Course).where(Course.code == course_data["code"])
            ).one_or_none()

            if existing:
                continue

            db.add(Course(**course_data))
            added += 1

        db.commit()

    print(f"Courses seeded. Added {added} new course(s).")


def seed_user(username: str, email: str, password: str, role: str = "") -> None:
    with Session(engine) as db:
        existing_username = db.exec(
            select(User).where(User.username == username)
        ).one_or_none()

        if existing_username:
            print(f"User '{username}' already exists. No new user created.")
            return

        existing_email = db.exec(
            select(User).where(User.email == email)
        ).one_or_none()

        if existing_email:
            print(f"Email '{email}' is already in use. No new user created.")
            return

        user = User(
            username=username,
            email=email,
            password=encrypt_password(password),
            role=role,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

    print(f"User '{username}' created successfully.")


def seed_bob() -> None:
    username = "bob"
    email = "bob@gmail.com"
    password = "bobpass"

    with Session(engine) as db:
        existing = db.exec(
            select(User).where(User.username == username)
        ).one_or_none()

        if existing:
            print("Bob already exists. Skipping.")
            return

        user = User(
            username=username,
            email=email,
            password=encrypt_password(password),
            role="user",
        )

        db.add(user)
        db.commit()
        db.refresh(user)

    print("Bob created successfully.")


def init_all(email: str) -> None:
    init_db()
    seed_courses()
    seed_bob(email)
    print("Initialization complete.")


def main():
    parser = argparse.ArgumentParser(description="CoScribe CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("init-db")
    subparsers.add_parser("seed-courses")
    subparsers.add_parser("seed-bob")
    subparsers.add_parser("init-all")

    args = parser.parse_args()

    if args.command == "init-db":
        init_db()
    elif args.command == "seed-courses":
        seed_courses()
    elif args.command == "seed-bob":
        seed_bob()
    elif args.command == "init-all":
        init_db()
        seed_courses()
        seed_bob()

if __name__ == "__main__":
    main()
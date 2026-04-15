from sqlmodel import Session, select
from app.models.userCourse import UserCourse
from typing import List


class UserCourseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_courses(self, user_id: int) -> List[UserCourse]:
        return self.db.exec(
            select(UserCourse).where(UserCourse.user_id == user_id)
        ).all()

    def add_course_to_user(self, user_id: int, course_id: int):
        existing = self.db.exec(
            select(UserCourse).where(
                UserCourse.user_id == user_id,
                UserCourse.course_id == course_id
            )
        ).one_or_none()

        if existing:
            return existing

        uc = UserCourse(user_id=user_id, course_id=course_id)
        self.db.add(uc)
        self.db.commit()
        self.db.refresh(uc)
        return uc

    def remove_course_from_user(self, user_id: int, course_id: int):
        uc = self.db.exec(
            select(UserCourse).where(
                UserCourse.user_id == user_id,
                UserCourse.course_id == course_id
            )
        ).one_or_none()

        if uc:
            self.db.delete(uc)
            self.db.commit()
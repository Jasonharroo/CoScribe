from sqlmodel import Session, select
from app.models.course import Course
from typing import List, Optional


class CourseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> List[Course]:
        return self.db.exec(select(Course).order_by(Course.code)).all()

    def get_by_id(self, course_id: int) -> Optional[Course]:
        return self.db.get(Course, course_id)
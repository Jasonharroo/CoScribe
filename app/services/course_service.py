from app.repositories.course import CourseRepository


class CourseService:
    def __init__(self, course_repo: CourseRepository):
        self.course_repo = course_repo

    def get_all_courses(self):
        return self.course_repo.get_all()

    def get_course(self, course_id: int):
        return self.course_repo.get_by_id(course_id)
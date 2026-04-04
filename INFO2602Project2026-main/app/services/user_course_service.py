from app.repositories.user_course import UserCourseRepository


class UserCourseService:
    def __init__(self, repo: UserCourseRepository):
        self.repo = repo

    def get_user_courses(self, user_id: int):
        return self.repo.get_user_courses(user_id)

    def add_course(self, user_id: int, course_id: int):
        return self.repo.add_course_to_user(user_id, course_id)

    def remove_course(self, user_id: int, course_id: int):
        return self.repo.remove_course_from_user(user_id, course_id)
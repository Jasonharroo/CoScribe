from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from sqlmodel import Session, select

from app.database import get_session
from app.dependencies.auth import AuthDep
from app.models.course import Course
from app.repositories.user_course import UserCourseRepository
from app.services.user_course_service import UserCourseService

from . import templates

router = APIRouter(prefix="/courses", tags=["Courses"])
api_router = APIRouter(prefix="/user-courses", tags=["User Courses API"])


@api_router.post("/{course_id}")
def add_course(
    course_id: int,
    user: AuthDep,
    db: Session = Depends(get_session),
):
    uc_repo = UserCourseRepository(db)
    uc_service = UserCourseService(uc_repo)
    uc_service.add_course(user.id, course_id)
    return {"message": "added"}


@api_router.delete("/{course_id}")
def remove_course(
    course_id: int,
    user: AuthDep,
    db: Session = Depends(get_session),
):
    uc_repo = UserCourseRepository(db)
    uc_service = UserCourseService(uc_repo)
    uc_service.remove_course(user.id, course_id)
    return {"message": "removed"}

@router.get("/", response_class=HTMLResponse)
def manage_courses_view(
    request: Request,
    user: AuthDep,
    db: Session = Depends(get_session),
):
    # all courses (catalog)
    courses = db.exec(select(Course)).all()

    # user-selected courses
    uc_repo = UserCourseRepository(db)
    uc_service = UserCourseService(uc_repo)
    user_courses = uc_service.get_user_courses(user.id)

    user_course_ids = [uc.course_id for uc in user_courses]

    return templates.TemplateResponse(
        request=request,
        name="courses.html",
        context={
            "user": user,
            "courses": courses,
            "user_course_ids": user_course_ids,
        },
    )
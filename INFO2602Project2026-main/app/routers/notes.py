from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlmodel import Session, select
from pathlib import Path

from app.database import get_session
from app.repositories.note import NoteRepository
from app.repositories.voiceNote import VoiceNoteRepository
from app.repositories.user_course import UserCourseRepository
from app.services.voice_note_service import VoiceNoteService
from app.services.note_service import NoteService
from app.services.user_course_service import UserCourseService
from app.schemas.note import NoteCreate, NoteUpdate
from app.dependencies.auth import AuthDep
from app.models.course import Course

from . import templates

router = APIRouter(prefix="/notes", tags=["Notes"])
api_router = APIRouter(prefix="/notes", tags=["Notes API"])


def get_note_service(db: Session = Depends(get_session)):
    repo = NoteRepository(db)
    return NoteService(repo)


def get_voice_note_service(db: Session = Depends(get_session)):
    repo = VoiceNoteRepository(db)
    return VoiceNoteService(repo)


def get_user_registered_courses(db: Session, user_id: int):
    uc_repo = UserCourseRepository(db)
    uc_service = UserCourseService(uc_repo)

    user_course_links = uc_service.get_user_courses(user_id)
    course_ids = [uc.course_id for uc in user_course_links]

    if not course_ids:
        return []

    return db.exec(
        select(Course).where(Course.id.in_(course_ids))
    ).all()


@router.get("", response_class=HTMLResponse)
def all_notes_view(
    request: Request,
    user: AuthDep,
    db: Session = Depends(get_session),
):
    courses = get_user_registered_courses(db, user.id)

    return templates.TemplateResponse(
        request=request,
        name="notes_view_page.html",
        context={
            "user": user,
            "courses": courses,
        }
    )


@router.get("/new", response_class=HTMLResponse)
def new_note_view(
    request: Request,
    user: AuthDep,
    db: Session = Depends(get_session),
    course_id: int | None = None,
):
    courses = get_user_registered_courses(db, user.id)

    if not courses:
        return RedirectResponse(url="/courses/", status_code=303)

    valid_course_ids = {course.id for course in courses}
    selected_course_id = course_id if course_id in valid_course_ids else courses[0].id

    return templates.TemplateResponse(
        request=request,
        name="notes.html",
        context={
            "user": user,
            "note": None,
            "is_new": True,
            "courses": courses,
            "selected_course_id": selected_course_id,
            "course_notes": [],
            "voice_notes": [],
        }
    )

@router.get("/new", response_class=HTMLResponse)
def new_note_view(
    request: Request,
    user: AuthDep,
    db: Session = Depends(get_session),
):
    course_repo = CourseRepository(db)
    course_service = CourseService(course_repo)
    courses = course_service.get_all_courses()

    return templates.TemplateResponse(
        request=request,
        name="notes.html",  
        context={
            "user": user,
            "note": None,
            "is_new": True,
            "courses": courses,
            "selected_course_id": None,
            "course_notes": [],
            "voice_notes": [],
        }
    )

@router.get("/{note_id}", response_class=HTMLResponse)
def note_view(
    note_id: int,
    request: Request,
    user: AuthDep,
    service: NoteService = Depends(get_note_service),
    voice_note_service: VoiceNoteService = Depends(get_voice_note_service),
    db: Session = Depends(get_session),
):
    note = service.get_note(note_id)

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if note.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    courses = get_user_registered_courses(db, user.id)
    course_notes = service.get_notes_by_owner_and_course(user.id, note.course_id)
    voice_notes = voice_note_service.get_voice_notes_for_note(note.id)

    return templates.TemplateResponse(
        request=request,
        name="notes.html",
        context={
            "user": user,
            "note": note,
            "is_new": False,
            "courses": courses,
            "selected_course_id": note.course_id,
            "course_notes": course_notes,
            "voice_notes": voice_notes,
        }
    )


@api_router.post("/")
def create_note(
    note: NoteCreate,
    user: AuthDep,
    service: NoteService = Depends(get_note_service),
    db: Session = Depends(get_session),
):
    uc_repo = UserCourseRepository(db)
    uc_service = UserCourseService(uc_repo)

    user_course_links = uc_service.get_user_courses(user.id)
    allowed_course_ids = {uc.course_id for uc in user_course_links}

    if note.course_id not in allowed_course_ids:
        raise HTTPException(status_code=403, detail="Not authorized for this course")

    return service.create_note(note, user.id)


@api_router.get("/")
def get_notes(
    user: AuthDep,
    service: NoteService = Depends(get_note_service)
):
    return service.get_notes_by_owner(user.id)


@api_router.get("/{note_id}")
def get_note_api(
    note_id: int,
    user: AuthDep,
    service: NoteService = Depends(get_note_service)
):
    note = service.get_note(note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return note

@api_router.get("/user/{user_id}/public")
def get_public_notes_by_user(
    user_id: int,
    service: NoteService = Depends(get_note_service),
):
    return service.get_public_notes_by_user(user_id)

@api_router.put("/{note_id}")
def update_note(
    note_id: int,
    note: NoteUpdate,
    user: AuthDep,
    service: NoteService = Depends(get_note_service)
):
    existing_note = service.get_note(note_id)

    if not existing_note:
        raise HTTPException(status_code=404, detail="Note not found")

    if existing_note.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return service.update_note(note_id, note)


@api_router.delete("/{note_id}")
def delete_note(
    note_id: int,
    user: AuthDep,
    service: NoteService = Depends(get_note_service),
    voice_note_service: VoiceNoteService = Depends(get_voice_note_service),
):
    existing_note = service.get_note(note_id)

    if not existing_note:
        raise HTTPException(status_code=404, detail="Note not found")

    if existing_note.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    voice_notes = voice_note_service.get_voice_notes_for_note(note_id)

    for vn in voice_notes:
        if vn.file_path and vn.file_path.startswith("/static/"):
            relative_path = vn.file_path.removeprefix("/static/")
            disk_path = Path("app/static") / relative_path

            if disk_path.exists():
                disk_path.unlink()

        voice_note_service.delete_voice_note(vn)

    service.delete_note(note_id)

    return {"message": "Note and associated voice notes deleted"}

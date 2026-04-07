from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlmodel import Session
from app.database import get_session
from app.repositories.note import NoteRepository
from app.repositories.course import CourseRepository
from app.repositories.voiceNote import VoiceNoteRepository
from app.services.voice_note_service import VoiceNoteService
from app.services.note_service import NoteService
from app.services.course_service import CourseService
from app.schemas.note import NoteCreate, NoteUpdate
from app.dependencies.auth import AuthDep
from typing import List
from . import templates

router = APIRouter(prefix="/notes", tags=["Notes"])
api_router = APIRouter(prefix="/notes", tags=["Notes API"])

def get_note_service(db: Session = Depends(get_session)):
    repo = NoteRepository(db)
    return NoteService(repo)

def get_voice_note_service(db: Session = Depends(get_session)):
    repo = VoiceNoteRepository(db)
    return VoiceNoteService(repo)

@router.get("/new", response_class=HTMLResponse)
def new_note_view(
    request: Request,
    user: AuthDep,
    db: Session = Depends(get_session),
    course_id: int | None = None,
):
    course_repo = CourseRepository(db)
    course_service = CourseService(course_repo)
    courses = course_service.get_all_courses()

    selected_course_id = course_id or (courses[0].id if courses else 1)
    
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
    
    course_repo = CourseRepository(db)
    course_service = CourseService(course_repo)
    courses = course_service.get_all_courses()
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
    service: NoteService = Depends(get_note_service)
):
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
    service: NoteService = Depends(get_note_service)
):
    existing_note = service.get_note(note_id)

    if not existing_note:
        raise HTTPException(status_code=404, detail="Note not found")

    if existing_note.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    service.delete_note(note_id)
    return {"message": "Note deleted"}
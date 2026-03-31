from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.database import get_session
from app.repositories.note import NoteRepository
from app.services.note_service import NoteService
from app.schemas.note import NoteCreate, NoteUpdate
from app.dependencies.auth import AuthDep

router = APIRouter(prefix="/notes", tags=["Notes"])


def get_note_service(db: Session = Depends(get_session)):
    repo = NoteRepository(db)
    return NoteService(repo)


@router.post("/")
def create_note(
    note: NoteCreate,
    user: AuthDep,
    service: NoteService = Depends(get_note_service)
):
    return service.create_note(note, user.id)


@router.get("/")
def get_notes(
    user: AuthDep,
    service: NoteService = Depends(get_note_service)
):
    return service.get_all_notes()


@router.get("/{note_id}")
def get_note(
    note_id: int,
    user: AuthDep,
    service: NoteService = Depends(get_note_service)
):
    note = service.get_note(note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.put("/{note_id}")
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


@router.delete("/{note_id}")
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
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.database import get_session
from app.repositories.note import NoteRepository
from app.services.note_service import NoteService
from app.schemas.note import NoteCreate, NoteUpdate

router = APIRouter(prefix="/notes", tags=["Notes"])


def get_note_service(db: Session = Depends(get_session)):
    repo = NoteRepository(db)
    return NoteService(repo)


@router.post("/")
def create_note(note: NoteCreate, service: NoteService = Depends(get_note_service)):
    # TEMP: replace with logged-in user later
    owner_id = 1
    return service.create_note(note, owner_id)


@router.get("/")
def get_notes(service: NoteService = Depends(get_note_service)):
    return service.get_all_notes()


@router.get("/{note_id}")
def get_note(note_id: int, service: NoteService = Depends(get_note_service)):
    return service.get_note(note_id)


@router.put("/{note_id}")
def update_note(note_id: int, note: NoteUpdate, service: NoteService = Depends(get_note_service)):
    return service.update_note(note_id, note)


@router.delete("/{note_id}")
def delete_note(note_id: int, service: NoteService = Depends(get_note_service)):
    service.delete_note(note_id)
    return {"message": "Note deleted"}
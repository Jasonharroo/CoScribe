from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from sqlmodel import Session

from app.database import get_session
from app.dependencies.auth import AuthDep
from app.models.voiceNote import VoiceNote
from app.repositories.note import NoteRepository
from app.repositories.voiceNote import VoiceNoteRepository
from app.services.note_service import NoteService
from app.services.voice_note_service import VoiceNoteService

router = APIRouter(prefix="/voice-notes", tags=["Voice Notes API"])

UPLOAD_DIR = Path("app/static/uploads/voice_notes")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def get_voice_note_service(db: Session = Depends(get_session)) -> VoiceNoteService:
    repo = VoiceNoteRepository(db)
    return VoiceNoteService(repo)


def get_note_service(db: Session = Depends(get_session)) -> NoteService:
    repo = NoteRepository(db)
    return NoteService(repo)


@router.post("/")
async def create_voice_note(
    user: AuthDep,
    note_id: int = Form(...),
    duration_seconds: int = Form(0),
    audio: UploadFile = File(...),
    voice_note_service: VoiceNoteService = Depends(get_voice_note_service),
    note_service: NoteService = Depends(get_note_service),
):
    note = note_service.get_note(note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if note.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if not audio.filename:
        raise HTTPException(status_code=400, detail="Missing audio file")

    suffix = Path(audio.filename).suffix or ".webm"
    filename = f"{uuid4().hex}{suffix}"
    file_path = UPLOAD_DIR / filename

    contents = await audio.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    public_path = f"/static/uploads/voice_notes/{filename}"

    voice_note = VoiceNote(
        note_id=note_id,
        owner_id=user.id,
        file_path=public_path,
        duration_seconds=duration_seconds,
    )

    saved = voice_note_service.create_voice_note(voice_note)

    return JSONResponse(
        {
            "id": saved.id,
            "note_id": saved.note_id,
            "file_path": saved.file_path,
            "duration_seconds": saved.duration_seconds or 0,
            "created_at": saved.created_at.isoformat(),
        }
    )


@router.get("/note/{note_id}")
def get_voice_notes_for_note(
    note_id: int,
    user: AuthDep,
    voice_note_service: VoiceNoteService = Depends(get_voice_note_service),
    note_service: NoteService = Depends(get_note_service),
):
    note = note_service.get_note(note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if note.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    voice_notes = voice_note_service.get_voice_notes_for_note(note_id)

    return [
        {
            "id": vn.id,
            "note_id": vn.note_id,
            "file_path": vn.file_path,
            "duration_seconds": vn.duration_seconds or 0,
            "created_at": vn.created_at.isoformat(),
        }
        for vn in voice_notes
    ]


@router.delete("/{voice_note_id}")
def delete_voice_note(
    voice_note_id: int,
    user: AuthDep,
    voice_note_service: VoiceNoteService = Depends(get_voice_note_service),
):
    voice_note = voice_note_service.get_voice_note(voice_note_id)
    if not voice_note:
        raise HTTPException(status_code=404, detail="Voice note not found")

    if voice_note.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # delete file if it exists
    if voice_note.file_path.startswith("/static/"):
        relative_path = voice_note.file_path.removeprefix("/static/")
        disk_path = Path("app/static") / relative_path
        if disk_path.exists():
            disk_path.unlink()

    voice_note_service.delete_voice_note(voice_note)
    return {"message": "Voice note deleted"}
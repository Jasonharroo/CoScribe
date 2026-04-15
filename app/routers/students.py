from fastapi import Request, HTTPException
from fastapi.responses import HTMLResponse
from app.dependencies.session import SessionDep
from app.dependencies.auth import AuthDep
from app.repositories.user import UserRepository
from app.repositories.note import NoteRepository
from app.services.note_service import NoteService
from app.repositories.collab import CollaborationRepository
from app.services.collab_service import CollaborationService
from app.models.collab import Collaboration
from fastapi import APIRouter
from . import templates

router = APIRouter()
api_router = APIRouter()


@router.get("/students", response_class=HTMLResponse)
async def students_view(
    request: Request,
    user: AuthDep,
    db: SessionDep
):
    return templates.TemplateResponse(
        request=request,
        name="students.html",
        context={"user": user}
    )


@router.get("/students/{student_id}", response_class=HTMLResponse)
async def student_profile_view(
    student_id: int,
    request: Request,
    user: AuthDep,
    db: SessionDep
):
    user_repo = UserRepository(db)
    student = user_repo.get_by_id(student_id)

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return templates.TemplateResponse(
        request=request,
        name="student_profile.html",
        context={
            "user": user,
            "student_id": student_id,
        }
    )


@api_router.get("/users/{user_id}/notes")
async def get_user_notes(
    user_id: int,
    current_user: AuthDep,
    db: SessionDep
):

    user_repo = UserRepository(db)
    target_user = user_repo.get_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    note_repo = NoteRepository(db)
    note_service = NoteService(note_repo)

    notes = note_service.get_public_notes_by_user(user_id)

    return notes

@api_router.post("/notes/{note_id}/collab-request")
async def request_collaboration(
    note_id: int,
    current_user: AuthDep,
    db: SessionDep
):
    note_repo = NoteRepository(db)
    note = note_repo.get_by_id(note_id)

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if note.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You can't request to collaborate on your own note")

    collab_repo = CollaborationRepository(db)
    collab_service = CollaborationService(collab_repo)

    existing = collab_service.get_existing_request(current_user.id, note_id)
    if existing:
        return {
            "message": "Request already exists",
            "status": existing.status,
            "collaboration_id": existing.id,
            "note_id": note_id,
        }

    created = collab_service.create_request(current_user.id, note_id)

    return {
        "message": "Collaboration request sent",
        "status": created.status,
        "collaboration_id": created.id,
        "note_id": note_id,
        "requester_id": current_user.id,
        "note_owner_id": note.owner_id,
    }

@api_router.get("/collab-requests/pending")
async def get_pending_requests(
    current_user: AuthDep,
    db: SessionDep
):
    note_repo = NoteRepository(db)
    collab_repo = CollaborationRepository(db)
    collab_service = CollaborationService(collab_repo)

    notes = note_repo.get_by_owner(current_user.id)
    note_ids = [n.id for n in notes]

    requests = collab_service.get_pending_for_note_owner(note_ids)

    return requests

@api_router.post("/collab-requests/{collab_id}/respond")
async def respond_to_collab_request(
    collab_id: int,
    status: str,
    current_user: AuthDep,
    db: SessionDep
):
    if status not in {"accepted", "rejected"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    collab = db.get(Collaboration, collab_id)
    if not collab:
        raise HTTPException(status_code=404, detail="Request not found")

    note_repo = NoteRepository(db)
    note = note_repo.get_by_id(collab.note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    collab_repo = CollaborationRepository(db)
    collab_service = CollaborationService(collab_repo)

    updated = collab_service.update_status(collab_id, status)

    return {
        "message": f"Request {status}",
        "collaboration_id": updated.id,
        "status": updated.status,
        "note_id": updated.note_id,
        "user_id": updated.user_id,
    }
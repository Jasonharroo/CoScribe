from fastapi import Request
from fastapi.responses import HTMLResponse
from sqlmodel import select

from app.dependencies.session import SessionDep
from app.dependencies.auth import AuthDep
from app.repositories.note import NoteRepository
from app.services.note_service import NoteService
from app.repositories.user_course import UserCourseRepository
from app.services.user_course_service import UserCourseService
from app.repositories.collab import CollaborationRepository
from app.services.collab_service import CollaborationService
from app.models.course import Course
from app.models.voiceNote import VoiceNote
from app.models.collab import Collaboration

from . import router, templates


@router.get("/app", response_class=HTMLResponse)
async def user_home_view(
    request: Request,
    user: AuthDep,
    db: SessionDep,
):
    collab_repo = CollaborationRepository(db)
    collab_service = CollaborationService(collab_repo)

    note_repo = NoteRepository(db)
    note_service = NoteService(note_repo)

    # Notes owned by the current user
    own_notes = note_service.get_notes_by_owner(user.id)

    # Pending collaboration requests should only be for notes I own
    own_note_ids = [n.id for n in own_notes]
    pending_requests = collab_service.get_pending_for_note_owner(own_note_ids)
    pending_count = len(pending_requests)

    # Notes shared with me through accepted collaborations
    accepted_collabs = db.exec(
        select(Collaboration).where(
            Collaboration.user_id == user.id,
            Collaboration.status == "accepted",
        )
    ).all()

    collab_note_ids = [c.note_id for c in accepted_collabs]
    collab_notes = note_service.get_notes_by_ids(collab_note_ids)

    # Combine owned + shared notes without duplicates
    notes_map = {note.id: note for note in own_notes}
    for note in collab_notes:
        notes_map[note.id] = note
    notes = list(notes_map.values())

    uc_repo = UserCourseRepository(db)
    uc_service = UserCourseService(uc_repo)

    user_courses_links = uc_service.get_user_courses(user.id)
    course_ids = [uc.course_id for uc in user_courses_links]

    if course_ids:
        courses = db.exec(
            select(Course).where(Course.id.in_(course_ids))
        ).all()
    else:
        courses = []

    voice_note_count = len(
        db.exec(select(VoiceNote).where(VoiceNote.owner_id == user.id)).all()
    )

    collaborator_count = len(
        db.exec(select(Collaboration).where(Collaboration.user_id == user.id)).all()
    )

    return templates.TemplateResponse(
        request=request,
        name="home.html",
        context={
            "user": user,
            "notes": notes,
            "note_count": len(notes),
            "courses": courses,
            "course_count": len(courses),
            "voice_note_count": voice_note_count,
            "collaborator_count": collaborator_count,
            "pending_collab_count": pending_count,
        },
    )
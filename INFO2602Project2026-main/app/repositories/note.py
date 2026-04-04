from sqlmodel import Session, select
from app.models.notes import Note
from app.schemas.note import NoteCreate, NoteUpdate
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)


class NoteRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, note_data: NoteCreate, owner_id: int) -> Note:
        try:
            note = Note(**note_data.model_dump(), owner_id=owner_id)
            self.db.add(note)
            self.db.commit()
            self.db.refresh(note)
            return note
        except Exception as e:
            logger.error(f"Error creating note: {e}")
            self.db.rollback()
            raise

    def get_all(self) -> List[Note]:
        return self.db.exec(select(Note)).all()

    def get_by_id(self, note_id: int) -> Optional[Note]:
        return self.db.get(Note, note_id)

    def update(self, note_id: int, note_data: NoteUpdate) -> Note:
        note = self.db.get(Note, note_id)
        if not note:
            raise Exception("Note not found")

        if note_data.title is not None:
            note.title = note_data.title
        if note_data.content is not None:
            note.content = note_data.content

        try:
            self.db.add(note)
            self.db.commit()
            self.db.refresh(note)
            return note
        except Exception as e:
            logger.error(f"Error updating note: {e}")
            self.db.rollback()
            raise

    def delete(self, note_id: int):
        note = self.db.get(Note, note_id)
        if not note:
            raise Exception("Note not found")

        try:
            self.db.delete(note)
            self.db.commit()
        except Exception as e:
            logger.error(f"Error deleting note: {e}")
            self.db.rollback()
            raise
    
    def get_by_owner(self, owner_id: int) -> List[Note]:
        return self.db.exec(
            select(Note).where(Note.owner_id == owner_id).order_by(Note.id.desc())
        ).all()
    
    def get_by_owner_and_course(self, owner_id: int, course_id: int) -> List[Note]:
        return self.db.exec(
            select(Note)
            .where(Note.owner_id == owner_id, Note.course_id == course_id)
            .order_by(Note.id.desc())
        ).all()
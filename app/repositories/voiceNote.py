from sqlmodel import Session, select
from typing import List, Optional
from app.models.voiceNote import VoiceNote


class VoiceNoteRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, voice_note: VoiceNote) -> VoiceNote:
        self.db.add(voice_note)
        self.db.commit()
        self.db.refresh(voice_note)
        return voice_note

    def get_by_note(self, note_id: int) -> List[VoiceNote]:
        return self.db.exec(
            select(VoiceNote)
            .where(VoiceNote.note_id == note_id)
            .order_by(VoiceNote.id.desc())
        ).all()

    def get_by_id(self, voice_note_id: int) -> Optional[VoiceNote]:
        return self.db.get(VoiceNote, voice_note_id)

    def delete(self, voice_note: VoiceNote):
        self.db.delete(voice_note)
        self.db.commit()
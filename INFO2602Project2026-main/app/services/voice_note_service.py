from app.repositories.voiceNote import VoiceNoteRepository
from app.models.voiceNote import VoiceNote
from typing import List, Optional


class VoiceNoteService:
    def __init__(self, repo: VoiceNoteRepository):
        self.repo = repo

    def create_voice_note(self, voice_note: VoiceNote) -> VoiceNote:
        return self.repo.create(voice_note)

    def get_voice_notes_for_note(self, note_id: int) -> List[VoiceNote]:
        return self.repo.get_by_note(note_id)

    def get_voice_note(self, voice_note_id: int) -> Optional[VoiceNote]:
        return self.repo.get_by_id(voice_note_id)

    def delete_voice_note(self, voice_note: VoiceNote):
        self.repo.delete(voice_note)
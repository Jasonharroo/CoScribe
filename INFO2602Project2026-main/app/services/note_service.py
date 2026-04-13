from app.repositories.note import NoteRepository
from app.schemas.note import NoteCreate, NoteUpdate


class NoteService:
    def __init__(self, note_repo: NoteRepository):
        self.note_repo = note_repo

    def create_note(self, note_data: NoteCreate, owner_id: int):
        return self.note_repo.create(note_data, owner_id)

    def get_all_notes(self):
        return self.note_repo.get_all()

    def get_note(self, note_id: int):
        return self.note_repo.get_by_id(note_id)

    def update_note(self, note_id: int, note_data: NoteUpdate):
        return self.note_repo.update(note_id, note_data)

    def delete_note(self, note_id: int):
        self.note_repo.delete(note_id)

    def get_notes_by_owner(self, owner_id: int):
        return self.note_repo.get_by_owner(owner_id)
    
    def get_notes_by_owner_and_course(self, owner_id: int, course_id: int):
        return self.note_repo.get_by_owner_and_course(owner_id, course_id)
    
    def get_public_notes_by_user(self, user_id: int):
        return self.note_repo.get_public_notes_by_user(user_id)
    
    
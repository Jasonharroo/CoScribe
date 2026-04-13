from app.repositories.collab import CollaborationRepository

class CollaborationService:
    def __init__(self, repo: CollaborationRepository):
        self.repo = repo

    def get_existing_request(self, user_id: int, note_id: int):
        return self.repo.get_existing_request(user_id, note_id)

    def create_request(self, user_id: int, note_id: int, role: str = "editor"):
        return self.repo.create_request(user_id, note_id, role)

    def get_pending_for_note_owner(self, note_ids: list[int]):
        return self.repo.get_pending_for_note_owner(note_ids)

    def update_status(self, collab_id: int, status: str):
        return self.repo.update_status(collab_id, status)
    
    def get_accepted_collaboration(self, user_id: int, note_id: int):
        return self.repo.get_accepted_collaboration(user_id, note_id)
from sqlmodel import Session, select
from typing import Optional, List
from app.models.collab import Collaboration

class CollaborationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_existing_request(self, user_id: int, note_id: int) -> Optional[Collaboration]:
        return self.db.exec(
            select(Collaboration).where(
                Collaboration.user_id == user_id,
                Collaboration.note_id == note_id,
            )
        ).one_or_none()

    def create_request(self, user_id: int, note_id: int, role: str = "editor") -> Collaboration:
        collab = Collaboration(
            user_id=user_id,
            note_id=note_id,
            role=role,
            status="pending",
        )
        self.db.add(collab)
        self.db.commit()
        self.db.refresh(collab)
        return collab

    def get_pending_for_note_owner(self, note_ids: list[int]) -> List[Collaboration]:
        if not note_ids:
            return []
        return self.db.exec(
            select(Collaboration).where(
                Collaboration.note_id.in_(note_ids),
                Collaboration.status == "pending",
            )
        ).all()

    def update_status(self, collab_id: int, status: str) -> Optional[Collaboration]:
        collab = self.db.get(Collaboration, collab_id)
        if not collab:
            return None
        collab.status = status
        self.db.add(collab)
        self.db.commit()
        self.db.refresh(collab)
        return collab
    
    def get_accepted_collaboration(self, user_id: int, note_id: int) -> Optional[Collaboration]:
        return self.db.exec(
            select(Collaboration).where(
                Collaboration.user_id == user_id,
                Collaboration.note_id == note_id,
                Collaboration.status == "accepted",
            )
        ).one_or_none()
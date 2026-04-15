from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, timezone


class VoiceNote(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    note_id: int = Field(foreign_key="note.id")
    owner_id: int = Field(foreign_key="user.id")
    file_path: str
    duration_seconds: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
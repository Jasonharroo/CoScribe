from sqlmodel import SQLModel, Field
from typing import Optional


class Collaboration(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    note_id: int = Field(foreign_key="note.id")
    role: str = Field(default="editor") 
    status: str = Field(default="pending")
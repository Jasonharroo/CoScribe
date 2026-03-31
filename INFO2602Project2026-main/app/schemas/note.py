from sqlmodel import SQLModel
from typing import Optional


class NoteCreate(SQLModel):
    title: str
    content: str
    course_id: int


class NoteRead(SQLModel):
    id: int
    title: str
    content: str
    course_id: int
    owner_id: int


class NoteUpdate(SQLModel):
    title: Optional[str] = None
    content: Optional[str] = None
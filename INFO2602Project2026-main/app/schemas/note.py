from sqlmodel import SQLModel
from typing import Optional


class NoteCreate(SQLModel):
    title: str
    content: str
    course_id: int
    is_public: bool = False


class NoteRead(SQLModel):
    id: int
    title: str
    content: str
    course_id: int
    owner_id: int
    is_public: bool


class NoteUpdate(SQLModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_public: Optional[bool] = None  
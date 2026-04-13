from sqlmodel import SQLModel, Field
from typing import Optional

class Note(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    content: str
    course_id: int = Field(foreign_key="course.id")
    owner_id: int = Field(foreign_key="user.id")
    is_public: bool = Field(default=False)
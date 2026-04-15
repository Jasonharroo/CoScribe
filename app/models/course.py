from sqlmodel import SQLModel, Field
from typing import Optional


class Course(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    code: str = Field(index=True)
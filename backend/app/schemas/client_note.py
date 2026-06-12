from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class ClientNoteBase(BaseModel):
    content: str
    client_id: UUID
    parent_id: Optional[UUID] = None
    is_internal: bool = False

class ClientNoteCreate(ClientNoteBase):
    pass

class NoteAuthor(BaseModel):
    id: UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None

class ClientNoteUpdate(BaseModel):
    content: str

class ClientNote(ClientNoteBase):
    id: UUID
    author_id: Optional[UUID] = None
    author: Optional[NoteAuthor] = None
    is_internal: bool = False
    created_at: datetime
    updated_at: datetime
    replies: List["ClientNote"] = []

    model_config = ConfigDict(from_attributes=True)


from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class PersonalNoteBase(BaseModel):
    title: str
    content: Optional[str] = None
    url: Optional[str] = None

class PersonalNoteCreate(PersonalNoteBase):
    pass

class PersonalNoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    url: Optional[str] = None

class PersonalNote(PersonalNoteBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

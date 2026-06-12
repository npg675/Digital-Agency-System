from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class ClientTaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "TODO"
    service_category: Optional[str] = None
    due_date: Optional[datetime] = None
    assigned_to_id: Optional[UUID] = None

class ClientTaskCreate(ClientTaskBase):
    client_id: UUID

class ClientTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    service_category: Optional[str] = None
    due_date: Optional[datetime] = None
    assigned_to_id: Optional[UUID] = None

class ClientTaskResponse(ClientTaskBase):
    id: UUID
    client_id: UUID
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

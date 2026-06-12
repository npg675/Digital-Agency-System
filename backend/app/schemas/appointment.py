from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class AppointmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    status: str = "SCHEDULED"
    meeting_link: Optional[str] = None
    
    # We allow linking to either a client or a lead
    client_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None

class AppointmentCreate(AppointmentBase):
    host_id: UUID

class AppointmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None
    meeting_link: Optional[str] = None

class AppointmentResponse(AppointmentBase):
    id: UUID
    host_id: UUID
    google_event_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

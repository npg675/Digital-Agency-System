from typing import Optional, List
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

# ----------------------------
# Workflow Task Templates
# ----------------------------
class WorkflowTaskTemplateBase(BaseModel):
    title: str
    description: Optional[str] = None
    service_category: Optional[str] = None
    due_in_days: int = 0

class WorkflowTaskTemplateCreate(WorkflowTaskTemplateBase):
    pass

class WorkflowTaskTemplateResponse(WorkflowTaskTemplateBase):
    id: UUID
    workflow_id: UUID

    class Config:
        from_attributes = True

# ----------------------------
# Workflow Templates
# ----------------------------
class WorkflowTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None

class WorkflowTemplateCreate(WorkflowTemplateBase):
    pass

class WorkflowTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class WorkflowTemplateResponse(WorkflowTemplateBase):
    id: UUID
    created_at: datetime
    tasks: List[WorkflowTaskTemplateResponse] = []

    class Config:
        from_attributes = True

# ----------------------------
# Apply Workflow payload
# ----------------------------
class ApplyWorkflowPayload(BaseModel):
    staff_id: Optional[UUID] = None  # If provided, assigns all generated tasks to this staff

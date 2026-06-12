import uuid
from sqlalchemy import Column, String, Text, Uuid, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class WorkflowTemplate(Base, TimestampMixin):
    __tablename__ = "workflow_templates"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    tasks = relationship("WorkflowTaskTemplate", back_populates="workflow", cascade="all, delete-orphan")

class WorkflowTaskTemplate(Base, TimestampMixin):
    __tablename__ = "workflow_task_templates"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    workflow_id = Column(Uuid(as_uuid=True), ForeignKey("workflow_templates.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    service_category = Column(String, nullable=True)
    
    # SLA Target (in days)
    due_in_days = Column(Integer, default=0, nullable=False)

    workflow = relationship("WorkflowTemplate", back_populates="tasks")

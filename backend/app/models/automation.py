from sqlalchemy import Column, String, ForeignKey, Integer, Uuid, Float
from sqlalchemy.orm import relationship
import uuid
import enum
from sqlalchemy import Enum
from sqlalchemy.dialects.postgresql import JSONB
from app.models.base import Base, TimestampMixin

class AutomationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"

class Automation(Base, TimestampMixin):
    __tablename__ = "automations"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    client_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(Enum(AutomationStatus), default=AutomationStatus.DRAFT, nullable=False)
    
    # Track executions
    total_runs = Column(Integer, default=0)
    
    client = relationship("User", foreign_keys=[client_id])
    nodes = relationship("AutomationNode", back_populates="automation", cascade="all, delete-orphan")
    edges = relationship("AutomationEdge", back_populates="automation", cascade="all, delete-orphan")

class AutomationNode(Base, TimestampMixin):
    __tablename__ = "automation_nodes"

    id = Column(String, primary_key=True) # React Flow uses string IDs
    automation_id = Column(Uuid(as_uuid=True), ForeignKey("automations.id", ondelete="CASCADE"), nullable=False)
    
    type = Column(String, nullable=False) # e.g. "trigger", "action", "condition"
    subtype = Column(String, nullable=False) # e.g. "webhook", "send_email", "add_to_crm"
    
    # Store config and xy position
    data = Column(JSONB, default={})
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)

    automation = relationship("Automation", back_populates="nodes")

class AutomationEdge(Base, TimestampMixin):
    __tablename__ = "automation_edges"

    id = Column(String, primary_key=True)
    automation_id = Column(Uuid(as_uuid=True), ForeignKey("automations.id", ondelete="CASCADE"), nullable=False)
    
    source = Column(String, nullable=False) # ID of source node
    target = Column(String, nullable=False) # ID of target node
    
    source_handle = Column(String, nullable=True)
    target_handle = Column(String, nullable=True)
    automation = relationship("Automation", back_populates="edges")

class AutomationRun(Base, TimestampMixin):
    __tablename__ = "automation_runs"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    automation_id = Column(Uuid(as_uuid=True), ForeignKey("automations.id", ondelete="CASCADE"), nullable=False)
    
    status = Column(String, nullable=False) # "SUCCESS", "FAILED"
    payload = Column(JSONB, default={})
    logs = Column(JSONB, default=[]) # Array of dicts: {"node_id": "...", "status": "...", "message": "..."}
    error_message = Column(String, nullable=True)

    automation = relationship("Automation", backref="runs")

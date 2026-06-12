from sqlalchemy import Column, String, Uuid, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base, TimestampMixin

class CampaignTask(Base, TimestampMixin):
    __tablename__ = "campaign_tasks"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False)
    due_date = Column(DateTime, nullable=True)
    
    campaign_id = Column(Uuid(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    assigned_to_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    campaign = relationship("Campaign", backref="tasks")
    assigned_to = relationship("User")

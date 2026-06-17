from sqlalchemy import Column, String, ForeignKey, Integer, Text, Uuid
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base, TimestampMixin

class ReviewRequest(Base, TimestampMixin):
    __tablename__ = "review_requests"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    client_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    customer_name = Column(String, nullable=False)
    customer_contact = Column(String, nullable=False) # Email or Phone
    
    status = Column(String, default="SENT") # SENT, CLICKED, FEEDBACK_GIVEN, REVIEWED
    rating = Column(Integer, nullable=True) # 1 to 5
    private_feedback = Column(Text, nullable=True)
    
    client = relationship("User", foreign_keys=[client_id])

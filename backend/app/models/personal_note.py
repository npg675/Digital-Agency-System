from sqlalchemy import Column, String, Uuid, ForeignKey, Text
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base, TimestampMixin

class PersonalNote(Base, TimestampMixin):
    __tablename__ = "personal_notes"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    url = Column(String, nullable=True)
    
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user = relationship("User", backref="personal_notes")

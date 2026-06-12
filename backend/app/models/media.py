from sqlalchemy import Column, String, Integer, DateTime, Uuid
import uuid
from datetime import datetime
from app.models.base import Base

class MediaAsset(Base):
    __tablename__ = "media_assets"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    mimetype = Column(String, nullable=False)
    size = Column(Integer, nullable=False) # in bytes
    client_id = Column(Uuid(as_uuid=True), nullable=True) # ForeignKey would be ideal, but UUID is fine for loose coupling
    uploader_id = Column(Uuid(as_uuid=True), nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

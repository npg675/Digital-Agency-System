from sqlalchemy import Column, String, Uuid, ForeignKey, Boolean
from sqlalchemy.orm import relationship, backref
import uuid
from app.models.base import Base, TimestampMixin

class ClientNote(Base, TimestampMixin):
    __tablename__ = "client_notes"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    content = Column(String, nullable=False)
    is_internal = Column(Boolean, default=False, nullable=False)

    client_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    parent_id = Column(Uuid(as_uuid=True), ForeignKey("client_notes.id", ondelete="CASCADE"), nullable=True)

    client = relationship("User", foreign_keys=[client_id], backref="notes")
    author = relationship("User", foreign_keys=[author_id])
    replies = relationship("ClientNote", backref=backref("parent", remote_side=[id]))

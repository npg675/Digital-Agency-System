import enum
import uuid
from sqlalchemy import Column, String, Uuid, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class HandoverStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class HandoverRequest(Base, TimestampMixin):
    __tablename__ = "handover_requests"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # The client being handed over
    client_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # Staff who requested the handover
    requested_by_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # The staff the client should be moved to
    new_manager_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    reason = Column(String, nullable=True)
    status = Column(Enum(HandoverStatus), default=HandoverStatus.PENDING, nullable=False)
    admin_note = Column(String, nullable=True)  # Optional rejection reason from admin

    client = relationship("User", foreign_keys=[client_id])
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    new_manager = relationship("User", foreign_keys=[new_manager_id])

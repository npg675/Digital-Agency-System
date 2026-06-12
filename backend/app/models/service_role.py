from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from app.models.base import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID

class ServiceRole(Base):
    __tablename__ = "service_roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

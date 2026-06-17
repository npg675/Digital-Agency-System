import uuid
from sqlalchemy import Column, String, ForeignKey, Integer, Uuid, Text, Boolean, Float
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Course(Base, TimestampMixin):
    __tablename__ = "courses"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    client_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    
    is_published = Column(Boolean, default=False)
    price = Column(Float, default=0.0) # If they want to sell it via funnels later
    
    client = relationship("User", foreign_keys=[client_id])
    modules = relationship("CourseModule", back_populates="course", cascade="all, delete-orphan", order_by="CourseModule.order")
    enrollments = relationship("CourseEnrollment", back_populates="course", cascade="all, delete-orphan")

class CourseModule(Base, TimestampMixin):
    __tablename__ = "course_modules"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    course_id = Column(Uuid(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, default=0)

    course = relationship("Course", back_populates="modules")
    lessons = relationship("CourseLesson", back_populates="module", cascade="all, delete-orphan", order_by="CourseLesson.order")

class CourseLesson(Base, TimestampMixin):
    __tablename__ = "course_lessons"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    module_id = Column(Uuid(as_uuid=True), ForeignKey("course_modules.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String, nullable=False)
    content_text = Column(Text, nullable=True) # Rich text lesson notes
    video_url = Column(String, nullable=True) # YouTube, Vimeo, MP4
    order = Column(Integer, default=0)
    is_free_preview = Column(Boolean, default=False)

    module = relationship("CourseModule", back_populates="lessons")

class CourseEnrollment(Base, TimestampMixin):
    __tablename__ = "course_enrollments"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    course_id = Column(Uuid(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    lead_id = Column(Uuid(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    
    progress_percentage = Column(Float, default=0.0)
    
    course = relationship("Course", back_populates="enrollments")
    lead = relationship("Lead") # The student

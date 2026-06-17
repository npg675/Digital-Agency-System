from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.api import deps
from app.models.user import User
from app.models.course import Course, CourseModule, CourseLesson

router = APIRouter()

# --- Schemas ---

class LessonBase(BaseModel):
    title: str
    content_text: str | None = None
    video_url: str | None = None
    is_free_preview: bool = False

class LessonUpdate(LessonBase):
    pass

class ModuleBase(BaseModel):
    title: str
    description: str | None = None

class ModuleUpdate(ModuleBase):
    pass

class CourseCreate(BaseModel):
    title: str
    description: str | None = None

class CourseUpdate(CourseCreate):
    is_published: bool | None = None
    price: float | None = None
    thumbnail_url: str | None = None

class LessonResponse(LessonBase):
    id: uuid.UUID
    module_id: uuid.UUID
    order: int
    
    class Config:
        from_attributes = True

class ModuleResponse(ModuleBase):
    id: uuid.UUID
    course_id: uuid.UUID
    order: int
    
    class Config:
        from_attributes = True

class CourseResponse(CourseCreate):
    id: uuid.UUID
    client_id: uuid.UUID
    is_published: bool
    price: float | None = None
    thumbnail_url: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    
    class Config:
        from_attributes = True

# --- Endpoints: Courses ---

@router.get("/", response_model=List[CourseResponse])
def get_courses(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return db.query(Course).filter(Course.client_id == current_user.id).all()

@router.post("/", response_model=CourseResponse)
def create_course(
    request: CourseCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    course = Course(
        client_id=current_user.id,
        title=request.title,
        description=request.description
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

@router.get("/{course_id}")
def get_course_detail(
    course_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    # Optional auth for public portal vs admin
) -> Any:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404)
        
    modules = []
    for mod in course.modules:
        lessons = []
        for les in mod.lessons:
            lessons.append({
                "id": les.id,
                "title": les.title,
                "content_text": les.content_text,
                "video_url": les.video_url,
                "is_free_preview": les.is_free_preview
            })
        modules.append({
            "id": mod.id,
            "title": mod.title,
            "description": mod.description,
            "lessons": lessons
        })
        
    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "thumbnail_url": course.thumbnail_url,
        "is_published": course.is_published,
        "price": course.price,
        "modules": modules
    }

@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: uuid.UUID,
    request: CourseUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    course = db.query(Course).filter(Course.id == course_id, Course.client_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404)
        
    for k, v in request.dict(exclude_unset=True).items():
        setattr(course, k, v)
        
    db.commit()
    return course

# --- Endpoints: Modules ---

@router.post("/{course_id}/modules", response_model=ModuleResponse)
def create_module(
    course_id: uuid.UUID,
    request: ModuleBase,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    course = db.query(Course).filter(Course.id == course_id, Course.client_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404)
        
    mod = CourseModule(course_id=course_id, title=request.title, description=request.description)
    db.add(mod)
    db.commit()
    db.refresh(mod)
    return mod

# --- Endpoints: Lessons ---

@router.post("/{course_id}/modules/{module_id}/lessons", response_model=LessonResponse)
def create_lesson(
    course_id: uuid.UUID,
    module_id: uuid.UUID,
    request: LessonBase,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # Security check omitted for brevity in demo
    lesson = CourseLesson(
        module_id=module_id,
        title=request.title,
        content_text=request.content_text,
        video_url=request.video_url,
        is_free_preview=request.is_free_preview
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson

@router.put("/{course_id}/lessons/{lesson_id}", response_model=LessonResponse)
def update_lesson(
    course_id: uuid.UUID,
    lesson_id: uuid.UUID,
    request: LessonUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    lesson = db.query(CourseLesson).filter(CourseLesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404)
        
    for k, v in request.dict(exclude_unset=True).items():
        setattr(lesson, k, v)
        
    db.commit()
    return lesson

@router.delete("/{course_id}/lessons/{lesson_id}")
def delete_lesson(
    course_id: uuid.UUID,
    lesson_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    lesson = db.query(CourseLesson).filter(CourseLesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404)
    db.delete(lesson)
    db.commit()
    return {"message": "Deleted"}

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from datetime import datetime

from app.api import deps
from app.models.user import User
from app.models.personal_note import PersonalNote
from app.schemas.personal_note import PersonalNote as PersonalNoteSchema, PersonalNoteCreate, PersonalNoteUpdate

router = APIRouter()

@router.get("/", response_model=List[PersonalNoteSchema])
def read_personal_notes(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    notes = db.query(PersonalNote).filter(PersonalNote.user_id == current_user.id).order_by(PersonalNote.created_at.desc()).offset(skip).limit(limit).all()
    return notes

@router.post("/", response_model=PersonalNoteSchema)
def create_personal_note(
    *,
    db: Session = Depends(deps.get_db),
    note_in: PersonalNoteCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    note = PersonalNote(**note_in.model_dump(), user_id=current_user.id)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@router.put("/{id}", response_model=PersonalNoteSchema)
def update_personal_note(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    note_in: PersonalNoteUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    note = db.query(PersonalNote).filter(PersonalNote.id == id, PersonalNote.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    update_data = note_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(note, field, value)
    
    note.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(note)
    return note

@router.delete("/{id}")
def delete_personal_note(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    note = db.query(PersonalNote).filter(PersonalNote.id == id, PersonalNote.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}

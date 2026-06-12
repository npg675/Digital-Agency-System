from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app import schemas, models
from app.api import deps
from app.models.user import UserRole
from app.core.activity import log_activity

router = APIRouter()

@router.get("/client/{client_id}", response_model=List[schemas.ClientNote])
def read_client_notes(
    client_id: UUID,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve notes for a specific client.
    CLIENT users only see notes where is_internal=False.
    ADMIN and STAFF see all notes.
    """
    if current_user.role == UserRole.CLIENT and current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    query = db.query(models.ClientNote).filter(
        models.ClientNote.client_id == client_id,
        models.ClientNote.parent_id == None
    )

    # Clients only see non-internal notes
    if current_user.role == UserRole.CLIENT:
        query = query.filter(models.ClientNote.is_internal == False)

    notes = query.offset(skip).limit(limit).all()

    # For client role, also strip internal replies from each note
    if current_user.role == UserRole.CLIENT:
        for note in notes:
            note.replies = [r for r in note.replies if not r.is_internal]

    return notes

@router.post("/", response_model=schemas.ClientNote)
def create_client_note(
    *,
    db: Session = Depends(deps.get_db),
    note_in: schemas.ClientNoteCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new client note.
    Clients can only create non-internal notes.
    """
    if current_user.role == UserRole.CLIENT and current_user.id != note_in.client_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Clients cannot create internal notes
    is_internal = note_in.is_internal if current_user.role != UserRole.CLIENT else False

    note = models.ClientNote(
        content=note_in.content,
        client_id=note_in.client_id,
        parent_id=note_in.parent_id,
        author_id=current_user.id,
        is_internal=is_internal,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    
    # Generate Notifications
    from app.models.notification import Notification
    
    notify_users = set()
    
    # Notify the client's assigned manager (a staff member)
    client_user = db.query(models.User).filter(models.User.id == note_in.client_id).first()
    if client_user and client_user.manager_id:
        notify_users.add(client_user.manager_id)

    # Notify ALL staff who have previously authored a note for this client
    # (i.e. staff already engaged/assigned to this client's communication)
    involved_staff = (
        db.query(models.ClientNote.author_id)
        .join(models.User, models.User.id == models.ClientNote.author_id)
        .filter(
            models.ClientNote.client_id == note_in.client_id,
            models.User.role == UserRole.STAFF,
            models.ClientNote.author_id != None,
        )
        .distinct()
        .all()
    )
    for (staff_id,) in involved_staff:
        notify_users.add(staff_id)

    # Notify all ADMINs
    admins = db.query(models.User).filter(models.User.role == UserRole.ADMIN).all()
    for admin in admins:
        notify_users.add(admin.id)
        
    # If reply, also notify the parent note's author
    if note.parent_id:
        parent_note = db.query(models.ClientNote).filter(models.ClientNote.id == note.parent_id).first()
        if parent_note and parent_note.author_id:
            notify_users.add(parent_note.author_id)

    # Only notify the client if the note is NOT internal
    if not is_internal:
        notify_users.add(note_in.client_id)
            
    # Don't notify the person who just wrote the note
    if current_user.id in notify_users:
        notify_users.remove(current_user.id)
        
    for uid in notify_users:
        new_notif = Notification(
            user_id=uid,
            type="REPLY" if note.parent_id else "NEW_NOTE",
            message=f"New {'reply' if note.parent_id else 'note'} from {current_user.first_name or current_user.email}",
            reference_id=str(note.client_id)
        )
        db.add(new_notif)
        
    action_type = "REPLY_CREATED" if note.parent_id else "NOTE_CREATED"
    internal_tag = " (Internal)" if is_internal else ""
    log_activity(
        db=db,
        user_id=current_user.id,
        action=action_type,
        entity_type="NOTE",
        entity_id=str(note.id),
        details=f"Created {action_type.lower().replace('_', ' ')}{internal_tag} for client {client_user.email if client_user else note_in.client_id}"
    )

    db.commit()
    
    return note

@router.delete("/{id}", response_model=schemas.ClientNote)
def delete_client_note(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a client note.
    """
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    note = db.query(models.ClientNote).filter(models.ClientNote.id == id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    db.delete(note)
    
    log_activity(
        db=db,
        user_id=current_user.id,
        action="NOTE_DELETED",
        entity_type="NOTE",
        entity_id=str(id),
        details=f"Deleted note/reply for client {note.client_id}"
    )

    db.commit()
    return note

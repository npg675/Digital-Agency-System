from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.api.deps import get_current_user, get_current_active_user
from app.models.user import User, UserRole
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.api.v1.endpoints.calendar import sync_appointments_to_google

router = APIRouter()

@router.post("/", response_model=AppointmentResponse)
def create_appointment(
    appointment_in: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # If the user is a client, they can only book with staff/admin. If they are staff/admin, they can book with anyone.
    # For now, let's just create the appointment.
    appointment = Appointment(
        host_id=appointment_in.host_id,
        client_id=appointment_in.client_id,
        lead_id=appointment_in.lead_id,
        title=appointment_in.title,
        description=appointment_in.description,
        start_time=appointment_in.start_time,
        end_time=appointment_in.end_time,
        status=appointment_in.status,
        meeting_link=appointment_in.meeting_link
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    
    # Attempt to sync to Google Calendar
    host_user = db.query(User).filter(User.id == appointment.host_id).first()
    if host_user and host_user.google_access_token:
        google_event_id = sync_appointments_to_google(
            user=host_user,
            appointment_title=appointment.title,
            start_time=appointment.start_time,
            end_time=appointment.end_time
        )
        if google_event_id:
            appointment.google_event_id = google_event_id
            db.commit()
            db.refresh(appointment)
            
    return appointment

@router.get("/", response_model=List[AppointmentResponse])
def get_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role == UserRole.ADMIN:
        appointments = db.query(Appointment).all()
    elif current_user.role == UserRole.STAFF:
        appointments = db.query(Appointment).filter(Appointment.host_id == current_user.id).all()
    else:
        # Client sees their own appointments
        appointments = db.query(Appointment).filter(Appointment.client_id == current_user.id).all()
    return appointments

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: UUID,
    appointment_in: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF] and appointment.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this appointment")
        
    update_data = appointment_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(appointment, key, value)
        
    db.commit()
    db.refresh(appointment)
    return appointment

@router.delete("/{appointment_id}")
def delete_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized to delete appointments")
        
    db.delete(appointment)
    db.commit()
    return {"message": "Appointment deleted successfully"}

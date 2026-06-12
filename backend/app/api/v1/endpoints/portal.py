from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User, UserRole
from app.models.client_service import ClientService
from app.models.client_task import ClientTask
from app.models.appointment import Appointment
from app.models.invoice import Invoice

router = APIRouter()

@router.get("/dashboard")
def get_portal_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    # Ensure this endpoint is mostly used by clients, though admin could view it
    
    # 1. Active Services
    active_services = db.query(ClientService).filter(
        ClientService.client_id == current_user.id,
        ClientService.status == "ACTIVE"
    ).all()
    
    # 2. Pending Tasks
    pending_tasks = db.query(ClientTask).filter(
        ClientTask.client_id == current_user.id,
        ClientTask.status.in_(["TODO", "IN_PROGRESS", "REVIEW"])
    ).order_by(ClientTask.due_date.asc()).limit(5).all()
    
    # 3. Upcoming Appointments
    upcoming_appointments = db.query(Appointment).filter(
        Appointment.client_id == current_user.id,
        Appointment.status == "SCHEDULED"
    ).order_by(Appointment.start_time.asc()).limit(3).all()
    
    # 4. Unpaid Invoices
    unpaid_invoices = db.query(Invoice).filter(
        Invoice.client_id == current_user.id,
        Invoice.status.in_(["SENT", "DRAFT", "OVERDUE"])
    ).order_by(Invoice.due_date.asc()).all()

    return {
        "user": {
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "email": current_user.email,
        },
        "metrics": {
            "active_services_count": len(active_services),
            "pending_tasks_count": len(pending_tasks),
            "unpaid_invoices_count": len(unpaid_invoices)
        },
        "active_services": active_services,
        "pending_tasks": pending_tasks,
        "upcoming_appointments": upcoming_appointments,
        "unpaid_invoices": unpaid_invoices
    }

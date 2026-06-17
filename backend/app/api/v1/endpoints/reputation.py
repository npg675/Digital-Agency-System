from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from pydantic import BaseModel

from app.api import deps
from app.models.user import User
from app.models.reputation import ReviewRequest
import os

router = APIRouter()

class ReviewRequestCreate(BaseModel):
    customer_name: str
    customer_contact: str

class ReviewRequestResponse(BaseModel):
    id: uuid.UUID
    customer_name: str
    customer_contact: str
    status: str
    rating: int | None
    private_feedback: str | None
    created_at: datetime
    
    class Config:
        from_attributes = True

class FeedbackSubmit(BaseModel):
    rating: int
    private_feedback: str | None = None

@router.get("/", response_model=List[ReviewRequestResponse])
def get_review_requests(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get all review requests for the client."""
    return db.query(ReviewRequest).filter(ReviewRequest.client_id == current_user.id).order_by(ReviewRequest.created_at.desc()).all()

@router.post("/", response_model=ReviewRequestResponse)
def create_review_request(
    request_in: ReviewRequestCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Create a new review request and 'send' the SMS/Email."""
    new_request = ReviewRequest(
        client_id=current_user.id,
        customer_name=request_in.customer_name,
        customer_contact=request_in.customer_contact,
        status="SENT"
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    
    frontend_url = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:3000").replace("/api/v1", "")
    review_link = f"{frontend_url}/review/{new_request.id}"
    
    # Simulate sending notification
    company = current_user.company_name or "us"
    message = f"Hi {new_request.customer_name},\n\nThank you for choosing {company}! We'd love to hear about your experience. Please take a second to rate us here:\n{review_link}"
    
    if "@" in request_in.customer_contact:
        # Assuming email
        print(f"Sending review request via EMAIL to {request_in.customer_contact}:\n{message}")
    else:
        # Assuming SMS/WhatsApp
        print(f"Sending review request via SMS to {request_in.customer_contact}:\n{message}")

    return new_request

@router.get("/public/{request_id}")
def get_public_request_info(
    request_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
) -> Any:
    """Get basic info for the public review page without auth."""
    req = db.query(ReviewRequest).filter(ReviewRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Review request not found")
        
    client = db.query(User).filter(User.id == req.client_id).first()
    
    if req.status == "SENT":
        req.status = "CLICKED"
        db.commit()
        
    return {
        "customer_name": req.customer_name,
        "company_name": client.company_name if client else "Our Company",
        "branding_logo": client.branding_logo if client else None,
        "google_review_url": client.brand_google_review_url if client else None,
        "status": req.status,
        "rating": req.rating
    }

@router.post("/public/{request_id}/submit")
def submit_feedback(
    request_id: uuid.UUID,
    feedback: FeedbackSubmit,
    db: Session = Depends(deps.get_db),
) -> Any:
    """Submit rating and optional feedback."""
    req = db.query(ReviewRequest).filter(ReviewRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Review request not found")
        
    req.rating = feedback.rating
    req.private_feedback = feedback.private_feedback
    req.status = "FEEDBACK_GIVEN" if feedback.rating <= 3 else "REVIEWED"
    
    db.commit()
    return {"message": "Success"}

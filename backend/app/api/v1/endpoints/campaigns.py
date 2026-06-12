from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from uuid import UUID
import smtplib
from email.message import EmailMessage
from fastapi import BackgroundTasks

from app import schemas, models
from app.api import deps
from app.models.user import UserRole

router = APIRouter()

@router.get("/", response_model=List[schemas.Campaign])
def read_campaigns(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve campaigns.
    ADMIN sees all. STAFF sees their clients' campaigns. CLIENT sees their own.
    """
    if current_user.role == UserRole.ADMIN:
        campaigns = db.query(models.Campaign).offset(skip).limit(limit).all()
    elif current_user.role == UserRole.STAFF:
        client_ids = [c.id for c in db.query(models.User).filter(models.User.manager_id == current_user.id).all()]
        campaigns = db.query(models.Campaign).filter(
            or_(
                models.Campaign.client_id.in_(client_ids),
                models.Campaign.client_id == None
            )
        ).offset(skip).limit(limit).all()
    else:
        campaigns = db.query(models.Campaign).filter(models.Campaign.client_id == current_user.id).offset(skip).limit(limit).all()
    return campaigns

@router.post("/", response_model=schemas.Campaign)
def create_campaign(
    *,
    db: Session = Depends(deps.get_db),
    campaign_in: schemas.CampaignCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new campaign.
    """
    if current_user.role == UserRole.CLIENT:
        # Force client_id to current_user.id
        campaign_in.client_id = current_user.id
        
    campaign = models.Campaign(
        name=campaign_in.name,
        description=campaign_in.description,
        client_id=campaign_in.client_id
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign

@router.put("/{id}", response_model=schemas.Campaign)
def update_campaign(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    campaign_in: schemas.CampaignUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a campaign.
    """
    campaign = db.query(models.Campaign).filter(models.Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    # Permission check
    if current_user.role == UserRole.CLIENT and campaign.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    if current_user.role == UserRole.STAFF:
        client = db.query(models.User).filter(models.User.id == campaign.client_id).first()
        if not client or client.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")

    if campaign_in.name is not None:
        campaign.name = campaign_in.name
    if campaign_in.description is not None:
        campaign.description = campaign_in.description
    if campaign_in.status is not None:
        campaign.status = campaign_in.status
    if campaign_in.budget is not None:
        campaign.budget = campaign_in.budget
    if campaign_in.ad_spend is not None:
        campaign.ad_spend = campaign_in.ad_spend
    if campaign_in.revenue_generated is not None:
        campaign.revenue_generated = campaign_in.revenue_generated
        
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign

@router.delete("/{id}", response_model=schemas.Campaign)
def delete_campaign(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a campaign.
    """
    campaign = db.query(models.Campaign).filter(models.Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if current_user.role == UserRole.CLIENT and campaign.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    db.delete(campaign)
    db.commit()
    return campaign

def send_client_report_email(admin_config: models.User, client_email: str, campaign: models.Campaign, total_leads: int):
    """Send ROI report to the client."""
    if not all([admin_config.smtp_host, admin_config.smtp_port, admin_config.smtp_user, admin_config.smtp_password, admin_config.smtp_from_email, client_email]):
        return
        
    roi = 0
    if campaign.ad_spend and campaign.revenue_generated:
        roi = ((campaign.revenue_generated - campaign.ad_spend) / campaign.ad_spend) * 100
        
    cpl = 0
    if campaign.ad_spend and total_leads > 0:
        cpl = campaign.ad_spend / total_leads

    try:
        msg = EmailMessage()
        msg.set_content(
            f"Hello,\n\nHere is your automated performance report for the campaign: '{campaign.name}'.\n\n"
            f"💰 Budget: ${campaign.budget or 0:.2f}\n"
            f"📉 Ad Spend: ${campaign.ad_spend or 0:.2f}\n"
            f"📈 Revenue Generated: ${campaign.revenue_generated or 0:.2f}\n"
            f"🚀 ROI: {roi:.2f}%\n"
            f"👥 Total Leads: {total_leads}\n"
            f"🎯 Cost Per Lead (CPL): ${cpl:.2f}\n\n"
            f"Please log into your dashboard to view full details.\n\nBest,\nYour Agency Team"
        )
        msg['Subject'] = f"Campaign Performance Report: {campaign.name}"
        msg['From'] = admin_config.smtp_from_email
        msg['To'] = client_email

        with smtplib.SMTP_SSL(admin_config.smtp_host, admin_config.smtp_port) as server:
            server.login(admin_config.smtp_user, admin_config.smtp_password)
            server.send_message(msg)
    except Exception as e:
        print(f"Failed to send report email to {client_email}: {e}")

@router.post("/{id}/send-report")
def send_campaign_report(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Generate and send campaign report to client.
    """
    campaign = db.query(models.Campaign).filter(models.Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Clients cannot trigger reports manually")

    client = db.query(models.User).filter(models.User.id == campaign.client_id).first()
    if not client:
        raise HTTPException(status_code=400, detail="Campaign has no assigned client")
        
    admin = db.query(models.User).filter(models.User.role == UserRole.ADMIN).first()
    if not admin or not admin.smtp_host:
        raise HTTPException(status_code=400, detail="Agency SMTP is not configured")

    # Calculate total leads for this campaign
    # Leads -> LandingPage -> Campaign
    pages = db.query(models.LandingPage).filter(models.LandingPage.campaign_id == campaign.id).all()
    page_ids = [p.id for p in pages]
    total_leads = db.query(models.Lead).filter(models.Lead.landing_page_id.in_(page_ids)).count() if page_ids else 0

    background_tasks.add_task(send_client_report_email, admin, client.email, campaign, total_leads)
    
    return {"message": "Report sent to client successfully"}

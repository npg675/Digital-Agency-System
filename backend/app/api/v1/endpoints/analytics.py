from typing import Any, List, Dict
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import uuid

from app.api import deps
from app.models.landing_page import LandingPage, PageStatus
from app.models.lead import Lead, LeadStatus
from app.models.page_view import PageView
from app.models.user import User, UserRole
from app.schemas.analytics import (
    DashboardAnalytics, DailyStats, PageViewCreate, 
    ComprehensiveReport, CampaignReport, ClientReport, LeadFunnel, OverviewStats,
    StaffPerformance, ClientProgressReport, ReportTask, ReportSquadMember
)

router = APIRouter()

@router.get("/reports", response_model=ComprehensiveReport)
def get_comprehensive_reports(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get advanced analytics reports."""
    
    if current_user.role == UserRole.CLIENT:
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not admin or not admin.show_reports_to_clients:
            raise HTTPException(status_code=403, detail="Reports access is disabled by the agency.")
            
    # Base queries
    pages_query = db.query(LandingPage)
    leads_query = db.query(Lead)
    views_query = db.query(PageView)
    
    managed_client_ids = []
    if current_user.role == UserRole.CLIENT:
        pages_query = pages_query.filter(LandingPage.client_id == current_user.id)
        leads_query = leads_query.join(LandingPage).filter(LandingPage.client_id == current_user.id)
        views_query = views_query.join(LandingPage).filter(LandingPage.client_id == current_user.id)
    elif current_user.role == UserRole.STAFF:
        managed_clients = db.query(User.id).filter(User.manager_id == current_user.id).all()
        managed_client_ids = [c[0] for c in managed_clients]
        pages_query = pages_query.filter(LandingPage.client_id.in_(managed_client_ids))
        leads_query = leads_query.join(LandingPage).filter(LandingPage.client_id.in_(managed_client_ids))
        views_query = views_query.join(LandingPage).filter(LandingPage.client_id.in_(managed_client_ids))
        
    total_views = views_query.count()
    total_leads = leads_query.count()
    overall_cvr = (total_leads / total_views * 100) if total_views > 0 else 0.0
    
    # Lead Funnel
    funnel_counts = db.query(Lead.status, func.count(Lead.id)).filter(
        Lead.id.in_(leads_query.with_entities(Lead.id))
    ).group_by(Lead.status).all()
    
    funnel_dict = {str(status): count for status, count in funnel_counts}
    lead_funnel = LeadFunnel(
        new=funnel_dict.get(LeadStatus.NEW.value, 0),
        contacted=funnel_dict.get(LeadStatus.CONTACTED.value, 0),
        qualified=funnel_dict.get(LeadStatus.QUALIFIED.value, 0),
        converted=funnel_dict.get(LeadStatus.WON.value, 0)
    )
    
    # Campaigns (Subquery for safe grouping)
    views_subq = db.query(
        PageView.landing_page_id,
        func.count(PageView.id).label('views')
    ).group_by(PageView.landing_page_id).subquery()
    
    leads_subq = db.query(
        Lead.landing_page_id,
        func.count(Lead.id).label('leads')
    ).group_by(Lead.landing_page_id).subquery()
    
    campaigns_q = db.query(
        LandingPage,
        User.company_name,
        func.coalesce(views_subq.c.views, 0).label('views'),
        func.coalesce(leads_subq.c.leads, 0).label('leads')
    ).outerjoin(User, LandingPage.client_id == User.id)\
     .outerjoin(views_subq, LandingPage.id == views_subq.c.landing_page_id)\
     .outerjoin(leads_subq, LandingPage.id == leads_subq.c.landing_page_id)
     
    if current_user.role == UserRole.CLIENT:
        campaigns_q = campaigns_q.filter(LandingPage.client_id == current_user.id)
    elif current_user.role == UserRole.STAFF:
        campaigns_q = campaigns_q.filter(LandingPage.client_id.in_(managed_client_ids))
        
    campaigns_data = campaigns_q.all()
    
    campaigns = []
    clients_dict = {}
    
    for page, company_name, v_count, l_count in campaigns_data:
        cvr = (l_count / v_count * 100) if v_count > 0 else 0.0
        campaigns.append(CampaignReport(
            id=str(page.id),
            name=page.name,
            client_name=company_name or "Internal",
            status=page.status.value,
            views=v_count,
            leads=l_count,
            cvr=round(cvr, 2)
        ))
        
        # Aggregate client data
        if current_user.role != UserRole.CLIENT and page.client_id:
            c_id = str(page.client_id)
            if c_id not in clients_dict:
                clients_dict[c_id] = {
                    "id": c_id,
                    "name": company_name or "Unknown Client",
                    "company_name": company_name,
                    "total_campaigns": 0,
                    "views": 0,
                    "leads": 0
                }
            clients_dict[c_id]["total_campaigns"] += 1
            clients_dict[c_id]["views"] += v_count
            clients_dict[c_id]["leads"] += l_count

    clients_list = None
    if current_user.role != UserRole.CLIENT:
        clients_list = []
        for c in clients_dict.values():
            c_cvr = (c["leads"] / c["views"] * 100) if c["views"] > 0 else 0.0
            clients_list.append(ClientReport(
                id=c["id"],
                name=c["name"],
                company_name=c["company_name"],
                total_campaigns=c["total_campaigns"],
                views=c["views"],
                leads=c["leads"],
                cvr=round(c_cvr, 2)
            ))
            
    return ComprehensiveReport(
        overview=OverviewStats(
            views=total_views,
            leads=total_leads,
            cvr=round(overall_cvr, 2)
        ),
        campaigns=campaigns,
        clients=clients_list,
        lead_funnel=lead_funnel
    )

@router.get("/dashboard", response_model=DashboardAnalytics)
def get_dashboard_analytics(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get dashboard analytics (Filtered by Role).
    """
    from app.models.user import UserRole
    
    pages_query = db.query(LandingPage)
    leads_query = db.query(Lead)
    views_query = db.query(PageView)

    if current_user.role == UserRole.CLIENT:
        pages_query = pages_query.filter(LandingPage.client_id == current_user.id)
        leads_query = leads_query.join(LandingPage).filter(LandingPage.client_id == current_user.id)
        views_query = views_query.join(LandingPage).filter(LandingPage.client_id == current_user.id)
    elif current_user.role == UserRole.STAFF:
        managed_clients = db.query(User.id).filter(User.manager_id == current_user.id).all()
        managed_client_ids = [c[0] for c in managed_clients]
        pages_query = pages_query.filter(LandingPage.client_id.in_(managed_client_ids))
        leads_query = leads_query.join(LandingPage).filter(LandingPage.client_id.in_(managed_client_ids))
        views_query = views_query.join(LandingPage).filter(LandingPage.client_id.in_(managed_client_ids))

    total_pages = pages_query.count()
    published_pages = pages_query.filter(LandingPage.status == PageStatus.PUBLISHED).count()
    total_leads = leads_query.count()
    total_views = views_query.count()

    # Generate last 30 days daily stats
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=29)

    leads_by_date_query = db.query(
        func.date(Lead.submitted_at).label('date'),
        func.count(Lead.id).label('count')
    ).filter(Lead.submitted_at >= start_date)

    views_by_date_query = db.query(
        func.date(PageView.viewed_at).label('date'),
        func.count(PageView.id).label('count')
    ).filter(PageView.viewed_at >= start_date)

    if current_user.role == UserRole.CLIENT:
        leads_by_date_query = leads_by_date_query.join(LandingPage).filter(LandingPage.client_id == current_user.id)
        views_by_date_query = views_by_date_query.join(LandingPage).filter(LandingPage.client_id == current_user.id)
    elif current_user.role == UserRole.STAFF:
        leads_by_date_query = leads_by_date_query.join(LandingPage).filter(LandingPage.client_id.in_(managed_client_ids))
        views_by_date_query = views_by_date_query.join(LandingPage).filter(LandingPage.client_id.in_(managed_client_ids))

    leads_by_date = leads_by_date_query.group_by(func.date(Lead.submitted_at)).all()
    views_by_date = views_by_date_query.group_by(func.date(PageView.viewed_at)).all()

    leads_map = {row.date: row.count for row in leads_by_date if row.date}
    views_map = {row.date: row.count for row in views_by_date if row.date}

    daily_stats = []
    for i in range(30):
        current_date = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
        daily_stats.append({
            "date": current_date,
            "views": views_map.get(current_date, 0),
            "leads": leads_map.get(current_date, 0)
        })

    staff_performance = None
    if current_user.role == UserRole.ADMIN:
        staff_members = db.query(User).filter(User.role == UserRole.STAFF).all()
        staff_performance = []
        for staff in staff_members:
            s_clients = db.query(User.id).filter(User.manager_id == staff.id).all()
            s_client_ids = [c[0] for c in s_clients]
            
            s_pages = db.query(LandingPage).filter(LandingPage.client_id.in_(s_client_ids))
            s_published = s_pages.filter(LandingPage.status == PageStatus.PUBLISHED).count()
            
            s_leads = db.query(Lead).join(LandingPage).filter(LandingPage.client_id.in_(s_client_ids)).count()
            s_views = db.query(PageView).join(LandingPage).filter(LandingPage.client_id.in_(s_client_ids)).count()
            
            s_cvr = (s_leads / s_views * 100) if s_views > 0 else 0.0
            staff_name = f"{staff.first_name} {staff.last_name}".strip()
            if not staff_name:
                staff_name = staff.email

            staff_performance.append({
                "staff_id": str(staff.id),
                "staff_name": staff_name,
                "total_clients": len(s_client_ids),
                "published_pages": s_published,
                "total_views": s_views,
                "total_leads": s_leads,
                "cvr": round(s_cvr, 2)
            })

    return {
        "total_pages": total_pages,
        "published_pages": published_pages,
        "total_leads": total_leads,
        "total_views": total_views,
        "daily_stats": daily_stats,
        "staff_performance": staff_performance
    }

@router.post("/view")
def record_page_view(
    request: Request,
    view_in: PageViewCreate,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Record a page view from the public site.
    """
    # Get IP address
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0]
    else:
        ip = request.client.host if request.client else None
        
    user_agent = request.headers.get("User-Agent")
    
    view = PageView(
        landing_page_id=uuid.UUID(view_in.landing_page_id),
        ip_address=ip,
        user_agent=user_agent,
        referrer=view_in.referrer
    )
    db.add(view)
    db.commit()
    return {"status": "success"}

@router.get("/client-report/{client_id}", response_model=ClientProgressReport)
def generate_client_progress_report(
    client_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Generate an aggregated progress report for a specific client.
    Includes squad details, tasks, and KPI overviews.
    """
    if current_user.role == UserRole.CLIENT and current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this report")
        
    client = db.query(User).filter(User.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Import needed models locally to avoid circular imports if any
    from app.models.client_service import ClientService
    from app.models.client_task import ClientTask
    
    # 1. Squad Members
    squad_records = db.query(ClientService).filter(ClientService.client_id == client_id).all()
    squad_list = []
    for s in squad_records:
        staff_user = db.query(User).filter(User.id == s.staff_id).first()
        if staff_user:
            staff_name = f"{staff_user.first_name} {staff_user.last_name}".strip() or staff_user.email
            squad_list.append(ReportSquadMember(staff_name=staff_name, service_role=s.service_role))

    # 2. Tasks (Done & In Progress)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    tasks = db.query(ClientTask).filter(ClientTask.client_id == client_id).all()
    
    completed_tasks = []
    in_progress_tasks = []
    
    for t in tasks:
        assigned_user = db.query(User).filter(User.id == t.assigned_to_id).first() if t.assigned_to_id else None
        assigned_name = f"{assigned_user.first_name} {assigned_user.last_name}".strip() if assigned_user else "Unassigned"
        
        rt = ReportTask(
            id=str(t.id),
            title=t.title,
            status=t.status,
            service_category=t.service_category,
            assigned_name=assigned_name
        )
        if t.status == 'DONE':
            # We could filter by updated_at > thirty_days_ago if we had it, but for simplicity we return all DONE tasks right now
            completed_tasks.append(rt)
        elif t.status in ['IN_PROGRESS', 'REVIEW']:
            in_progress_tasks.append(rt)

    # 3. Overview Stats
    pages_query = db.query(LandingPage).filter(LandingPage.client_id == client_id)
    views_query = db.query(PageView).join(LandingPage).filter(LandingPage.client_id == client_id)
    leads_query = db.query(Lead).join(LandingPage).filter(LandingPage.client_id == client_id)
    
    total_views = views_query.count()
    total_leads = leads_query.count()
    cvr = (total_leads / total_views * 100) if total_views > 0 else 0.0

    overview = OverviewStats(views=total_views, leads=total_leads, cvr=round(cvr, 2))
    
    client_name = client.company_name or f"{client.first_name} {client.last_name}".strip() or "Client"

    return ClientProgressReport(
        client_name=client_name,
        report_date=datetime.utcnow().strftime("%B %d, %Y"),
        squad=squad_list,
        completed_tasks=completed_tasks,
        in_progress_tasks=in_progress_tasks,
        overview=overview
    )

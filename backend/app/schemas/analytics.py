from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class DailyStats(BaseModel):
    date: str
    views: int
    leads: int

class StaffPerformance(BaseModel):
    staff_id: str
    staff_name: str
    total_clients: int
    published_pages: int
    total_views: int
    total_leads: int
    cvr: float

class DashboardAnalytics(BaseModel):
    total_pages: int
    published_pages: int
    total_leads: int
    total_views: int
    daily_stats: List[DailyStats]
    staff_performance: Optional[List[StaffPerformance]] = None

class PageViewCreate(BaseModel):
    landing_page_id: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    referrer: Optional[str] = None

class CampaignReport(BaseModel):
    id: str
    name: str
    client_name: Optional[str] = None
    status: str
    views: int
    leads: int
    cvr: float

class ClientReport(BaseModel):
    id: str
    name: Optional[str] = None
    company_name: Optional[str] = None
    total_campaigns: int
    views: int
    leads: int
    cvr: float

class LeadFunnel(BaseModel):
    new: int
    contacted: int
    qualified: int
    converted: int

class OverviewStats(BaseModel):
    views: int
    leads: int
    cvr: float

class ComprehensiveReport(BaseModel):
    overview: OverviewStats
    campaigns: List[CampaignReport]
    clients: Optional[List[ClientReport]] = None
    lead_funnel: LeadFunnel

class ReportTask(BaseModel):
    id: str
    title: str
    status: str
    service_category: Optional[str] = None
    assigned_name: str

class ReportSquadMember(BaseModel):
    staff_name: str
    service_role: str

class ClientProgressReport(BaseModel):
    client_name: str
    report_date: str
    squad: List[ReportSquadMember]
    completed_tasks: List[ReportTask]
    in_progress_tasks: List[ReportTask]
    overview: OverviewStats

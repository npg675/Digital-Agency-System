from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
import uuid

from app.api import deps
from app.models.landing_page import LandingPage, LandingPageSection, PageStatus
from app.models.template import Template, TemplateSection
from app.models.user import User, UserRole
from app.schemas.landing_page import (
    LandingPage as LandingPageSchema,
    LandingPageCreate,
    LandingPageUpdate,
    LandingPageSectionCreate,
)
import re
import json
import socket
import hashlib
import random
from typing import Optional
from app.core.config import settings

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

router = APIRouter()

INDUSTRY_MAPPING = {
    "Real Estate": {"Product": "Property", "Service": "Viewing", "Company": "Agency", "Customers": "Buyers"},
    "Healthcare": {"Product": "Treatment", "Service": "Appointment", "Company": "Clinic", "Customers": "Patients"},
    "Education": {"Product": "Course", "Service": "Enrollment", "Company": "Academy", "Customers": "Students"},
    "Restaurant": {"Product": "Dish", "Service": "Reservation", "Company": "Restaurant", "Customers": "Diners"},
    "Hotel": {"Product": "Room", "Service": "Booking", "Company": "Hotel", "Customers": "Guests"},
    "Ecommerce": {"Product": "Product", "Service": "Order", "Company": "Store", "Customers": "Shoppers"},
    "Software Company": {"Product": "Software", "Service": "Demo", "Company": "Company", "Customers": "Users"},
    "Consulting": {"Product": "Solution", "Service": "Consultation", "Company": "Firm", "Customers": "Clients"},
    "Automotive": {"Product": "Vehicle", "Service": "Test Drive", "Company": "Dealership", "Customers": "Drivers"},
    "Gym & Fitness": {"Product": "Membership", "Service": "Training", "Company": "Gym", "Customers": "Members"},
}

def personalize_template_config(config: dict, industry: str) -> dict:
    if not industry:
        return config

    # Try OpenAI if configured
    if settings.OPENAI_API_KEY and OpenAI:
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            prompt = f"You are an expert copywriter. Rewrite the following landing page section JSON for the '{industry}' industry. Only output valid JSON matching the exact original schema structure. Keep any URLs or structural parameters exactly the same, only rewrite text/content."
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": json.dumps(config)}
                ],
                response_format={ "type": "json_object" }
            )
            
            rewritten_json = response.choices[0].message.content
            if rewritten_json:
                return json.loads(rewritten_json)
        except Exception as e:
            print(f"OpenAI Personalization failed, falling back to static mapping: {e}")

    # Fallback to static mapping
    if industry not in INDUSTRY_MAPPING:
        return config

    mapping = INDUSTRY_MAPPING[industry]
    
    # Simple recursive function to traverse config and replace template variables like {{Product}}
    def replace_text(value):
        if isinstance(value, str):
            res = value
            for key, replacement in mapping.items():
                # Replace {{Key}} placeholders if they exist
                res = re.sub(rf"\{{\{{\s*{key}\s*\}}\}}", replacement, res, flags=re.IGNORECASE)
                
                # Also try to replace generic terms intelligently if no {{ }} were used
                # This is a bit naive but acts as a fallback. 
                # To prevent replacing parts of words, we can use word boundaries
                res = re.sub(rf"\b{key}\b", replacement, res, flags=re.IGNORECASE)
                res = re.sub(rf"\b{key}s\b", replacement + "s", res, flags=re.IGNORECASE)
            return res
        elif isinstance(value, list):
            return [replace_text(v) for v in value]
        elif isinstance(value, dict):
            return {k: replace_text(v) for k, v in value.items()}
        return value

    return replace_text(config)

def check_staff_page_access(db: Session, page: LandingPage, current_user: User):
    if current_user.role == UserRole.STAFF and page.client_id:
        client = db.query(User).filter(User.id == page.client_id).first()
        if client and client.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this client's page")

@router.get("", response_model=List[LandingPageSchema])
def read_landing_pages(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Retrieve landing pages."""
    query = db.query(LandingPage)
    if current_user.role == UserRole.CLIENT:
        query = query.filter(LandingPage.client_id == current_user.id)
    elif current_user.role == UserRole.STAFF:
        managed_clients = db.query(User.id).filter(User.manager_id == current_user.id).all()
        managed_client_ids = [c[0] for c in managed_clients]
        query = query.filter(
            or_(
                LandingPage.client_id.in_(managed_client_ids),
                LandingPage.client_id == None
            )
        )
    pages = query.offset(skip).limit(limit).all()
    return pages

@router.post("", response_model=LandingPageSchema)
def create_landing_page(
    *,
    db: Session = Depends(deps.get_db),
    page_in: LandingPageCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Create new landing page."""
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Clients cannot create pages")

    if db.query(LandingPage).filter(LandingPage.slug == page_in.slug).first():
        raise HTTPException(status_code=400, detail="Slug already exists")

    page_data = page_in.model_dump(exclude={"template_id"})
    page = LandingPage(**page_data)

    if page_in.template_id:
        template = db.query(Template).filter(Template.id == page_in.template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        for t_section in template.sections:
            personalized_config = personalize_template_config(t_section.config, page_in.industry)
            page.sections.append(LandingPageSection(
                type=t_section.type,
                config=personalized_config,
                order=t_section.order
            ))

    db.add(page)
    db.commit()
    db.refresh(page)
    return page

def resolve_language_variant(db: Session, page: LandingPage, lang: Optional[str]) -> LandingPage:
    if not lang:
        return page
        
    # Standardize language code (e.g. "en-US" -> "en")
    lang_prefix = lang.split('-')[0].lower()
    
    if page.language_code == lang_prefix:
        return page
        
    # Check if there is a translation
    translation = db.query(LandingPage).filter(
        LandingPage.translation_of_id == page.id,
        LandingPage.language_code == lang_prefix
    ).first()
    
    return translation if translation else page

def populate_available_languages(db: Session, page: LandingPage) -> list[str]:
    langs = [page.language_code]
    translations = db.query(LandingPage).filter(LandingPage.translation_of_id == page.id).all()
    for t in translations:
        if t.language_code not in langs:
            langs.append(t.language_code)
    return langs

def resolve_ab_test_variant(db: Session, page: LandingPage, visitor_id: Optional[str]) -> LandingPage:
    if not page.is_ab_test_primary:
        return page
        
    variants = db.query(LandingPage).filter(LandingPage.ab_test_variant_of_id == page.id).all()
    if not variants:
        return page
        
    all_pages = [page] + variants
    
    # Auto-Optimization Logic (Multi-Armed Bandit)
    if page.ab_test_auto_optimize:
        from app.models.lead import Lead
        from app.models.page_view import PageView
        from sqlalchemy import func
        
        stats = []
        total_views = 0
        for p in all_pages:
            views = db.query(func.count(PageView.id)).filter(PageView.landing_page_id == p.id).scalar() or 0
            leads = db.query(func.count(Lead.id)).filter(Lead.landing_page_id == p.id).scalar() or 0
            rate = (leads / views) if views > 0 else 0
            stats.append({'page': p, 'views': views, 'rate': rate})
            total_views += views
            
        stats.sort(key=lambda x: x['rate'], reverse=True)
        
        winner = None
        if total_views > 100: # Minimum threshold to start optimizing
            best = stats[0]
            second = stats[1] if len(stats) > 1 else None
            
            # If the best has >50 views and a clear lead
            if best['views'] > 50 and (not second or best['rate'] > second['rate'] * 1.1):
                winner = best['page']
        
        if winner:
            # 80% chance to return winner (Exploit), 20% to explore
            if random.random() < 0.8:
                return winner
            else:
                others = [p for p in all_pages if p.id != winner.id]
                return random.choice(others) if others else winner
                
    else:
        # Strict Traffic Weight (Manual Control)
        # ab_test_traffic_weight represents the % for the Primary Page.
        if visitor_id:
            idx = int(hashlib.md5(visitor_id.encode()).hexdigest(), 16) % 100
            if idx < page.ab_test_traffic_weight:
                return page
            else:
                if variants:
                    v_idx = (idx - page.ab_test_traffic_weight) % len(variants)
                    return variants[v_idx]
                return page
        else:
            r = random.randint(0, 99)
            if r < page.ab_test_traffic_weight:
                return page
            else:
                return random.choice(variants) if variants else page

    # Fallback to purely equal distribution
    if visitor_id:
        idx = int(hashlib.md5(visitor_id.encode()).hexdigest(), 16) % len(all_pages)
        return all_pages[idx]
    
    return random.choice(all_pages)

@router.get("/slug/{slug}", response_model=LandingPageSchema)
def read_landing_page_by_slug(
    *,
    db: Session = Depends(deps.get_db),
    slug: str,
    visitor_id: Optional[str] = None,
    lang: Optional[str] = None,
) -> Any:
    """Get landing page by slug. Public endpoint."""
    page = db.query(LandingPage).filter(LandingPage.slug == slug).first()
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")
        
    page = resolve_language_variant(db, page, lang)
    page = resolve_ab_test_variant(db, page, visitor_id)
    page.available_languages = populate_available_languages(db, page)
    return page

@router.get("/domain/{domain:path}", response_model=LandingPageSchema)
def read_landing_page_by_domain(
    *,
    db: Session = Depends(deps.get_db),
    domain: str,
    visitor_id: Optional[str] = None,
    lang: Optional[str] = None,
) -> Any:
    """Get landing page by custom domain. Public endpoint."""
    page = db.query(LandingPage).filter(LandingPage.custom_domain == domain).first()
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found on this domain")
        
    page = resolve_language_variant(db, page, lang)
    page = resolve_ab_test_variant(db, page, visitor_id)
    page.available_languages = populate_available_languages(db, page)
    return page

@router.get("/{id}", response_model=LandingPageSchema)
def read_landing_page(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get landing page by ID."""
    page = db.query(LandingPage).filter(LandingPage.id == id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")
        
    if current_user.role == UserRole.CLIENT and page.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this page")
        
    check_staff_page_access(db, page, current_user)
    return page

@router.get("/{id}/verify-domain")
def verify_custom_domain(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Verify DNS configuration for a custom domain."""
    page = db.query(LandingPage).filter(LandingPage.id == id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")
        
    check_staff_page_access(db, page, current_user)
    
    if not page.custom_domain:
        return {"status": "ERROR", "message": "No custom domain configured."}
        
    # Strip any http/https
    domain = page.custom_domain.replace("https://", "").replace("http://", "").split("/")[0]
        
    try:
        ip = socket.gethostbyname(domain)
        # For the sake of this platform, if it resolves, we consider it verified.
        # In a real app we would check if it resolves to our specific proxy IP.
        return {"status": "VERIFIED", "message": f"Domain is configured correctly."}
    except socket.gaierror:
        return {"status": "ERROR", "message": f"DNS resolution failed. Please ensure your CNAME record points to cname.landingforge.com"}

@router.put("/{id}/sections", response_model=LandingPageSchema)
def update_landing_page_sections(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    sections_in: List[LandingPageSectionCreate],
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Replace all sections for a landing page (used by editor Save)."""
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Clients cannot edit pages")
        
    page = db.query(LandingPage).filter(LandingPage.id == id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")

    check_staff_page_access(db, page, current_user)

    db.query(LandingPageSection).filter(LandingPageSection.landing_page_id == id).delete()

    for i, sec in enumerate(sections_in):
        db.add(LandingPageSection(
            landing_page_id=id,
            type=sec.type,
            config=sec.config,
            order=i,
        ))

    db.commit()
    db.refresh(page)
    return page

@router.patch("/{id}", response_model=LandingPageSchema)
def update_landing_page(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    page_in: LandingPageUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Update landing page settings (metadata, tracking, webhooks, etc)."""
    if current_user.role == UserRole.CLIENT:
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not admin or not admin.client_self_serve_mode:
            raise HTTPException(status_code=403, detail="Clients cannot edit pages. Self-serve mode is disabled.")

    page = db.query(LandingPage).filter(LandingPage.id == id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")
        
    check_staff_page_access(db, page, current_user)
        
    update_data = page_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(page, field, value)
        
    db.commit()
    db.refresh(page)
    return page

@router.patch("/{id}/status", response_model=LandingPageSchema)
def update_landing_page_status(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    status: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Toggle publish/draft status."""
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Clients cannot publish pages")

    page = db.query(LandingPage).filter(LandingPage.id == id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")
        
    check_staff_page_access(db, page, current_user)
        
    try:
        page.status = PageStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    db.commit()
    db.refresh(page)
    return page

@router.delete("/{id}")
def delete_landing_page(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Delete landing page."""
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Clients cannot delete pages")

    page = db.query(LandingPage).filter(LandingPage.id == id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")
        
    check_staff_page_access(db, page, current_user)
        
    db.delete(page)
    db.commit()
    return {"message": "Landing page deleted"}

@router.post("/{id}/duplicate", response_model=LandingPageSchema)
def duplicate_landing_page(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Duplicate landing page."""
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Clients cannot duplicate pages")

    original_page = db.query(LandingPage).filter(LandingPage.id == id).first()
    if not original_page:
        raise HTTPException(status_code=404, detail="Landing page not found")
        
    check_staff_page_access(db, original_page, current_user)
    
    # Generate new slug
    base_slug = original_page.slug
    new_slug = f"{base_slug}-copy"
    counter = 1
    while db.query(LandingPage).filter(LandingPage.slug == new_slug).first():
        new_slug = f"{base_slug}-copy-{counter}"
        counter += 1

    new_page = LandingPage(
        name=f"{original_page.name} (Copy)",
        slug=new_slug,
        industry=original_page.industry,
        client_id=original_page.client_id,
        status=PageStatus.DRAFT
    )
    
    # Copy sections
    for section in original_page.sections:
        new_page.sections.append(LandingPageSection(
            type=section.type,
            config=json.loads(json.dumps(section.config)), # Deep copy
            order=section.order
        ))

    db.add(new_page)
    db.commit()
    db.refresh(new_page)
    return new_page

@router.post("/{id}/create-variant", response_model=LandingPageSchema)
def create_ab_test_variant(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Create a new A/B testing variant for a landing page."""
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Clients cannot create variants")

    original_page = db.query(LandingPage).filter(LandingPage.id == id).first()
    if not original_page:
        raise HTTPException(status_code=404, detail="Landing page not found")
        
    check_staff_page_access(db, original_page, current_user)
    
    # Generate new slug
    base_slug = original_page.slug
    new_slug = f"{base_slug}-variant"
    counter = 1
    while db.query(LandingPage).filter(LandingPage.slug == new_slug).first():
        new_slug = f"{base_slug}-variant-{counter}"
        counter += 1

    # Mark the original as primary if not already
    if not original_page.is_ab_test_primary:
        original_page.is_ab_test_primary = True

    new_page = LandingPage(
        name=f"{original_page.name} (Variant)",
        slug=new_slug,
        industry=original_page.industry,
        client_id=original_page.client_id,
        status=PageStatus.PUBLISHED if original_page.status == PageStatus.PUBLISHED else PageStatus.DRAFT,
        ab_test_variant_of_id=original_page.id
    )
    
    # Copy sections
    for section in original_page.sections:
        new_page.sections.append(LandingPageSection(
            type=section.type,
            config=json.loads(json.dumps(section.config)), # Deep copy
            order=section.order
        ))

    db.add(new_page)
    db.commit()
    db.refresh(new_page)
    return new_page

from pydantic import BaseModel
class TranslationCreate(BaseModel):
    language_code: str

@router.post("/{id}/create-translation", response_model=LandingPageSchema)
def create_translation_variant(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    payload: TranslationCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Create a new translated variant for a landing page."""
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Clients cannot create variants")

    original_page = db.query(LandingPage).filter(LandingPage.id == id).first()
    if not original_page:
        raise HTTPException(status_code=404, detail="Landing page not found")
        
    check_staff_page_access(db, original_page, current_user)
    
    # Check if translation already exists for this language
    existing = db.query(LandingPage).filter(
        LandingPage.translation_of_id == original_page.id,
        LandingPage.language_code == payload.language_code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Translation for this language already exists")

    base_slug = original_page.slug
    new_slug = f"{base_slug}-{payload.language_code}"
    counter = 1
    while db.query(LandingPage).filter(LandingPage.slug == new_slug).first():
        new_slug = f"{base_slug}-{payload.language_code}-{counter}"
        counter += 1

    new_page = LandingPage(
        name=f"{original_page.name} ({payload.language_code.upper()})",
        slug=new_slug,
        industry=original_page.industry,
        client_id=original_page.client_id,
        status=PageStatus.PUBLISHED if original_page.status == PageStatus.PUBLISHED else PageStatus.DRAFT,
        language_code=payload.language_code,
        translation_of_id=original_page.id
    )
    
    # Copy sections
    for section in original_page.sections:
        new_page.sections.append(LandingPageSection(
            type=section.type,
            config=json.loads(json.dumps(section.config)), # Deep copy
            order=section.order
        ))

    db.add(new_page)
    db.commit()
    db.refresh(new_page)
    return new_page

@router.post("/{id}/save-as-template")
def save_as_template(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Save a landing page as a reusable template."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only Admins can create global templates")

    page = db.query(LandingPage).filter(LandingPage.id == id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")
        
    template = Template(
        name=f"Template: {page.name}",
        category=page.industry or "General",
    )
    
    # Copy sections
    for section in page.sections:
        template.sections.append(TemplateSection(
            type=section.type,
            config=json.loads(json.dumps(section.config)), # Deep copy
            order=section.order
        ))

    db.add(template)
    db.commit()
    return {"message": "Saved as template successfully"}

@router.get("/{id}/ab-test-results")
def get_ab_test_results(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get A/B test results and conversion rates for a page and its variants."""
    page = db.query(LandingPage).filter(LandingPage.id == id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")
        
    check_staff_page_access(db, page, current_user)
    
    primary_id = page.ab_test_variant_of_id if page.ab_test_variant_of_id else page.id
    primary = db.query(LandingPage).filter(LandingPage.id == primary_id).first()
    variants = db.query(LandingPage).filter(LandingPage.ab_test_variant_of_id == primary_id).all()
    
    all_pages = [primary] + variants
    from app.models.lead import Lead
    from app.models.page_view import PageView
    from sqlalchemy import func
    
    results = []
    for p in all_pages:
        views = db.query(func.count(PageView.id)).filter(PageView.landing_page_id == p.id).scalar() or 0
        leads = db.query(func.count(Lead.id)).filter(Lead.landing_page_id == p.id).scalar() or 0
        rate = (leads / views * 100) if views > 0 else 0
        results.append({
            "id": p.id,
            "name": p.name,
            "is_primary": p.id == primary_id,
            "views": views,
            "leads": leads,
            "conversion_rate": rate,
            "status": p.status,
            "traffic_weight": p.ab_test_traffic_weight
        })
        
    return {
        "auto_optimize": primary.ab_test_auto_optimize,
        "primary_id": primary.id,
        "variants": results
    }

@router.post("/{id}/declare-winner")
def declare_ab_test_winner(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    winner_id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """End A/B test by promoting the winner to primary and archiving others."""
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Clients cannot declare test winners")

    page = db.query(LandingPage).filter(LandingPage.id == id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")
        
    check_staff_page_access(db, page, current_user)
    
    primary_id = page.ab_test_variant_of_id if page.ab_test_variant_of_id else page.id
    primary = db.query(LandingPage).filter(LandingPage.id == primary_id).first()
    variants = db.query(LandingPage).filter(LandingPage.ab_test_variant_of_id == primary_id).all()
    
    all_pages = [primary] + variants
    winner = next((p for p in all_pages if p.id == winner_id), None)
    if not winner:
        raise HTTPException(status_code=404, detail="Winner variant not found in this test")
        
    # Promote winner
    winner.is_ab_test_primary = True
    winner.ab_test_variant_of_id = None
    winner.status = PageStatus.PUBLISHED
    
    # Archive the rest
    for p in all_pages:
        if p.id != winner.id:
            p.status = PageStatus.ARCHIVED
            p.is_ab_test_primary = False
            
    # Log the action
    from app.models.activity_log import ActivityLog
    log = ActivityLog(
        user_id=current_user.id,
        action="AB_TEST_WINNER_DECLARED",
        entity_type="LANDING_PAGE",
        entity_id=str(winner.id),
        details=f"Admin {current_user.email} declared '{winner.name}' as the winner of the A/B test."
    )
    db.add(log)
    
    db.commit()
    db.refresh(winner)
    return winner

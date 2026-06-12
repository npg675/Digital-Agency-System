from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.api import deps
from app.models.template import Template, TemplateSection, TemplateCategory
from app.models.user import User
from app.schemas.template import Template as TemplateSchema, TemplateCreate, TemplateUpdate
from app.core.presets import get_preset_sections

router = APIRouter()

@router.get("", response_model=List[TemplateSchema])
def read_templates(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Retrieve templates."""
    templates = db.query(Template).offset(skip).limit(limit).all()
    return templates

@router.post("", response_model=TemplateSchema)
def create_template(
    *,
    db: Session = Depends(deps.get_db),
    template_in: TemplateCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Create new template."""
    template = Template(**template_in.model_dump())
    
    # Auto-populate smart sections based on category
    preset_sections = get_preset_sections(template.category)
    for sec_data in preset_sections:
        template.sections.append(TemplateSection(
            type=sec_data["type"],
            config=sec_data["config"],
            order=sec_data["order"]
        ))
        
    db.add(template)
    db.commit()
    db.refresh(template)
    return template

@router.post("/seed", response_model=List[TemplateSchema])
def seed_default_templates(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Seed default industry templates with rich pre-built sections."""
    SEED_TEMPLATES = [
        {
            "name": "Modern Business",
            "category": TemplateCategory.CONSULTING,
            "thumbnail_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
            "sections": [
                {
                    "type": "Hero",
                    "order": 0,
                    "config": {
                        "title": "Grow Your Business With Expert Strategy",
                        "subtitle": "We help ambitious companies scale faster, smarter, and more profitably with proven consulting frameworks.",
                        "ctaText": "Book a Free Consultation",
                        "ctaLink": "#contact",
                        "backgroundImage": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80",
                        "overlayOpacity": 0.6,
                        "buttonColor": "#6366f1"
                    }
                },
                {
                    "type": "Stats",
                    "order": 1,
                    "config": {
                        "title": "Trusted by Industry Leaders",
                        "stats": [
                            {"value": "500+", "label": "Clients Served"},
                            {"value": "98%", "label": "Satisfaction Rate"},
                            {"value": "12+", "label": "Years Experience"},
                            {"value": "$2B+", "label": "Revenue Generated"}
                        ]
                    }
                },
                {
                    "type": "Features",
                    "order": 2,
                    "config": {
                        "title": "Why Choose Us",
                        "subtitle": "We bring world-class expertise to every engagement",
                        "features": [
                            {"icon": "🎯", "title": "Strategic Planning", "description": "Data-driven roadmaps tailored to your unique market position and growth objectives."},
                            {"icon": "📈", "title": "Revenue Growth", "description": "Proven frameworks that consistently deliver 2-5x revenue improvements within 12 months."},
                            {"icon": "🤝", "title": "Expert Network", "description": "Access to our curated network of 200+ industry specialists across every vertical."},
                            {"icon": "⚡", "title": "Fast Execution", "description": "Agile methodology that gets strategies implemented in weeks, not quarters."},
                            {"icon": "🔒", "title": "Risk Management", "description": "Comprehensive risk assessment and mitigation strategies to protect your investment."},
                            {"icon": "📊", "title": "Data Analytics", "description": "Advanced analytics dashboards giving you real-time visibility into every KPI."}
                        ]
                    }
                },
                {
                    "type": "About",
                    "order": 3,
                    "config": {
                        "title": "A Decade of Delivering Results",
                        "description": "Founded in 2012, we've grown from a boutique advisory firm into a global consulting powerhouse. Our team of 150+ specialists spans strategy, operations, technology, and finance — united by one mission: making our clients undeniably successful.\n\nWe don't believe in one-size-fits-all solutions. Every engagement starts with deep listening, rigorous analysis, and a commitment to understanding your specific challenges and opportunities.",
                        "image": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
                        "imagePosition": "right"
                    }
                },
                {
                    "type": "Testimonials",
                    "order": 4,
                    "config": {
                        "title": "What Our Clients Say",
                        "subtitle": "Don't take our word for it",
                        "testimonials": [
                            {"name": "Sarah Johnson", "role": "CEO, TechVentures", "content": "Working with this team transformed our entire go-to-market strategy. We 3x'd revenue in 18 months.", "avatar": "https://i.pravatar.cc/150?img=47"},
                            {"name": "Michael Chen", "role": "COO, GrowthCo", "content": "The depth of expertise and speed of execution was unlike anything I've experienced in 20 years of business.", "avatar": "https://i.pravatar.cc/150?img=12"},
                            {"name": "Emma Williams", "role": "Founder, ScaleUp", "content": "They didn't just consult — they rolled up their sleeves and worked alongside us every step of the way.", "avatar": "https://i.pravatar.cc/150?img=32"}
                        ]
                    }
                },
                {
                    "type": "Contact",
                    "order": 5,
                    "config": {
                        "title": "Ready to Accelerate Your Growth?",
                        "subtitle": "Book a free 30-minute strategy call and discover what's possible",
                        "fields": ["Full Name", "Email Address", "Phone Number", "Company Name", "Message"],
                        "buttonText": "Book My Free Call →",
                        "backgroundColor": "#6366f1"
                    }
                }
            ]
        },
        {
            "name": "Real Estate Premium",
            "category": TemplateCategory.REAL_ESTATE,
            "thumbnail_url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
            "sections": [
                {
                    "type": "Hero",
                    "order": 0,
                    "config": {
                        "title": "Find Your Dream Home Today",
                        "subtitle": "Exclusive properties in prime locations. Trusted by thousands of satisfied families across the region.",
                        "ctaText": "Browse Properties",
                        "ctaLink": "#contact",
                        "backgroundImage": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80",
                        "overlayOpacity": 0.5,
                        "buttonColor": "#f59e0b"
                    }
                },
                {
                    "type": "Stats",
                    "order": 1,
                    "config": {
                        "title": "Our Track Record Speaks for Itself",
                        "stats": [
                            {"value": "1,200+", "label": "Homes Sold"},
                            {"value": "15+", "label": "Years in Market"},
                            {"value": "99%", "label": "Client Satisfaction"},
                            {"value": "₹500Cr+", "label": "Total Sales Value"}
                        ]
                    }
                },
                {
                    "type": "Features",
                    "order": 2,
                    "config": {
                        "title": "Why Buyers & Sellers Choose Us",
                        "subtitle": "Your trusted partner in every property journey",
                        "features": [
                            {"icon": "🏡", "title": "Premium Listings", "description": "Exclusive access to off-market properties and premium developments before they go public."},
                            {"icon": "💰", "title": "Best Price Guarantee", "description": "Our market expertise ensures you buy at the right price and sell for maximum value."},
                            {"icon": "📋", "title": "End-to-End Support", "description": "From property search to registration — we handle every step of the transaction."},
                            {"icon": "🔍", "title": "Due Diligence", "description": "Thorough legal and technical verification on every property we recommend."},
                            {"icon": "🏦", "title": "Home Loan Assistance", "description": "Tie-ups with 20+ banks for the best loan rates and fastest approvals."},
                            {"icon": "📞", "title": "24/7 Support", "description": "Our agents are always available to answer questions and schedule viewings."}
                        ]
                    }
                },
                {
                    "type": "Gallery",
                    "order": 3,
                    "config": {
                        "title": "Featured Properties",
                        "subtitle": "Handpicked homes that redefine luxury living",
                        "images": [
                            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
                            "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
                            "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
                            "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80"
                        ]
                    }
                },
                {
                    "type": "Testimonials",
                    "order": 4,
                    "config": {
                        "title": "Happy Homeowners",
                        "subtitle": "Real stories from real families",
                        "testimonials": [
                            {"name": "Rahul & Priya Sharma", "role": "Purchased 3BHK in Baner", "content": "The team made our first home purchase completely stress-free. Found our dream home within 3 weeks!", "avatar": "https://i.pravatar.cc/150?img=68"},
                            {"name": "Amit Patel", "role": "Sold 2 properties", "content": "Got 15% above my expected price on both properties. Their negotiation skills are outstanding.", "avatar": "https://i.pravatar.cc/150?img=55"},
                            {"name": "Neha Gupta", "role": "NRI Investor", "content": "Managing a property purchase from abroad was seamless. Excellent communication throughout.", "avatar": "https://i.pravatar.cc/150?img=44"}
                        ]
                    }
                },
                {
                    "type": "Contact",
                    "order": 5,
                    "config": {
                        "title": "Schedule a Free Property Consultation",
                        "subtitle": "Tell us what you're looking for and we'll find it",
                        "fields": ["Full Name", "Email Address", "Phone Number", "Budget Range", "Message"],
                        "buttonText": "Request Free Consultation",
                        "backgroundColor": "#f59e0b"
                    }
                }
            ]
        },
        {
            "name": "Healthcare Clinic",
            "category": TemplateCategory.HEALTHCARE,
            "thumbnail_url": "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&q=80",
            "sections": [
                {
                    "type": "Hero",
                    "order": 0,
                    "config": {
                        "title": "Modern Healthcare You Can Trust",
                        "subtitle": "Comprehensive medical services with a patient-first approach. Book your appointment today and experience the difference.",
                        "ctaText": "Book Appointment",
                        "ctaLink": "#contact",
                        "backgroundImage": "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1600&q=80",
                        "overlayOpacity": 0.6,
                        "buttonColor": "#0ea5e9"
                    }
                },
                {
                    "type": "Features",
                    "order": 1,
                    "config": {
                        "title": "Our Departments",
                        "subtitle": "Specialized care across all major disciplines",
                        "features": [
                            {"icon": "🩺", "title": "General Medicine", "description": "Comprehensive check-ups and preventative care."},
                            {"icon": "❤️", "title": "Cardiology", "description": "Advanced heart health diagnostics and treatment."},
                            {"icon": "🦷", "title": "Dentistry", "description": "Complete oral care from routine cleaning to surgery."},
                            {"icon": "👶", "title": "Pediatrics", "description": "Dedicated care for infants, children, and adolescents."},
                            {"icon": "👁️", "title": "Ophthalmology", "description": "Vision correction and eye disease management."},
                            {"icon": "🚑", "title": "Emergency", "description": "24/7 trauma and emergency medical services."}
                        ]
                    }
                },
                {
                    "type": "Testimonials",
                    "order": 2,
                    "config": {
                        "title": "Patient Stories",
                        "subtitle": "Read what our patients have to say about their recovery",
                        "testimonials": [
                            {"name": "Robert Smith", "role": "Cardiology Patient", "content": "The doctors here saved my life. The level of care and attention is unmatched.", "avatar": "https://i.pravatar.cc/150?img=11"},
                            {"name": "Lisa Wang", "role": "Pediatric Parent", "content": "My children actually look forward to visiting the doctor now. The pediatric staff is incredible.", "avatar": "https://i.pravatar.cc/150?img=5"}
                        ]
                    }
                },
                {
                    "type": "Contact",
                    "order": 3,
                    "config": {
                        "title": "Book Your Appointment",
                        "subtitle": "Our staff will get back to you within 2 hours to confirm your slot.",
                        "fields": ["Patient Name", "Phone Number", "Email Address", "Department", "Preferred Date"],
                        "buttonText": "Request Appointment",
                        "backgroundColor": "#0ea5e9"
                    }
                }
            ]
        },
        {
            "name": "SaaS Startup",
            "category": TemplateCategory.SOFTWARE,
            "thumbnail_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
            "sections": [
                {
                    "type": "Hero",
                    "order": 0,
                    "config": {
                        "title": "The Ultimate Platform for Remote Teams",
                        "subtitle": "Streamline your workflows, automate repetitive tasks, and scale your operations without the friction.",
                        "ctaText": "Start Your 14-Day Free Trial",
                        "ctaLink": "#contact",
                        "backgroundImage": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80",
                        "overlayOpacity": 0.8,
                        "buttonColor": "#8b5cf6"
                    }
                },
                {
                    "type": "Stats",
                    "order": 1,
                    "config": {
                        "title": "Powering 10,000+ modern teams",
                        "stats": [
                            {"value": "10M+", "label": "Tasks Automated"},
                            {"value": "99.99%", "label": "Uptime SLA"},
                            {"value": "4.9/5", "label": "G2 Rating"},
                            {"value": "50+", "label": "Native Integrations"}
                        ]
                    }
                },
                {
                    "type": "Features",
                    "order": 2,
                    "config": {
                        "title": "Everything you need to scale",
                        "subtitle": "Built for speed, designed for scale.",
                        "features": [
                            {"icon": "⚡", "title": "Real-time Sync", "description": "Changes reflect instantly across all your devices and team members."},
                            {"icon": "🔒", "title": "Enterprise Security", "description": "SOC2 compliant, end-to-end encryption, and role-based access control."},
                            {"icon": "🔌", "title": "API First", "description": "Connect your existing tools with our robust REST API and webhooks."},
                            {"icon": "📊", "title": "Advanced Analytics", "description": "Get deep insights into your team's productivity and bottlenecks."}
                        ]
                    }
                },
                {
                    "type": "Contact",
                    "order": 3,
                    "config": {
                        "title": "Start Building Today",
                        "subtitle": "No credit card required. Cancel anytime.",
                        "fields": ["Work Email", "Company Name", "Team Size"],
                        "buttonText": "Get Started for Free",
                        "backgroundColor": "#8b5cf6"
                    }
                }
            ]
        }
    ]

    created = []
    for tpl_data in SEED_TEMPLATES:
        existing = db.query(Template).filter(Template.name == tpl_data["name"]).first()
        if existing:
            continue
            
        sections_data = tpl_data.pop("sections")
        template = Template(**tpl_data)
        for sec in sections_data:
            template.sections.append(TemplateSection(
                type=sec["type"],
                config=sec["config"],
                order=sec["order"]
            ))
        db.add(template)
        created.append(template)

    if created:
        db.commit()
        for t in created:
            db.refresh(t)
    return db.query(Template).all()

@router.get("/{id}", response_model=TemplateSchema)
def read_template(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get template by ID."""
    template = db.query(Template).filter(Template.id == id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.put("/{id}", response_model=TemplateSchema)
def update_template(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    template_in: TemplateUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Update template."""
    template = db.query(Template).filter(Template.id == id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = template_in.model_dump(exclude_unset=True)
    category_changed = "category" in update_data and update_data["category"] != template.category
    
    for field, value in update_data.items():
        setattr(template, field, value)
        
    # If category changed, wipe and re-seed the smart sections
    if category_changed:
        # Clear existing sections
        db.query(TemplateSection).filter(TemplateSection.template_id == id).delete()
        db.flush()
        
        # Populate new preset sections
        preset_sections = get_preset_sections(template.category)
        for sec_data in preset_sections:
            template.sections.append(TemplateSection(
                type=sec_data["type"],
                config=sec_data["config"],
                order=sec_data["order"]
            ))
            
    db.commit()
    db.refresh(template)
    return template

@router.delete("/{id}")
def delete_template(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Delete template."""
    template = db.query(Template).filter(Template.id == id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
    return {"message": "Template deleted"}

@router.post("/{id}/duplicate", response_model=TemplateSchema)
def duplicate_template(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Duplicate template."""
    import json
    original_template = db.query(Template).filter(Template.id == id).first()
    if not original_template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    new_template = Template(
        id=uuid.uuid4(),
        name=f"{original_template.name} (Copy)",
        category=original_template.category,
        thumbnail_url=original_template.thumbnail_url
    )
    db.add(new_template)
    db.flush()
    
    # Copy sections
    for section in original_template.sections:
        db.add(TemplateSection(
            id=uuid.uuid4(),
            template_id=new_template.id,
            type=section.type,
            config=json.loads(json.dumps(section.config)), # Deep copy
            order=section.order
        ))
        
    db.commit()
    db.refresh(new_template)
    return new_template

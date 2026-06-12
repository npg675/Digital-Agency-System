import sys
import os
import uuid

# Add the backend directory to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app.models.template import Template, TemplateSection, TemplateCategory

def seed_real_estate_template():
    db: Session = SessionLocal()
    try:
        # Check if it already exists
        existing = db.query(Template).filter(Template.name == "Master Real Estate Template").first()
        if existing:
            print("Template already exists.")
            return

        template = Template(
            id=uuid.uuid4(),
            name="Master Real Estate Template",
            category=TemplateCategory.REAL_ESTATE,
            thumbnail_url="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80"
        )
        db.add(template)
        
        sections = [
            {
                "type": "Hero",
                "config": {
                    "title": "Find Your Dream Home Today",
                    "subtitle": "Unlock access to the most exclusive premium properties in the city. Expert guidance, zero hidden fees, and a seamless buying experience tailored to you.",
                    "ctaText": "Browse Premium Listings",
                    "backgroundImage": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80"
                },
                "order": 0
            },
            {
                "type": "Features",
                "config": {
                    "title": "Why Trust Us With Your Next Move?",
                    "subtitle": "We don't just sell houses; we help you build your future with unparalleled service.",
                    "features": [
                        {
                            "title": "Exclusive Premium Listings",
                            "description": "Get early access to off-market properties and luxury homes before anyone else.",
                            "icon": "Home"
                        },
                        {
                            "title": "Zero Hidden Brokerage Fees",
                            "description": "Total transparency from day one. You'll know exactly what you're paying for.",
                            "icon": "Shield"
                        },
                        {
                            "title": "End-to-End Legal Assistance",
                            "description": "Our in-house legal experts handle all the paperwork, ensuring a hassle-free closing.",
                            "icon": "FileText"
                        }
                    ]
                },
                "order": 1
            },
            {
                "type": "Gallery",
                "config": {
                    "title": "Featured Properties",
                    "subtitle": "A glimpse into the luxury lifestyles awaiting you.",
                    "images": [
                        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80"
                    ]
                },
                "order": 2
            },
            {
                "type": "Testimonials",
                "config": {
                    "title": "What Our Clients Say",
                    "subtitle: ": "Join hundreds of happy homeowners who found their perfect match with us.",
                    "testimonials": [
                        {
                            "name": "Sarah Jenkins",
                            "role": "First-Time Buyer",
                            "content": "They made the impossible happen. We found our dream home in under two weeks without any bidding wars!",
                            "avatar": "https://i.pravatar.cc/150?u=sarah"
                        },
                        {
                            "name": "Michael Chen",
                            "role": "Property Investor",
                            "content": "The transparency and off-market access provided by this team is unmatched. Highly recommended.",
                            "avatar": "https://i.pravatar.cc/150?u=michael"
                        }
                    ]
                },
                "order": 3
            },
            {
                "type": "Contact",
                "config": {
                    "title": "Ready to Start Your Journey?",
                    "subtitle": "Schedule a free 30-minute consultation with our lead real estate advisor.",
                    "buttonText": "Request Consultation",
                    "fields": ["Name", "Email", "Phone Number", "Preferred Neighborhood"]
                },
                "order": 4
            }
        ]

        for sec in sections:
            db.add(TemplateSection(
                id=uuid.uuid4(),
                template_id=template.id,
                type=sec["type"],
                config=sec["config"],
                order=sec["order"]
            ))

        db.commit()
        print("Master Real Estate Template successfully seeded!")
    except Exception as e:
        print(f"Error seeding template: {e}")
        db.rollback()
    finally:
        db.close()

def seed_thank_you_templates():
    db: Session = SessionLocal()
    try:
        # Template 1: Video Thank You
        existing_video = db.query(Template).filter(Template.name == "Thank You - Video VSL").first()
        if not existing_video:
            t1 = Template(
                id=uuid.uuid4(),
                name="Thank You - Video VSL",
                category=TemplateCategory.FUNNELS,
                thumbnail_url="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=400&q=80"
            )
            db.add(t1)
            sections_1 = [
                {
                    "type": "Hero",
                    "config": {
                        "title": "You're In! 🎉",
                        "subtitle": "Thank you for requesting access. Please watch the short video below to understand your next steps.",
                        "hideButton": True,
                        "hideBackground": True
                    },
                    "order": 0
                },
                {
                    "type": "Video",
                    "config": {
                        "title": "Next Steps",
                        "subtitle": "Watch this 2-minute overview.",
                        "mode": "embedded",
                        "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        "autoplay": False
                    },
                    "order": 1
                },
                {
                    "type": "Socials",
                    "config": {
                        "title": "Join Our Community",
                        "facebook": "https://facebook.com",
                        "twitter": "https://twitter.com",
                        "hideInstagram": True,
                        "hideLinkedin": True,
                        "hideYoutube": True,
                        "hideTiktok": True
                    },
                    "order": 2
                }
            ]
            for sec in sections_1:
                db.add(TemplateSection(id=uuid.uuid4(), template_id=t1.id, type=sec["type"], config=sec["config"], order=sec["order"]))

        # Template 2: Calendar Booking Thank You
        existing_cal = db.query(Template).filter(Template.name == "Thank You - Calendar Booking").first()
        if not existing_cal:
            t2 = Template(
                id=uuid.uuid4(),
                name="Thank You - Calendar Booking",
                category=TemplateCategory.FUNNELS,
                thumbnail_url="https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=400&q=80"
            )
            db.add(t2)
            sections_2 = [
                {
                    "type": "Hero",
                    "config": {
                        "title": "Your Call is Booked! 📅",
                        "subtitle": "We've sent a calendar invitation to your email. We look forward to speaking with you.",
                        "hideButton": True,
                        "hideBackground": True
                    },
                    "order": 0
                },
                {
                    "type": "Features",
                    "config": {
                        "title": "How to Prepare",
                        "subtitle": "To get the most out of our call, please ensure:",
                        "features": [
                            {"title": "Be in a quiet place", "description": "Ensure you have a stable internet connection and zero distractions.", "icon": "Headphones"},
                            {"title": "Review our materials", "description": "Take a look at the case studies we sent via email.", "icon": "BookOpen"},
                            {"title": "Bring your questions", "description": "Write down 2-3 specific bottlenecks you want to discuss.", "icon": "HelpCircle"}
                        ]
                    },
                    "order": 1
                }
            ]
            for sec in sections_2:
                db.add(TemplateSection(id=uuid.uuid4(), template_id=t2.id, type=sec["type"], config=sec["config"], order=sec["order"]))

        db.commit()
        print("Thank You templates successfully seeded!")
    except Exception as e:
        print(f"Error seeding thank you templates: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_real_estate_template()
    seed_thank_you_templates()

"""
Seed script: Business-in-a-Box Marketing Connective Tissue
Run with: python seed_marketing_assets.py
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.base import Base

# Ensure tables are created
print("Ensuring marketing_asset tables exist...")
Base.metadata.create_all(bind=engine)

from app.models.marketing_asset import MarketingAsset, MarketingSequence, MarketingSequenceStep, MarketingAssetType, StepType
from app.models.workflow import WorkflowTemplate, WorkflowTaskTemplate
from app.models.template import TemplateCategory

def seed_email_sequences(db: Session):
    sequences = [
        # REAL ESTATE 5-DAY NURTURE
        {
            "name": "Luxury Real Estate 5-Day Buyer Nurture",
            "industry_category": TemplateCategory.REAL_ESTATE.value,
            "objective": "Nurture Lead to Consultation Call",
            "steps": [
                {
                    "day_offset": 0,
                    "step_type": StepType.EMAIL,
                    "subject_line": "Your Exclusive Real Estate Guide is Inside 🏡",
                    "body_content": "Hi there,\n\nThank you for requesting our guide. You can download it via the link below.\n\nWhile you read it, I want you to know that the luxury market moves fast. Many of our best properties never even hit the public market. Reply to this email with what you are looking for, and I'll see if I have any off-market matches.\n\nTalk soon,\nThe Team"
                },
                {
                    "day_offset": 1,
                    "step_type": StepType.EMAIL,
                    "subject_line": "The #1 mistake luxury buyers make...",
                    "body_content": "Hi again,\n\nThe biggest mistake we see high-net-worth buyers make is waiting for the 'perfect' listing on Zillow. By the time it's public, it's too late.\n\nOur clients get early access. Do you want early access?\n\nLet's jump on a quick 10-minute call tomorrow to map out exactly what you want. Click here to book a time."
                },
                {
                    "day_offset": 3,
                    "step_type": StepType.EMAIL,
                    "subject_line": "Just Sold: How we saved our client $150k",
                    "body_content": "We recently closed on a waterfront property for a client. The asking price was $2.1M. We secured it for $1.95M through private negotiation.\n\nHaving the right representation isn't just about finding the house; it's about protecting your capital.\n\nIf you're serious about buying in the next 6 months, let's talk. [Book Call]"
                },
                {
                    "day_offset": 5,
                    "step_type": StepType.EMAIL,
                    "subject_line": "Are you still looking?",
                    "body_content": "I haven't heard from you, so I'm assuming you're still just browsing. That's totally fine.\n\nWhen you are ready to get serious and want access to the private inventory, you know where to find us.\n\nBest,\nThe Team"
                }
            ]
        },
        # E-COMMERCE ABANDONED CART / WELCOME
        {
            "name": "Premium E-commerce 3-Day Welcome & Convert",
            "industry_category": TemplateCategory.ECOMMERCE.value,
            "objective": "Drive First Purchase",
            "steps": [
                {
                    "day_offset": 0,
                    "step_type": StepType.EMAIL,
                    "subject_line": "Welcome to the club. Here's your 15% off.",
                    "body_content": "Welcome!\n\nAs promised, use code VIP15 at checkout to get 15% off your first order.\n\nWe build products designed to last a lifetime. Try it for 30 days. If you don't love it, return it for free. No questions asked.\n\n[Shop Now]"
                },
                {
                    "day_offset": 1,
                    "step_type": StepType.EMAIL,
                    "subject_line": "Why we do things differently.",
                    "body_content": "Did you know 90% of brands use cheap synthetic materials? We don't.\n\nWe ethically source everything. When you buy from us, you're buying quality that outlasts the trends. Your 15% off code (VIP15) expires in 48 hours.\n\n[Claim Discount]"
                },
                {
                    "day_offset": 3,
                    "step_type": StepType.EMAIL,
                    "subject_line": "Last chance: Your VIP code expires tonight.",
                    "body_content": "This is it. Your 15% discount code VIP15 expires at midnight.\n\nDon't miss out on upgrading your lifestyle. Click the link below to automatically apply the code at checkout.\n\n[Apply Discount & Shop]"
                }
            ]
        }
    ]

    count = 0
    for seq_data in sequences:
        existing = db.query(MarketingSequence).filter_by(name=seq_data["name"]).first()
        if not existing:
            seq = MarketingSequence(
                name=seq_data["name"],
                industry_category=seq_data["industry_category"],
                objective=seq_data["objective"]
            )
            db.add(seq)
            db.flush()

            for step_data in seq_data["steps"]:
                db.add(MarketingSequenceStep(
                    sequence_id=seq.id,
                    day_offset=step_data["day_offset"],
                    step_type=step_data["step_type"],
                    subject_line=step_data.get("subject_line"),
                    body_content=step_data["body_content"]
                ))
            count += 1
    db.commit()
    print(f"  [OK] Seeded {count} Email Sequences")


def seed_ad_copy(db: Session):
    ads = [
        {
            "asset_type": MarketingAssetType.AD_COPY,
            "industry_category": TemplateCategory.REAL_ESTATE.value,
            "title": "Facebook Ad - Short Direct (Real Estate)",
            "content": "Looking for your dream home? Stop fighting over public Zillow listings. Get exclusive access to our private, off-market luxury inventory before anyone else sees it. Click 'Learn More' to browse our hidden properties."
        },
        {
            "asset_type": MarketingAssetType.AD_COPY,
            "industry_category": TemplateCategory.REAL_ESTATE.value,
            "title": "Facebook Ad - Story-Based (Real Estate)",
            "content": "We recently had a client who was outbid on 3 different homes. They were exhausted. Then they came to us. We didn't show them what was on the market; we showed them what WASN'T on the market. Within 14 days, we secured their dream home entirely off-market. Want to bypass the bidding wars? Click to learn how our private network works."
        },
        {
            "asset_type": MarketingAssetType.AD_COPY,
            "industry_category": TemplateCategory.ECOMMERCE.value,
            "title": "Facebook Ad - Problem/Solution (Ecommerce)",
            "content": "Tired of products that fall apart after a month? So were we. That's why we engineered [Product] with premium materials and a lifetime warranty. It looks better, feels better, and lasts forever. Get 15% off your first order today. [Link]"
        }
    ]

    count = 0
    for ad in ads:
        existing = db.query(MarketingAsset).filter_by(title=ad["title"]).first()
        if not existing:
            db.add(MarketingAsset(**ad))
            count += 1
    db.commit()
    print(f"  [OK] Seeded {count} Ad Copy Assets")

def seed_workflows(db: Session):
    workflows = [
        {
            "name": "Standard Lead Response SLA (Urgent)",
            "description": "A rapid-response SLA designed to contact the lead within 5 minutes and follow up aggressively.",
            "tasks": [
                {"title": "Initial Phone Call (Under 5 mins)", "description": "Call the lead immediately upon receiving the notification.", "due_in_days": 0},
                {"title": "Send SMS Follow-up", "description": "If the lead did not answer the phone call, send the 'Quick Question' SMS template.", "due_in_days": 0},
                {"title": "Day 2 Follow-up Call", "description": "Call the lead again if they did not respond on day 1.", "due_in_days": 1},
                {"title": "Move to Long-Term Nurture", "description": "If unresponsive after 3 days, tag the lead for long-term email sequence.", "due_in_days": 3}
            ]
        }
    ]

    count = 0
    for wf in workflows:
        existing = db.query(WorkflowTemplate).filter_by(name=wf["name"]).first()
        if not existing:
            template = WorkflowTemplate(name=wf["name"], description=wf["description"])
            db.add(template)
            db.flush()

            for t_data in wf["tasks"]:
                db.add(WorkflowTaskTemplate(
                    workflow_id=template.id,
                    title=t_data["title"],
                    description=t_data["description"],
                    due_in_days=t_data["due_in_days"]
                ))
            count += 1
    db.commit()
    print(f"  [OK] Seeded {count} SLA Workflows")

def main():
    print("[*] Starting marketing asset seeding...")
    db: Session = SessionLocal()
    try:
        seed_email_sequences(db)
        seed_ad_copy(db)
        seed_workflows(db)
        print("\\nDone! All marketing assets seeded successfully.")
    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()

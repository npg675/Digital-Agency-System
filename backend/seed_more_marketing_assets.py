import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.marketing_asset import MarketingAsset, MarketingSequence, MarketingSequenceStep, MarketingAssetType, StepType
from app.models.template import TemplateCategory

def seed_more_assets(db: Session):
    sequences = [
        # GYM / FITNESS
        {
            "name": "Local Gym 3-Day Free Trial Follow-up",
            "industry_category": TemplateCategory.GYM.value,
            "objective": "Convert Free Pass to Paid Member",
            "steps": [
                {
                    "day_offset": 0,
                    "step_type": StepType.EMAIL,
                    "subject_line": "Your Free 3-Day VIP Pass is inside 💪",
                    "body_content": "Hey there,\n\nHere is your free 3-Day VIP pass to our facility. Just show this email at the front desk to get started.\n\nMost people quit their fitness journey because they don't know where to start. We won't let that happen to you. Our trainers will be there to show you exactly how to use the equipment.\n\nSee you in the gym,\nThe Team"
                },
                {
                    "day_offset": 2,
                    "step_type": StepType.EMAIL,
                    "subject_line": "How was your first workout?",
                    "body_content": "Just checking in—how was your workout?\n\nIf you have any questions about the machines or want a quick 10-minute form check, reply to this email and we'll have a coach meet you during your next visit.\n\nKeep up the momentum!"
                },
                {
                    "day_offset": 4,
                    "step_type": StepType.EMAIL,
                    "subject_line": "Your pass expired (but here's a gift)",
                    "body_content": "Your 3-day pass just expired. We hope you loved the energy at the gym.\n\nSince you took the first step, we want to make the next step easy. If you sign up for a membership in the next 48 hours, we'll waive the $99 initiation fee.\n\nClick here to claim your spot and keep the momentum going.\n\nLet's get it!"
                }
            ]
        },
        # CONSULTING / COACHING
        {
            "name": "High-Ticket Consulting 7-Day Nurture",
            "industry_category": TemplateCategory.CONSULTING.value,
            "objective": "Book a Discovery Call",
            "steps": [
                {
                    "day_offset": 0,
                    "step_type": StepType.EMAIL,
                    "subject_line": "The Framework you requested...",
                    "body_content": "Hi,\n\nThanks for downloading our Growth Framework. It's attached below.\n\nOver the next few days, I'm going to send you a behind-the-scenes look at how we implemented this exact framework to scale 3 different clients past $1M ARR.\n\nFor now, just read through the PDF and let me know your biggest takeaway."
                },
                {
                    "day_offset": 2,
                    "step_type": StepType.EMAIL,
                    "subject_line": "Case Study: How John added $50k/mo in 60 days",
                    "body_content": "When John came to us, he was working 70-hour weeks and his revenue had plateaued for 6 months.\n\nHe thought he had a lead generation problem. We looked at his business and realized he actually had an offer problem. We tweaked his core offer, raised his prices by 40%, and launched a simple outreach campaign.\n\nThe result? $50k in new MRR in 60 days.\n\nIf you feel stuck at your current revenue level, it might not be a traffic problem. Book a free 15-minute audit call with me and let's find the bottleneck: [Link]"
                },
                {
                    "day_offset": 5,
                    "step_type": StepType.EMAIL,
                    "subject_line": "The brutal truth about scaling.",
                    "body_content": "Here is the reality:\n\nWhat got you to your current level will NOT get you to the next level. You cannot hustle your way past a broken system.\n\nIf you want to scale, you need leverage. Systems, automations, and a clear roadmap. We specialize in building those roadmaps.\n\nMy calendar is open for 3 more calls this week. If you're ready to stop guessing and start scaling, book your slot here: [Link]"
                }
            ]
        },
        # SOFTWARE / SAAS
        {
            "name": "SaaS 14-Day Free Trial Onboarding",
            "industry_category": TemplateCategory.SOFTWARE.value,
            "objective": "Drive Product Adoption & Upgrade",
            "steps": [
                {
                    "day_offset": 0,
                    "step_type": StepType.EMAIL,
                    "subject_line": "Welcome to [Your App]! Here's where to start 🚀",
                    "body_content": "Welcome aboard!\n\nYour 14-day free trial has officially started. Our most successful users all do one thing on their first day: They set up their first project.\n\nClick here to log in and create your first project. It takes less than 3 minutes.\n\nNeed help? Reply to this email and our support team will jump right in."
                },
                {
                    "day_offset": 3,
                    "step_type": StepType.EMAIL,
                    "subject_line": "Unlock advanced automations",
                    "body_content": "Did you know you can automate your most tedious tasks using our built-in workflows?\n\nI recorded a quick 2-minute video showing exactly how to set up an automation that saves our average user 4 hours a week.\n\nWatch the video here: [Link]\n\nGive it a try and let me know what you think!"
                },
                {
                    "day_offset": 12,
                    "step_type": StepType.EMAIL,
                    "subject_line": "Your trial is ending soon. Keep your progress.",
                    "body_content": "Your free trial ends in 48 hours.\n\nYou've already set up your account and started saving time. Don't lose your progress. Upgrade to our Pro plan today to keep access to all premium features and priority support.\n\n[Upgrade Now]"
                }
            ]
        },
        # HEALTHCARE / DENTAL
        {
            "name": "Dental Implant Consultation Follow-up",
            "industry_category": TemplateCategory.HEALTHCARE.value,
            "objective": "Book a Free Consultation",
            "steps": [
                {
                    "day_offset": 0,
                    "step_type": StepType.SMS,
                    "body_content": "Hi! Thanks for your interest in dental implants with [Clinic Name]. Are you looking to replace a single tooth or multiple teeth? Reply to this text to chat!"
                },
                {
                    "day_offset": 1,
                    "step_type": StepType.EMAIL,
                    "subject_line": "Everything you need to know about Dental Implants",
                    "body_content": "Hi there,\n\nGetting dental implants is a big decision. We want you to feel completely confident.\n\nAttached is our free guide covering the process, recovery time, and financing options available at our clinic. We offer a completely free, no-obligation consultation with a 3D scan to see if you are a candidate.\n\nReply to this email or call us at [Phone] to schedule your free scan."
                },
                {
                    "day_offset": 4,
                    "step_type": StepType.EMAIL,
                    "subject_line": "See Sarah's new smile 😁",
                    "body_content": "Sarah hid her smile for 10 years before coming to our clinic. After a quick implant procedure, her confidence completely changed.\n\nYou can see her before/after photos and read her story here: [Link]\n\nDon't wait another year to get your confidence back. Book your free consultation today: [Link]"
                }
            ]
        }
    ]

    ads = [
        # GYM
        {
            "asset_type": MarketingAssetType.AD_COPY,
            "industry_category": TemplateCategory.GYM.value,
            "title": "Facebook Ad - Local Gym Challenge",
            "content": "ATTENTION [City Name] locals! 🚨 We are looking for 15 people who want to completely transform their bodies over the next 6 weeks.\n\nThis isn't a quick fix. You will get unlimited access to our coaches, customized meal plans, and a community that holds you accountable.\n\nSpots always fill up fast. Click 'Apply Now' to claim one of the 15 spots before they are gone!"
        },
        {
            "asset_type": MarketingAssetType.AD_COPY,
            "industry_category": TemplateCategory.GYM.value,
            "title": "Instagram Ad - Free Pass Drop",
            "content": "Tired of crowded gyms and broken equipment? Upgrade your workouts. We're giving away 50 VIP 3-Day Passes to our state-of-the-art facility in [Neighborhood]. Click the link in bio to claim yours instantly."
        },
        # HEALTHCARE
        {
            "asset_type": MarketingAssetType.AD_COPY,
            "industry_category": TemplateCategory.HEALTHCARE.value,
            "title": "Facebook Ad - Dental Implants Consult",
            "content": "Missing teeth affecting your confidence and your diet? You don't have to settle for uncomfortable dentures. Dental implants look, feel, and function just like natural teeth.\n\nFor a limited time, [Clinic Name] is offering a completely FREE Implant Consultation (including a 3D CT Scan - a $300 value) to see if you are a candidate.\n\nClick 'Learn More' to book your free scan today."
        },
        {
            "asset_type": MarketingAssetType.AD_COPY,
            "industry_category": TemplateCategory.HEALTHCARE.value,
            "title": "Google Ad - Chiropractor Pain Relief",
            "content": "Headline: Stop Living With Back Pain | Top Rated Local Chiropractor\nDescription: Get targeted relief for back pain, neck pain, and sciatica. Open late and weekends. Book your new patient exam online today."
        },
        # CONSULTING
        {
            "asset_type": MarketingAssetType.AD_COPY,
            "industry_category": TemplateCategory.CONSULTING.value,
            "title": "LinkedIn Ad - B2B Consulting Lead Gen",
            "content": "If your agency is stuck between $20k-$50k/mo, the bottleneck is your client acquisition system.\n\nRelying on referrals means unpredictable cash flow.\n\nDownload our free 12-page 'Client Acquisition Engine' playbook to see the exact automated outbound system we use to book 15-20 qualified appointments every week on autopilot.\n\nClick below to download the PDF instantly."
        },
        # SOFTWARE
        {
            "asset_type": MarketingAssetType.AD_COPY,
            "industry_category": TemplateCategory.SOFTWARE.value,
            "title": "Facebook Ad - SaaS Retargeting",
            "content": "Still manually entering data? 😩 Stop wasting hours every week on tasks that should be automated.\n\n[Your App] seamlessly syncs your tools and automates the busywork so you can focus on growth. You visited our site, but didn't start your trial. Why wait?\n\nClick here to start your 14-day free trial right now (No credit card required)."
        },
        # AUTOMOTIVE
        {
            "asset_type": MarketingAssetType.AD_COPY,
            "industry_category": TemplateCategory.AUTOMOTIVE.value,
            "title": "Facebook Ad - Auto Detailing Promo",
            "content": "Is your car looking a little rough after the winter weather? 🚙❄️\n\nTreat your ride to our 'Showroom Shine' detailing package! We handle deep interior extraction, exterior wash, clay bar, and a ceramic sealant that lasts for 6 months.\n\n🎁 Special Offer: Book this week and get a FREE engine bay cleaning ($50 value).\n\nClick 'Send Message' to get a quick quote for your vehicle!"
        },
        # BEAUTY
        {
            "asset_type": MarketingAssetType.AD_COPY,
            "industry_category": TemplateCategory.BEAUTY.value,
            "title": "Instagram Ad - Salon Balayage Special",
            "content": "Ready for a hair refresh? ✨ Our master colorists at [Salon Name] are offering $50 off any new Balayage or Full Foil service for first-time clients this month only!\n\nCheck out our recent transformations on our grid. You deserve to leave the salon feeling obsessed with your hair.\n\nTap 'Book Now' to secure your chair. We only have a few spots left for next week!"
        }
    ]

    seq_count = 0
    ad_count = 0

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
            seq_count += 1

    for ad in ads:
        existing = db.query(MarketingAsset).filter_by(title=ad["title"]).first()
        if not existing:
            db.add(MarketingAsset(**ad))
            ad_count += 1

    db.commit()
    print(f"Seeded {seq_count} new sequences and {ad_count} new ad copies.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_more_assets(db)
    finally:
        db.close()

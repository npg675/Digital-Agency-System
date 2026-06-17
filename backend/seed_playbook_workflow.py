import asyncio
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import SessionLocal
from app.models.workflow import WorkflowTemplate, WorkflowTaskTemplate

def seed_playbook_workflow():
    db = SessionLocal()
    
    try:
        # Check if workflow exists, and delete it so we can recreate it with 9 steps
        existing = db.execute(
            select(WorkflowTemplate).where(WorkflowTemplate.name == "A-Z Master Playbook Onboarding")
        ).scalar_one_or_none()
        
        if existing:
            print("Playbook workflow already exists. Deleting to recreate...")
            db.delete(existing)
            db.flush()

        print("Seeding A-Z Master Playbook workflow with 9 Steps...")
        workflow = WorkflowTemplate(
            name="A-Z Master Playbook Onboarding",
            description="The ultimate step-by-step roadmap from first client to world-class delivery."
        )
        db.add(workflow)
        db.flush()

        steps = [
            {
                "title": "Step 1: Agency Setup",
                "description": "Before onboarding clients, configure your Stripe API for billing, AI API keys, SMTP, and White-Label domains.",
                "due_in_days": 1,
                "service_category": "Configuration"
            },
            {
                "title": "Step 2: Client Onboarding",
                "description": "Start by creating the client's profile and configuring their Brand Vault (social links, colors, etc).",
                "due_in_days": 1,
                "service_category": "Onboarding"
            },
            {
                "title": "Step 3: SLAs & Workflows",
                "description": "Assign standard operating procedures (SOPs) and task checklists for the team.",
                "due_in_days": 1,
                "service_category": "Operations"
            },
            {
                "title": "Step 4: Build the Offer",
                "description": "Set up their landing pages and link them together in a high-converting funnel.",
                "due_in_days": 3,
                "service_category": "Development"
            },
            {
                "title": "Step 5: Prepare Marketing",
                "description": "Generate Ad Copy and schedule email sequences for the new funnel.",
                "due_in_days": 5,
                "service_category": "Marketing"
            },
            {
                "title": "Step 6: Launch Campaigns",
                "description": "Go live by scheduling social media posts and tracking paid ads.",
                "due_in_days": 7,
                "service_category": "Marketing"
            },
            {
                "title": "Step 7: Daily Operations",
                "description": "Manage incoming prospects, reply to messages, and book appointments.",
                "due_in_days": 14,
                "service_category": "CRM"
            },
            {
                "title": "Step 8: Scale & Automate",
                "description": "Connect Zapier webhooks to auto-trigger actions, and grant clients access to training courses.",
                "due_in_days": 20,
                "service_category": "Automation"
            },
            {
                "title": "Step 9: Billing & Reports",
                "description": "Send invoices, monitor client reviews, and share performance reports.",
                "due_in_days": 30,
                "service_category": "Finance"
            }
        ]

        for step in steps:
            task = WorkflowTaskTemplate(
                workflow_id=workflow.id,
                title=step["title"],
                description=step["description"],
                due_in_days=step["due_in_days"],
                service_category=step["service_category"]
            )
            db.add(task)
            
        db.commit()
        print("Seeding completed successfully!")
    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_playbook_workflow()

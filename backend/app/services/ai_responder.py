from app.models.lead import Lead
from app.models.landing_page import LandingPage
from app.models.user import User
from app.models.inbox_message import InboxMessage
from app.database import SessionLocal
import traceback

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

def generate_and_send_ai_response(lead_id: str, page_id: str):
    """
    Background task to generate an AI response and send it via Inbox.
    """
    db = SessionLocal()
    try:
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        page = db.query(LandingPage).filter(LandingPage.id == page_id).first()
        
        if not lead or not page:
            return
            
        admin = db.query(User).filter(User.role == "ADMIN").first()
        if not admin or not admin.openai_key or not admin.ai_auto_respond_enabled:
            return
            
        if not OpenAI:
            print("OpenAI package not installed.")
            return
            
        client = OpenAI(api_key=admin.openai_key)
        
        system_prompt = page.ai_system_prompt
        if not system_prompt:
            system_prompt = f"You are a helpful assistant for a {page.industry or 'business'}. Respond to new leads politely and answer their questions briefly. Keep it under 2 sentences."
            
        lead_message = f"My name is {lead.name}."
        if lead.message:
            lead_message += f" I wanted to say: {lead.message}"
            
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": lead_message}
            ],
            max_tokens=150
        )
        
        reply_text = response.choices[0].message.content
        
        if reply_text:
            # Create the outbound message in the inbox
            # If lead has a phone number, default to SMS, else EMAIL
            channel = "SMS" if lead.phone else "EMAIL"
            
            inbox_msg = InboxMessage(
                lead_id=lead.id,
                direction="OUTBOUND",
                channel=channel,
                content=reply_text,
                status="SENT" # In a real scenario, this would be queued to Twilio/SendGrid
            )
            db.add(inbox_msg)
            db.commit()
            print(f"AI Auto-response generated for Lead {lead.id}")
            
    except Exception as e:
        print(f"Error in generate_and_send_ai_response: {e}")
        traceback.print_exc()
    finally:
        db.close()

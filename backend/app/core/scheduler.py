from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models.appointment import Appointment
from app.models.lead import Lead
from app.models.user import User, UserRole
from app.core.email import send_smtp_email
from app.core.email_templates import get_appointment_reminder_template, get_followup_template

scheduler = BackgroundScheduler()

def send_email_notification(host_user: User, to_email: str, subject: str, html_message: str):
    send_smtp_email(host_user, to_email, subject, html_message)

def send_whatsapp_notification(phone: str, message: str):
    # This should integrate with actual WhatsApp API logic
    print(f"WHATSAPP -> {phone} | Msg: {message}")

def process_smart_notifications():
    print("Running process_smart_notifications...")
    db = SessionLocal()
    now = datetime.utcnow()
    
    # 1 Hour Reminders
    one_hour_later = now + timedelta(hours=1)
    appointments_1h = db.query(Appointment).filter(
        Appointment.start_time <= one_hour_later,
        Appointment.start_time > now,
        Appointment.reminder_1h_sent == False,
        Appointment.status == "SCHEDULED"
    ).all()
    
    for appt in appointments_1h:
        # Fetch client/lead
        client = db.query(User).filter(User.id == appt.client_id).first()
        lead = db.query(Lead).filter(Lead.id == appt.lead_id).first()
        host = db.query(User).filter(User.id == appt.host_id).first()
        
        email_to = None
        phone_to = None
        name = "Guest"
        
        if client:
            email_to = client.email
            phone_to = client.phone_number
            name = client.first_name or "Client"
        elif lead:
            email_to = lead.email
            phone_to = lead.phone
            name = lead.name
            
        # Get the HTML Template
        html_msg = get_appointment_reminder_template(
            name=name, 
            title=appt.title, 
            start_time=appt.start_time.strftime("%A, %B %d, %Y at %I:%M %p"),
            meeting_link=appt.meeting_link
        )
        
        # We need the admin or host user's SMTP credentials
        agency_admin = host if host and host.smtp_host else db.query(User).filter(User.role == UserRole.ADMIN).first()
        
        if email_to and agency_admin:
            send_email_notification(agency_admin, email_to, "Upcoming Appointment", html_msg)
            
        # Simplified WhatsApp msg
        plain_msg = f"Hi {name}, your appointment '{appt.title}' is starting in less than 1 hour!"
        if phone_to:
            send_whatsapp_notification(phone_to, plain_msg)
            
        # Notify host too
        if host and host.email and agency_admin:
            host_html_msg = get_appointment_reminder_template(host.first_name or "Host", appt.title, appt.start_time.strftime("%A, %B %d, %Y at %I:%M %p"), appt.meeting_link)
            send_email_notification(agency_admin, host.email, "Upcoming Appointment", host_html_msg)
            
        appt.reminder_1h_sent = True
        db.commit()

    db.close()

def process_continuous_followups():
    print("Running process_continuous_followups...")
    db = SessionLocal()
    now = datetime.utcnow()
    
    # Drip Emails / Follow-ups for leads
    leads_to_followup = db.query(Lead).filter(
        Lead.next_followup_date <= now,
        Lead.followup_status == "PENDING"
    ).all()
    
    for lead in leads_to_followup:
        agency_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        agency_name = agency_admin.agency_name or "LandingForge" if agency_admin else "LandingForge"
        
        # Automated drip email using HTML Template
        html_msg = get_followup_template(lead.name, agency_name)
        if agency_admin:
            send_email_notification(agency_admin, lead.email, f"Checking in from {agency_name}", html_msg)
        
        # Internal reminder for team
        host_email = agency_admin.email if agency_admin else "admin@landingforge.com"
        internal_msg = f"<h3>Manual Call Required</h3><p>Lead {lead.name} requires a manual follow-up call.</p><p>Phone: {lead.phone}</p><p>Email: {lead.email}</p>"
        if agency_admin:
            send_email_notification(agency_admin, host_email, "Action Required: Manual Call", internal_msg)
        
        # Mark as completed
        lead.followup_status = "COMPLETED"
        db.commit()
        
    db.close()

def start_scheduler():
    if not scheduler.running:
        # Run every 5 minutes
        scheduler.add_job(
            process_smart_notifications,
            trigger=IntervalTrigger(minutes=5),
            id='smart_notifications',
            name='Smart Notifications 1H / 24H',
            replace_existing=True,
        )
        # Run every hour
        scheduler.add_job(
            process_continuous_followups,
            trigger=IntervalTrigger(hours=1),
            id='continuous_followups',
            name='Continuous Followups',
            replace_existing=True,
        )
        scheduler.start()

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()

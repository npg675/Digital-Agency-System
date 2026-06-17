import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Optional, List, Dict
from app.models.user import User

def send_smtp_email(host_user: User, to_email: str, subject: str, html_content: str, attachments: Optional[List[Dict[str, bytes]]] = None):
    """
    Sends an email using the SMTP credentials stored in the host_user (Admin/Agency Owner).
    If credentials are not fully configured, it will simulate a success (print to console).
    attachments should be a list of dicts: [{"filename": "quote.pdf", "content": b"..."}]
    """
    # Fallback/simulation if SMTP is not configured
    if not all([host_user.smtp_host, host_user.smtp_port, host_user.smtp_user, host_user.smtp_password, host_user.smtp_from_email]):
        print(f"--- SIMULATED EMAIL ---")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Content length: {len(html_content)} chars")
        if attachments:
            print(f"Attachments: {[a['filename'] for a in attachments]}")
        print(f"--- END SIMULATED EMAIL ---")
        return True

    try:
        msg = MIMEMultipart('mixed')
        msg['Subject'] = subject
        msg['From'] = host_user.smtp_from_email
        msg['To'] = to_email

        # Attach HTML content
        part = MIMEText(html_content, 'html')
        msg.attach(part)

        # Attach files
        if attachments:
            for att in attachments:
                file_part = MIMEApplication(att["content"], Name=att["filename"])
                file_part['Content-Disposition'] = f'attachment; filename="{att["filename"]}"'
                msg.attach(file_part)

        # Connect to server and send
        server = smtplib.SMTP(host_user.smtp_host, host_user.smtp_port)
        server.starttls()
        server.login(host_user.smtp_user, host_user.smtp_password)
        server.sendmail(host_user.smtp_from_email, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {str(e)}")
        return False

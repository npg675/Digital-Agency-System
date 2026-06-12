def get_appointment_reminder_template(name: str, title: str, start_time: str, meeting_link: str = None) -> str:
    link_html = f'<div style="text-align: center; margin-top: 30px;"><a href="{meeting_link}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join Meeting</a></div>' if meeting_link else ''
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Reminder</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 20px; color: #1f2937;">
        <div style="max-w-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #4f46e5; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Upcoming Appointment!</h1>
            </div>
            <div style="padding: 40px 30px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>{name}</strong>,</p>
                <p style="font-size: 16px; margin-bottom: 30px; line-height: 1.5;">
                    This is a friendly reminder that your appointment <strong>"{title}"</strong> is coming up soon.
                </p>
                
                <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 15px 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">WHEN</p>
                    <p style="margin: 0; font-size: 16px; font-weight: 600;">{start_time}</p>
                </div>
                
                {link_html}
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 40px; text-align: center;">
                    If you need to reschedule or cancel, please contact us.
                </p>
            </div>
            <div style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px; text-align: center;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">Powered by LandingForge</p>
            </div>
        </div>
    </body>
    </html>
    """

def get_followup_template(name: str, agency_name: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Checking In</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 20px; color: #1f2937;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="padding: 40px 30px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>{name}</strong>,</p>
                <p style="font-size: 16px; margin-bottom: 20px; line-height: 1.6;">
                    I hope you're having a great week! I'm reaching out from {agency_name} to check in and see how things are going.
                </p>
                <p style="font-size: 16px; margin-bottom: 30px; line-height: 1.6;">
                    Do you have any questions or need any assistance with your project? I'd love to hop on a quick call if you have a few minutes to chat.
                </p>
                <p style="font-size: 16px; margin-bottom: 10px;">Best regards,</p>
                <p style="font-size: 16px; font-weight: 600; margin: 0;">The {agency_name} Team</p>
            </div>
        </div>
    </body>
    </html>
    """

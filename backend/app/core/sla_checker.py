import asyncio
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models.client_task import ClientTask
from app.models.client_service import ClientService
from app.models.notification import Notification
from app.models.user import User, UserRole

async def check_slas_and_notify():
    """
    Background job that runs periodically to check for upcoming and overdue SLAs.
    Generates notifications for staff and admins.
    """
    while True:
        try:
            db = SessionLocal()
            now = datetime.utcnow()
            twenty_four_hours_from_now = now + timedelta(hours=24)

            # Get Admins to notify for overdue alerts
            admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
            admin_ids = [admin.id for admin in admins]

            # ---------------------------------------------------------
            # 1. Check Tasks
            # ---------------------------------------------------------
            active_tasks = db.query(ClientTask).filter(
                ClientTask.status.notin_(["DONE", "COMPLETED"]),
                ClientTask.due_date != None
            ).all()

            for task in active_tasks:
                due_date = task.due_date
                
                # Check Overdue
                if now > due_date and not task.overdue_alert_sent:
                    # Notify Assigned Staff
                    if task.assigned_to_id:
                        db.add(Notification(
                            user_id=task.assigned_to_id,
                            type="SLA_OVERDUE",
                            message=f"Overdue Alert: The task '{task.title}' missed its target completion date.",
                            reference_id=str(task.client_id)
                        ))
                    
                    # Notify Admins
                    for admin_id in admin_ids:
                        db.add(Notification(
                            user_id=admin_id,
                            type="SLA_OVERDUE",
                            message=f"Overdue Alert: Task '{task.title}' missed its SLA.",
                            reference_id=str(task.client_id)
                        ))
                    
                    task.overdue_alert_sent = True
                    db.add(task)

                # Check 24h Reminder
                elif due_date <= twenty_four_hours_from_now and now < due_date and not task.reminder_sent:
                    if task.assigned_to_id:
                        db.add(Notification(
                            user_id=task.assigned_to_id,
                            type="SLA_REMINDER",
                            message=f"Reminder: Task '{task.title}' is due in less than 24 hours.",
                            reference_id=str(task.client_id)
                        ))
                    task.reminder_sent = True
                    db.add(task)

            # ---------------------------------------------------------
            # 2. Check Services (Squad Roles)
            # ---------------------------------------------------------
            active_services = db.query(ClientService).filter(
                ClientService.status.notin_(["COMPLETED", "PAUSED"]),
                ClientService.due_date != None
            ).all()

            for service in active_services:
                due_date = service.due_date
                
                # Check Overdue
                if now > due_date and not service.overdue_alert_sent:
                    if service.staff_id:
                        db.add(Notification(
                            user_id=service.staff_id,
                            type="SLA_OVERDUE",
                            message=f"Overdue Alert: Your '{service.service_role}' squad role missed its target completion date.",
                            reference_id=str(service.client_id)
                        ))
                    
                    for admin_id in admin_ids:
                        db.add(Notification(
                            user_id=admin_id,
                            type="SLA_OVERDUE",
                            message=f"Overdue Alert: Squad Role '{service.service_role}' missed its SLA.",
                            reference_id=str(service.client_id)
                        ))
                    
                    service.overdue_alert_sent = True
                    db.add(service)

                # Check 24h Reminder
                elif due_date <= twenty_four_hours_from_now and now < due_date and not service.reminder_sent:
                    if service.staff_id:
                        db.add(Notification(
                            user_id=service.staff_id,
                            type="SLA_REMINDER",
                            message=f"Reminder: Target completion for '{service.service_role}' is due in less than 24 hours.",
                            reference_id=str(service.client_id)
                        ))
                    service.reminder_sent = True
                    db.add(service)

            db.commit()
            db.close()

        except Exception as e:
            print(f"Error in SLA Checker: {e}")

        # Sleep for 1 hour
        await asyncio.sleep(3600)

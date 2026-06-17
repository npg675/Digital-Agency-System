"""
Automation Execution Engine
Traverses a saved node/edge graph and executes each action in order.

Supported action subtypes:
  - send_email       → sends real email via SMTP
  - add_to_crm       → creates a Lead record
  - send_webhook     → fires an HTTP POST to an external URL
  - add_tag          → tags a lead with a label
  - slack_notify     → posts a message to a Slack webhook
  - delay            → async waits N seconds/minutes/hours
"""

import asyncio
import smtplib
import os
import uuid
import httpx
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.automation import AutomationNode, AutomationEdge, AutomationRun
from app.models.lead import Lead

logger = logging.getLogger(__name__)


# ─── Entry Point ────────────────────────────────────────────────────────────

async def run_automation_workflow(automation_id: str, payload: dict):
    """
    Main entry point called from the webhook endpoint (as a background task).
    Loads the automation graph and walks it from the trigger node.
    """
    db: Session = SessionLocal()
    try:
        nodes = db.query(AutomationNode).filter(
            AutomationNode.automation_id == uuid.UUID(automation_id)
        ).all()
        edges = db.query(AutomationEdge).filter(
            AutomationEdge.automation_id == uuid.UUID(automation_id)
        ).all()

        if not nodes:
            logger.warning(f"Automation {automation_id} has no nodes.")
            return

        run = AutomationRun(
            automation_id=uuid.UUID(automation_id),
            status="RUNNING",
            payload=payload,
            logs=[]
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        nodes_dict = {n.id: n for n in nodes}
        run_logs = []

        # Build adjacency list: source_node_id → [(target_node_id, source_handle), ...]
        graph: dict[str, list[tuple[str, str|None]]] = {}
        for edge in edges:
            graph.setdefault(edge.source, []).append((edge.target, edge.source_handle))

        triggers = [n for n in nodes if n.type == "trigger"]
        if not triggers:
            logger.warning(f"Automation {automation_id} has no trigger node.")
            run.status = "FAILED"
            run.error_message = "No trigger node found"
            db.commit()
            return

        context = {
            "payload": payload,
            "lead_id": payload.get("lead_id"),
            "email": payload.get("email", ""),
            "name": payload.get("name", ""),
            "phone": payload.get("phone", ""),
        }

        current_id = triggers[0].id
        visited: set[str] = set()
        
        try:
            while current_id and current_id not in visited:
                visited.add(current_id)
                node = nodes_dict.get(current_id)
                if not node:
                    break
                    
                step_log = {"node_id": node.id, "type": node.type, "subtype": node.subtype, "status": "SUCCESS", "message": ""}

                next_handle = None
                
                if node.type == "action":
                    try:
                        await execute_action(node, context, db)
                        step_log["message"] = "Action executed successfully"
                    except Exception as e:
                        logger.error(f"Action '{node.subtype}' failed on node {node.id}: {e}")
                        step_log["status"] = "FAILED"
                        step_log["message"] = str(e)
                        run_logs.append(step_log)
                        raise e # Stop execution on action failure
                        
                elif node.type == "condition":
                    try:
                        var_raw = node.data.get("variable", "")
                        val_raw = node.data.get("value", "")
                        op = node.data.get("operator", "equals")
                        
                        var_resolved = resolve(var_raw, context)
                        val_resolved = resolve(val_raw, context)
                        
                        result = False
                        if op == "equals":
                            result = (var_resolved == val_resolved)
                        elif op == "not_equals":
                            result = (var_resolved != val_resolved)
                        elif op == "contains":
                            result = (val_resolved in var_resolved)
                        elif op == "greater_than":
                            try: result = float(var_resolved) > float(val_resolved)
                            except: result = False
                        elif op == "less_than":
                            try: result = float(var_resolved) < float(val_resolved)
                            except: result = False
                            
                        next_handle = "true" if result else "false"
                        step_log["message"] = f"Evaluated {var_resolved} {op} {val_resolved} => {result}"
                    except Exception as e:
                        step_log["status"] = "FAILED"
                        step_log["message"] = str(e)
                        run_logs.append(step_log)
                        raise e
                
                run_logs.append(step_log)

                # Determine next node based on handle if condition, else just pick the first connected
                next_edges = graph.get(current_id, [])
                if next_handle:
                    # Filter by handle
                    next_edges = [e for e in next_edges if e[1] == next_handle]
                
                current_id = next_edges[0][0] if next_edges else None

            run.status = "SUCCESS"
            run.logs = run_logs
            db.commit()
            logger.info(f"Automation {automation_id} completed successfully.")
            
        except Exception as flow_err:
            run.status = "FAILED"
            run.error_message = str(flow_err)
            run.logs = run_logs
            db.commit()
            logger.error(f"Automation {automation_id} failed: {flow_err}")

    except Exception as e:
        logger.error(f"Automation engine error for {automation_id}: {e}", exc_info=True)
    finally:
        db.close()


# ─── Action Router ───────────────────────────────────────────────────────────

async def execute_action(node: AutomationNode, context: dict, db: Session):
    config = node.data or {}
    subtype = node.subtype

    logger.info(f"▶ Executing [{subtype}] node {node.id}")

    if subtype == "send_email":
        await action_send_email(config, context)

    elif subtype == "add_to_crm":
        await action_add_to_crm(config, context, db)

    elif subtype == "send_webhook":
        await action_send_webhook(config, context)

    elif subtype == "add_tag":
        await action_add_tag(config, context, db)

    elif subtype == "slack_notify":
        await action_slack_notify(config, context)

    elif subtype == "delay":
        await action_delay(config)

    elif subtype == "ai_reply":
        await action_ai_reply(config, context, db)

    else:
        logger.warning(f"Unknown action subtype: {subtype}")


# ─── Individual Actions ──────────────────────────────────────────────────────

async def action_send_email(config: dict, context: dict):
    """Sends a real email via SMTP using env credentials."""
    to_email = resolve(config.get("to", ""), context)
    subject  = resolve(config.get("subject", "(No Subject)"), context)
    body     = resolve(config.get("body", ""), context)

    if not to_email:
        logger.warning("send_email: No recipient specified, skipping.")
        return

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)

    if not smtp_user or not smtp_pass:
        logger.warning("send_email: SMTP_USER or SMTP_PASS not configured in .env, skipping.")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = smtp_from
        msg["To"]      = to_email
        msg.attach(MIMEText(body, "plain"))
        msg.attach(MIMEText(f"<pre>{body}</pre>", "html"))

        # Run blocking SMTP call in a thread so we don't block the event loop
        def _send():
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.ehlo()
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, [to_email], msg.as_string())

        await asyncio.get_event_loop().run_in_executor(None, _send)
        logger.info(f"✅ Email sent to {to_email} | Subject: {subject}")

    except Exception as e:
        logger.error(f"send_email failed: {e}")
        raise


async def action_add_to_crm(config: dict, context: dict, db: Session):
    """Creates a Lead record in the database."""
    email  = resolve(config.get("email",  context.get("email", "")),  context)
    name   = resolve(config.get("name",   context.get("name",  "")),  context)
    phone  = resolve(config.get("phone",  context.get("phone", "")),  context)
    source = resolve(config.get("source", "Automation Workflow"),      context)

    if not email and not name:
        logger.warning("add_to_crm: No email or name provided, skipping.")
        return

    # Avoid duplicates by email
    existing = db.query(Lead).filter(Lead.email == email).first() if email else None
    if existing:
        logger.info(f"add_to_crm: Lead {email} already exists, skipping creation.")
        context["lead_id"] = str(existing.id)
        return

    lead = Lead(name=name, email=email, phone=phone, source=source)
    db.add(lead)
    db.commit()
    db.refresh(lead)

    context["lead_id"] = str(lead.id)
    logger.info(f"✅ Lead created: {name} ({email}) — ID {lead.id}")


async def action_send_webhook(config: dict, context: dict):
    """POSTs the current context payload to an external URL."""
    url = resolve(config.get("url", ""), context)
    if not url:
        logger.warning("send_webhook: No URL configured, skipping.")
        return

    headers = config.get("headers", {})
    body    = {**context.get("payload", {}), **config.get("extra_fields", {})}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json=body, headers=headers)
            logger.info(f"✅ Webhook sent to {url} — status {resp.status_code}")
    except Exception as e:
        logger.error(f"send_webhook failed: {e}")
        raise


async def action_add_tag(config: dict, context: dict, db: Session):
    """Adds a text tag to an existing Lead record."""
    lead_id = context.get("lead_id")
    tag     = resolve(config.get("tag", ""), context)

    if not lead_id or not tag:
        logger.warning("add_tag: Missing lead_id or tag, skipping.")
        return

    lead = db.query(Lead).filter(Lead.id == uuid.UUID(lead_id)).first()
    if not lead:
        logger.warning(f"add_tag: Lead {lead_id} not found.")
        return

    existing_tags = lead.tags or []
    if tag not in existing_tags:
        lead.tags = existing_tags + [tag]
        db.commit()
        logger.info(f"✅ Tag '{tag}' added to lead {lead_id}")


async def action_slack_notify(config: dict, context: dict):
    """Sends a message to a Slack Incoming Webhook URL."""
    webhook_url = resolve(config.get("webhook_url", ""), context)
    message     = resolve(config.get("message", "New automation event fired."), context)

    if not webhook_url:
        logger.warning("slack_notify: No webhook_url configured, skipping.")
        return

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(webhook_url, json={"text": message})
            logger.info(f"✅ Slack notification sent — status {resp.status_code}")
    except Exception as e:
        logger.error(f"slack_notify failed: {e}")
        raise


async def action_delay(config: dict):
    """Pauses execution for a configured duration."""
    duration = float(config.get("duration", 1))
    unit     = config.get("unit", "seconds")

    seconds = duration
    if unit == "minutes": seconds = duration * 60
    elif unit == "hours": seconds = duration * 3600
    elif unit == "days":  seconds = duration * 86400

    # Safety cap: 5 minutes max in async context (long delays need Celery/queue)
    capped = min(seconds, 300)
    logger.info(f"⏱️ Delay: waiting {capped}s (requested {seconds}s)")
    await asyncio.sleep(capped)


async def action_ai_reply(config: dict, context: dict, db: Session):
    """Generates an AI response based on system prompt and saves it in context."""
    system_prompt = config.get("system_prompt", "You are a helpful assistant.")
    prompt = resolve(config.get("prompt", "Write a response to: {{payload.message}}"), context)
    
    from app.models.user import User, UserRole
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    
    if not admin:
        logger.warning("ai_reply: No admin user found.")
        return

    provider = getattr(admin, "ai_provider", "openai")
    model_name = getattr(admin, "ai_model", None)

    try:
        if provider == "gemini":
            if not model_name or not model_name.startswith("gemini"):
                model_name = "gemini-2.5-flash"
            elif model_name in ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-3.0-pro", "gemini-3.1-pro"]:
                model_name = "gemini-2.5-pro"
                
            from google import genai
            api_key = getattr(admin, "gemini_api_key", None)
            if not api_key:
                logger.warning("ai_reply: No Gemini API key available, skipping.")
                return
            
            client = genai.Client(api_key=api_key)
            
            # Combine system prompt and user prompt
            full_prompt = f"System: {system_prompt}\nUser: {prompt}"
            
            # Since genai handles async loosely or we can run synchronously here
            # using model.generate_content (which is synchronous but will run fine for our quick test)
            response = client.models.generate_content(
                model=model_name,
                contents=full_prompt
            )
            reply = response.text.strip()
            
        else:
            if not model_name or not model_name.startswith("gpt"):
                model_name = "gpt-4o-mini"
                
            api_key = admin.openai_key or os.getenv("OPENAI_API_KEY")
            if not api_key:
                logger.warning("ai_reply: No OpenAI API key available, skipping.")
                return

            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=api_key)
            
            response = await client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200
            )
            reply = response.choices[0].message.content.strip()

        logger.info(f"🤖 AI Generated Reply: {reply[:50]}...")
        context["ai_reply"] = reply
        logger.info(f"✅ AI generated reply: {reply[:50]}...")
    except Exception as e:
        logger.error(f"ai_reply failed: {e}")
        raise


# ─── Variable Resolver ───────────────────────────────────────────────────────

def resolve(text: str, context: dict) -> str:
    """
    Replaces template variables in a string with context values.

    Supported variables:
      {{payload.email}}   {{payload.name}}   {{payload.phone}}
      {{lead_id}}         {{email}}           {{name}}
      {{ai_reply}}
    """
    if not isinstance(text, str):
        return str(text) if text is not None else ""

    payload = context.get("payload", {})

    replacements = {
        "{{payload.email}}": str(payload.get("email", "")),
        "{{payload.name}}":  str(payload.get("name",  "")),
        "{{payload.phone}}": str(payload.get("phone", "")),
        "{{payload.message}}": str(payload.get("message", "")),
        "{{email}}":         str(context.get("email", "")),
        "{{name}}":          str(context.get("name",  "")),
        "{{phone}}":         str(context.get("phone", "")),
        "{{lead_id}}":       str(context.get("lead_id", "")),
        "{{ai_reply}}":      str(context.get("ai_reply", "")),
    }

    for placeholder, value in replacements.items():
        text = text.replace(placeholder, value)

    return text

# ─── Internal Event Dispatcher ───────────────────────────────────────────────

def trigger_internal_event(client_id: uuid.UUID, event_type: str, payload: dict):
    """
    Scans for ACTIVE automations belonging to a client that listen for a specific event_type.
    If found, invokes run_automation_workflow in the background.
    """
    db: Session = SessionLocal()
    try:
        from app.models.automation import Automation, AutomationStatus
        # Find all active automations for this client
        active_automations = db.query(Automation).filter(
            Automation.client_id == client_id,
            Automation.status == AutomationStatus.ACTIVE
        ).all()

        for auto in active_automations:
            # Check if this automation's trigger node matches the event_type
            trigger_nodes = [n for n in auto.nodes if n.type == "trigger"]
            if not trigger_nodes:
                continue
            
            trigger = trigger_nodes[0]
            # By default, older automations might not have a trigger_type set in data.
            # We assume "webhook" if not set.
            configured_event = trigger.data.get("trigger_type", "webhook")
            
            if configured_event == event_type:
                logger.info(f"⚡ Firing internal event '{event_type}' for Automation {auto.id}")
                # Dispatch async background task
                loop = asyncio.get_event_loop()
                loop.create_task(run_automation_workflow(str(auto.id), payload))
                
    except Exception as e:
        logger.error(f"Failed to trigger internal event '{event_type}': {e}", exc_info=True)
    finally:
        db.close()

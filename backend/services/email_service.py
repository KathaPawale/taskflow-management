import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import current_app


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send an email via Gmail SMTP."""
    try:
        gmail_user = current_app.config["GMAIL_USER"]
        gmail_password = current_app.config["GMAIL_APP_PASSWORD"]

        if not gmail_user or not gmail_password:
            current_app.logger.warning("Gmail credentials not configured, skipping email.")
            return False

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"TaskFlow <{gmail_user}>"
        msg["To"] = to_email

        part = MIMEText(html_body, "html")
        msg.attach(part)

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(gmail_user, gmail_password)
            server.sendmail(gmail_user, to_email, msg.as_string())

        current_app.logger.info(f"Email sent to {to_email}: {subject}")
        return True

    except Exception as e:
        current_app.logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def send_task_created_email(assignee_email: str, assignee_name: str, task: dict, creator_name: str) -> bool:
    subject = f"📋 New Task Assigned: {task['title']}"
    priority_colors = {"low": "#22c55e", "medium": "#f59e0b", "high": "#ef4444"}
    priority_color = priority_colors.get(task.get("priority", "medium"), "#f59e0b")

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">TaskFlow</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Task Management Platform</p>
        </div>
        <div style="padding:32px;">
          <p style="color:#a1a1aa;font-size:14px;margin:0 0 8px;">Hello, {assignee_name}!</p>
          <h2 style="color:#fff;font-size:22px;margin:0 0 24px;font-weight:700;">You have a new task assigned</h2>
          <div style="background:#252525;border-radius:8px;padding:24px;border-left:4px solid #6366f1;margin-bottom:24px;">
            <h3 style="color:#fff;margin:0 0 12px;font-size:18px;">{task['title']}</h3>
            <p style="color:#a1a1aa;margin:0 0 16px;font-size:14px;line-height:1.6;">{task.get('description', 'No description provided.')}</p>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
              <span style="background:{priority_color}22;color:{priority_color};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase;">
                {task.get('priority', 'Medium')} Priority
              </span>
              {'<span style="background:#6366f122;color:#818cf8;padding:4px 12px;border-radius:20px;font-size:12px;">Due: ' + task['due_date'] + '</span>' if task.get('due_date') else ''}
            </div>
          </div>
          <p style="color:#71717a;font-size:13px;margin:0 0 24px;">Assigned by <strong style="color:#a1a1aa;">{creator_name}</strong></p>
          <a href="{current_app.config['FRONTEND_URL']}/dashboard" 
             style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
            View Task →
          </a>
        </div>
        <div style="padding:20px 32px;border-top:1px solid #2a2a2a;">
          <p style="color:#52525b;font-size:12px;margin:0;text-align:center;">TaskFlow · Task Management Made Simple</p>
        </div>
      </div>
    </body>
    </html>
    """
    return send_email(assignee_email, subject, html)


def send_task_completed_email(assignee_email: str, assignee_name: str, task: dict, completer_name: str) -> bool:
    subject = f"✅ Task Completed: {task['title']}"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;">
        <div style="background:linear-gradient(135deg,#059669,#10b981);padding:32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">TaskFlow</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Task Management Platform</p>
        </div>
        <div style="padding:32px;">
          <p style="color:#a1a1aa;font-size:14px;margin:0 0 8px;">Hello, {assignee_name}!</p>
          <h2 style="color:#fff;font-size:22px;margin:0 0 24px;font-weight:700;">🎉 A task has been completed!</h2>
          <div style="background:#252525;border-radius:8px;padding:24px;border-left:4px solid #10b981;margin-bottom:24px;">
            <h3 style="color:#fff;margin:0 0 12px;font-size:18px;">{task['title']}</h3>
            <p style="color:#a1a1aa;margin:0;font-size:14px;line-height:1.6;">{task.get('description', 'No description provided.')}</p>
          </div>
          <p style="color:#71717a;font-size:13px;margin:0 0 24px;">Completed by <strong style="color:#a1a1aa;">{completer_name}</strong></p>
          <a href="{current_app.config['FRONTEND_URL']}/dashboard" 
             style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
            View All Tasks →
          </a>
        </div>
        <div style="padding:20px 32px;border-top:1px solid #2a2a2a;">
          <p style="color:#52525b;font-size:12px;margin:0;text-align:center;">TaskFlow · Task Management Made Simple</p>
        </div>
      </div>
    </body>
    </html>
    """
    return send_email(assignee_email, subject, html)

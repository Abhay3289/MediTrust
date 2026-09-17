import logging
import smtplib
from datetime import datetime
from email.message import EmailMessage
from html import escape
from zoneinfo import ZoneInfo

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, text: str, html: str):
    """Send an email via SMTP. Never raises, so auth flows are unaffected."""
    if not (settings.smtp_host and settings.smtp_username):
        logger.warning("SMTP not configured; skipped email to %s", to)
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.email_from or settings.smtp_username
    msg["To"] = to
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
            smtp.starttls()
            smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(msg)
        logger.info("Email '%s' sent to %s", subject, to)
    except Exception:
        logger.exception("Failed to send email '%s' to %s", subject, to)


def _layout(heading: str, body_html: str) -> str:
    return f"""\
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937">
  <h2 style="color:#0f766e">{heading}</h2>
  {body_html}
  <p style="margin-top:24px">
    <a href="{escape(settings.frontend_url)}"
       style="background:#0f766e;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">
      Open MediTrust
    </a>
  </p>
  <p style="color:#6b7280;font-size:12px;margin-top:32px">&mdash; Team MediTrust</p>
</div>"""


def send_welcome_email(to: str, name: str):
    safe_name = escape(name)
    text = (
        f"Hi {name},\n\n"
        "Welcome to MediTrust! Your account has been created successfully.\n"
        "You can now find trusted hospitals and doctors, book appointments "
        "and consult online.\n\n"
        f"Open MediTrust: {settings.frontend_url}\n\n"
        "- Team MediTrust"
    )
    html = _layout(
        f"Welcome to MediTrust, {safe_name}!",
        "<p>Your account has been created successfully.</p>"
        "<p>You can now find trusted hospitals and doctors, book appointments "
        "and consult online.</p>",
    )
    send_email(to, "Welcome to MediTrust", text, html)


def send_login_email(to: str, name: str, method: str):
    when = datetime.now(ZoneInfo("Asia/Kolkata")).strftime("%d %b %Y, %I:%M %p IST")
    safe_name = escape(name)
    text = (
        f"Hi {name},\n\n"
        f"Welcome back! You just logged in to MediTrust ({method}) on {when}.\n\n"
        "If this wasn't you, please reset your password right away.\n\n"
        "- Team MediTrust"
    )
    html = _layout(
        f"Welcome back, {safe_name}!",
        f"<p>You just logged in to MediTrust using <b>{escape(method)}</b>.</p>"
        f"<p><b>Time:</b> {when}</p>"
        "<p>If this wasn't you, please reset your password right away.</p>",
    )
    send_email(to, "New login to your MediTrust account", text, html)

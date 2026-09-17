import secrets
import logging
from datetime import datetime, timedelta, timezone

from twilio.rest import Client

from app.core.config import settings

logger = logging.getLogger(__name__)


class TwilioOTPService:

    def __init__(self):
        self.otps = {}

        self.client = Client(
            settings.twilio_account_sid,
            settings.twilio_auth_token
        )

    def generate(self, destination: str):
        otp = f"{secrets.randbelow(1_000_000):06d}"

        self.otps[destination] = {
            "otp": otp,
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5),
            "verified": False,
        }

        try:
            self.client.messages.create(
                body=f"Your MediTrust password reset OTP is: {otp}. It expires in 5 minutes.",
                from_=settings.twilio_phone_number,
                to=destination,
            )

            logger.info("OTP SMS sent successfully")

        except Exception:
            logger.exception("Failed to send OTP SMS")
            self.otps.pop(destination, None)
            raise

        return otp

    def verify(self, destination: str, otp: str):
        record = self.otps.get(destination)

        if not record:
            return False

        if datetime.now(timezone.utc) > record["expires_at"]:
            del self.otps[destination]
            return False

        if record["otp"] != otp:
            return False

        record["verified"] = True
        return True

    def is_verified(self, destination: str):
        record = self.otps.get(destination)

        if not record:
            return False

        if datetime.now(timezone.utc) > record["expires_at"]:
            del self.otps[destination]
            return False

        return record["verified"]

    def clear(self, destination: str):
        self.otps.pop(destination, None)


otp_service = TwilioOTPService()

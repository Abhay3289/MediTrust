import os

from fastapi import HTTPException, status
from google.auth.transport import requests
from google.oauth2 import id_token
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.services.otp_service import otp_service


# =========================================================
# IDENTIFIER
# =========================================================

def split_identifier(identifier: str):
    identifier = identifier.strip()

    if "@" in identifier:
        return identifier.lower(), None

    return None, identifier


# =========================================================
# REGISTER
# =========================================================

def register(db: Session, data):
    email, phone = split_identifier(data.identifier)

    if not email and not phone:
        raise HTTPException(
            status_code=422,
            detail="Enter a valid email or mobile number",
        )

    if email and db.scalar(
        select(User).where(User.email == email)
    ):
        raise HTTPException(
            status_code=409,
            detail="Email is already registered",
        )

    if phone and db.scalar(
        select(User).where(User.phone == phone)
    ):
        raise HTTPException(
            status_code=409,
            detail="Mobile number is already registered",
        )

    user = User(
        full_name=data.full_name.strip(),
        email=email,
        phone=phone,
        hashed_password=hash_password(data.password),
        role=data.role,
        city=data.city,
        consent=data.consent,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


# =========================================================
# LOGIN
# =========================================================

def login(db: Session, data):
    email, phone = split_identifier(data.identifier)

    stmt = select(User).where(
        or_(
            User.email == email,
            User.phone == phone,
        )
    )

    user = db.scalar(stmt)

    if not user or not verify_password(
        data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/mobile or password",
        )

    return user


# =========================================================
# TOKENS
# =========================================================

def tokens(user: User):
    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }


# =========================================================
# GOOGLE AUTHENTICATION
# =========================================================

def verify_google_credential(credential: str):
    google_client_ids = settings.google_client_ids

    if not google_client_ids:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GOOGLE_CLIENT_ID is not configured",
        )

    try:
        google_user = id_token.verify_oauth2_token(
            credential,
            requests.Request(),
            google_client_ids,
        )

        return google_user

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credential",
        )


def google_login(db: Session, credential: str) -> tuple[User, bool]:
    """Return the user and whether the account was just created."""
    google_user = verify_google_credential(credential)

    google_email = google_user.get("email")
    google_name = google_user.get("name") or "Google User"

    if not google_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account email not available",
        )

    google_email = google_email.lower().strip()

    user = db.scalar(
        select(User).where(User.email == google_email)
    )

    created = user is None

    if created:
        user = User(
            full_name=google_name.strip(),
            email=google_email,
            hashed_password=hash_password(
                os.urandom(32).hex()
            ),
            role="patient",
            consent=True,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

    return user, created


# =========================================================
# FORGOT PASSWORD
# =========================================================

def request_password_reset(
    db: Session,
    identifier: str,
):
    identifier = identifier.strip()

    email, phone = split_identifier(identifier)

    stmt = select(User).where(
        or_(
            User.email == email,
            User.phone == phone,
        )
    )

    user = db.scalar(stmt)

    if not user:
        return {
            "message": (
                "If the account exists, a verification OTP "
                "has been generated."
            )
        }

    destination = user.email or user.phone

    otp_service.generate(destination)

    return {
        "message": (
            "If the account exists, a verification OTP "
            "has been generated."
        )
    }


# =========================================================
# VERIFY OTP
# =========================================================

def verify_password_reset_otp(
    db: Session,
    identifier: str,
    otp: str,
):
    identifier = identifier.strip()

    email, phone = split_identifier(identifier)

    stmt = select(User).where(
        or_(
            User.email == email,
            User.phone == phone,
        )
    )

    user = db.scalar(stmt)

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid OTP or account",
        )

    destination = user.email or user.phone

    if not otp_service.verify(destination, otp):
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP",
        )

    return {
        "message": "OTP verified successfully.",
    }


# =========================================================
# RESET PASSWORD
# =========================================================

def reset_password(
    db: Session,
    identifier: str,
    new_password: str,
):
    identifier = identifier.strip()

    email, phone = split_identifier(identifier)

    stmt = select(User).where(
        or_(
            User.email == email,
            User.phone == phone,
        )
    )

    user = db.scalar(stmt)

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid account",
        )

    destination = user.email or user.phone

    if not otp_service.is_verified(destination):
        raise HTTPException(
            status_code=400,
            detail="Please verify OTP before resetting your password",
        )

    user.hashed_password = hash_password(new_password)

    db.commit()

    otp_service.clear(destination)

    return {
        "message": "Password reset successfully.",
    }
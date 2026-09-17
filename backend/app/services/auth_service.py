from fastapi import HTTPException, status
from sqlalchemy import select
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


def find_user_by_identifier(db: Session, email: str | None, phone: str | None) -> User | None:
    """Look up a user by whichever field split_identifier resolved.

    Only one of email/phone is ever set. Filtering on both with OR would
    also match every other user whose unused field is NULL (SQLAlchemy
    turns `== None` into `IS NULL`), returning the wrong account.
    """
    stmt = select(User).where(
        User.email == email if email else User.phone == phone
    )
    return db.scalar(stmt)


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
    user = find_user_by_identifier(db, email, phone)

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
# FORGOT PASSWORD
# =========================================================

def request_password_reset(
    db: Session,
    identifier: str,
):
    identifier = identifier.strip()

    email, phone = split_identifier(identifier)

    user = find_user_by_identifier(db, email, phone)

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

    user = find_user_by_identifier(db, email, phone)

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

    user = find_user_by_identifier(db, email, phone)

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
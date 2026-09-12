import hashlib
from datetime import timedelta
from typing import Optional

from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import RegisterRequest

# Password reset links are only valid for a short window.
RESET_TOKEN_EXPIRE_MINUTES = 15


class EmailAlreadyExistsError(Exception):
    """Raised when trying to register with an email that is already in use."""


class PhoneAlreadyExistsError(Exception):
    """Raised when trying to register with a phone number that is already in use."""


class InactiveUserError(Exception):
    """Raised when a user's credentials are correct, but their account is disabled."""


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_phone(db: Session, phone: str) -> Optional[User]:
    return db.query(User).filter(User.phone == phone).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, data: RegisterRequest) -> User:
    """
    Creates a new user after checking that the email (and phone, if
    provided) are not already taken. Passwords are hashed before
    ever touching the database.
    """
    if get_user_by_email(db, data.email) is not None:
        raise EmailAlreadyExistsError("A user with this email already exists.")

    if data.phone and get_user_by_phone(db, data.phone) is not None:
        raise PhoneAlreadyExistsError("A user with this phone number already exists.")

    new_user = User(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        password_hash=hash_password(data.password),
        role=data.role,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Checks an email/password combination.

    Returns the User if the credentials are correct and the account
    is active.

    Returns None if the email doesn't exist OR the password is wrong
    (deliberately the same result for both cases, so a caller cannot
    tell which one failed — this prevents attackers from discovering
    which emails are registered).

    Raises InactiveUserError only after the password has already been
    verified as correct — so an attacker without the correct password
    still learns nothing about whether the account is active.
    """
    user = get_user_by_email(db, email)
    if user is None:
        return None

    if not verify_password(password, user.password_hash):
        return None

    if not user.is_active:
        raise InactiveUserError("This account has been deactivated.")

    return user


def generate_token_for_user(user: User) -> str:
    """
    Builds a JWT access token for an authenticated user.
    Only safe, non-sensitive identifying info goes into the token.

    "purpose": "access" marks this as a normal login token, so it can
    be told apart from a password-reset token (see below). Without
    this, a leaked password-reset token could be used to log in as
    if it were a real access token.
    """
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
        "purpose": "access",
    }
    return create_access_token(token_data)


def _password_fingerprint(user: User) -> str:
    """
    A short, derived fingerprint of the user's CURRENT password hash.
    This is not the hash itself (we never want to expose that inside a
    JWT payload, which is only signed, not encrypted, and is trivially
    readable by anyone who has the token). It only lets us detect
    whether the password has changed since a reset token was issued.
    """
    return hashlib.sha256(user.password_hash.encode("utf-8")).hexdigest()[:16]


def generate_password_reset_token(user: User) -> str:
    """
    Builds a short-lived JWT meant only for resetting a password.

    It intentionally expires much sooner than a normal login token,
    carries "purpose": "password_reset" so it cannot be used to access
    any protected route, and embeds a fingerprint of the user's CURRENT
    password hash.

    Why the fingerprint matters: once this token is used to actually
    change the password, the user's password_hash changes, so the
    fingerprint recorded in the token no longer matches. That makes
    the token unusable a second time, even though we never stored it
    anywhere — without this, a leaked reset token could be replayed
    to change the password again and again until it expires.
    """
    token_data = {
        "sub": str(user.id),
        "purpose": "password_reset",
        "pwd_fp": _password_fingerprint(user),
    }
    return create_access_token(
        token_data, expires_delta=timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    )


def verify_password_reset_token(db: Session, token: str) -> Optional[User]:
    """
    Checks a password-reset token's signature, expiration, purpose, and
    password fingerprint. Returns the User it belongs to if everything
    is valid, or None if the token is invalid, expired, not actually a
    reset token, or was already used to change the password once.
    """
    try:
        payload = decode_access_token(token)
    except JWTError:
        return None

    if payload.get("purpose") != "password_reset":
        return None

    user_id = payload.get("sub")
    if user_id is None:
        return None

    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        return None

    user = get_user_by_id(db, user_id_int)
    if user is None:
        return None

    if payload.get("pwd_fp") != _password_fingerprint(user):
        # The password has already changed since this token was
        # issued — either it was already used once, or it's stale.
        return None

    return user


def reset_user_password(db: Session, user: User, new_password: str) -> User:
    """
    Overwrites a user's password_hash with a hash of their new password.
    """
    user.password_hash = hash_password(new_password)
    db.commit()
    db.refresh(user)
    return user

import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import UserRole


def _validate_password_strength(value: str) -> str:
    if not re.search(r"[A-Za-z]", value):
        raise ValueError("Password must contain at least one letter.")
    if not re.search(r"[0-9]", value):
        raise ValueError("Password must contain at least one number.")
    return value


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: Optional[str] = Field(default=None, min_length=7, max_length=20)
    # bcrypt (used in app/core/security.py) only looks at the first 72 bytes
    # of a password, so we cap length here to avoid a false sense of security.
    password: str = Field(..., min_length=8, max_length=72)
    role: UserRole

    @field_validator("password")
    @classmethod
    def password_must_be_strong(cls, value: str) -> str:
        return _validate_password_strength(value)

    @field_validator("role")
    @classmethod
    def disallow_admin_self_registration(cls, value: UserRole) -> UserRole:
        # Admin accounts must never be creatable through public
        # self-registration. Admins should be created through a separate,
        # protected process (e.g. directly in the database, or by an
        # existing admin), not by anyone who fills out this form.
        if value == UserRole.admin:
            raise ValueError("The admin role cannot be selected during self-registration.")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    # Allows building this schema directly from a SQLAlchemy User object
    # (e.g. UserResponse.model_validate(user_instance)).
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime
    # Intentionally no password_hash field here — it must never be
    # sent back to the frontend.


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=72)

    @field_validator("new_password")
    @classmethod
    def password_must_be_strong(cls, value: str) -> str:
        return _validate_password_strength(value)

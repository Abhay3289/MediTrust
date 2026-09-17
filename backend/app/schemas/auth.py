from pydantic import BaseModel, Field, field_validator
from google.oauth2 import id_token
from google.auth.transport import requests
from fastapi import HTTPException, status
class GoogleLoginRequest(BaseModel):
    credential: str

# =========================================================
# REGISTER
# =========================================================

class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    identifier: str
    password: str = Field(min_length=8, max_length=128)
    role: str = "patient"
    city: str | None = None
    consent: bool = False

    @field_validator("role")
    @classmethod
    def valid_role(cls, v):
        if v not in {"patient", "caregiver"}:
            raise ValueError("Role must be patient or caregiver")
        return v


# =========================================================
# LOGIN
# =========================================================

class LoginRequest(BaseModel):
    identifier: str
    password: str


# =========================================================
# REFRESH TOKEN
# =========================================================

class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# =========================================================
# USER RESPONSE
# =========================================================

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str | None = None
    phone: str | None = None
    role: str
    city: str | None = None
    consent: bool

    model_config = {"from_attributes": True}


# =========================================================
# FORGOT PASSWORD
# =========================================================

class ForgotPasswordRequest(BaseModel):
    identifier: str


class ForgotPasswordResponse(BaseModel):
    message: str


# =========================================================
# VERIFY OTP
# =========================================================

class VerifyOTPRequest(BaseModel):
    identifier: str
    otp: str = Field(min_length=6, max_length=6)


class VerifyOTPResponse(BaseModel):
    message: str


# =========================================================
# RESET PASSWORD
# =========================================================

class ResetPasswordRequest(BaseModel):
    identifier: str
    new_password: str = Field(min_length=8, max_length=128)


class ResetPasswordResponse(BaseModel):
    message: str
def verify_google_credential(credential: str):
    try:
        google_user = id_token.verify_oauth2_token(
            credential,
            requests.Request(),
        )

        return google_user

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credential",
        )

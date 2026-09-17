from pydantic import BaseModel
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshRequest,
    TokenResponse,
    UserResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    VerifyOTPRequest,
    VerifyOTPResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
)

from app.services.auth_service import (
    register,
    login,
    tokens,
    google_login,
    request_password_reset,
    verify_password_reset_otp,
    reset_password,
)

from app.services.email_service import (
    send_login_email,
    send_welcome_email,
)

from app.core.dependencies import get_current_user
from app.core.security import decode_token
from app.models.user import User


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# =========================================================
# GOOGLE LOGIN REQUEST
# =========================================================

class GoogleLoginRequest(BaseModel):
    credential: str


# =========================================================
# REGISTER
# =========================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201,
)
def register_user(
    data: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = register(db, data)

    if user.email:
        background_tasks.add_task(
            send_welcome_email,
            user.email,
            user.full_name,
        )

    return user


# =========================================================
# LOGIN
# =========================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login_user(
    data: LoginRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = login(db, data)

    if user.email:
        background_tasks.add_task(
            send_login_email,
            user.email,
            user.full_name,
            "email and password",
        )

    return tokens(user)


# =========================================================
# GOOGLE LOGIN
# =========================================================

@router.post(
    "/google",
    response_model=TokenResponse,
)
def google_login_user(
    data: GoogleLoginRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user, created = google_login(
        db,
        data.credential,
    )

    if created:
        background_tasks.add_task(
            send_welcome_email,
            user.email,
            user.full_name,
        )

    background_tasks.add_task(
        send_login_email,
        user.email,
        user.full_name,
        "Google",
    )

    return tokens(user)


# =========================================================
# CURRENT USER
# =========================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def me(
    user: User = Depends(get_current_user),
):
    return user


# =========================================================
# REFRESH TOKEN
# =========================================================

@router.post(
    "/refresh",
    response_model=TokenResponse,
)
def refresh(
    data: RefreshRequest,
    db: Session = Depends(get_db),
):
    try:
        payload = decode_token(
            data.refresh_token,
            "refresh",
        )

        user = db.get(
            User,
            int(payload["sub"]),
        )

    except Exception:
        user = None

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token",
        )

    return tokens(user)


# =========================================================
# LOGOUT
# =========================================================

@router.post("/logout")
def logout(
    user: User = Depends(get_current_user),
):
    return {
        "message": (
            "Logged out. Discard the access and "
            "refresh tokens on the client."
        )
    }


# =========================================================
# FORGOT PASSWORD
# =========================================================

@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
)
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    return request_password_reset(
        db,
        data.identifier,
    )


# =========================================================
# VERIFY OTP
# =========================================================

@router.post(
    "/verify-otp",
    response_model=VerifyOTPResponse,
)
def verify_otp(
    data: VerifyOTPRequest,
    db: Session = Depends(get_db),
):
    return verify_password_reset_otp(
        db,
        data.identifier,
        data.otp,
    )


# =========================================================
# RESET PASSWORD
# =========================================================

@router.post(
    "/reset-password",
    response_model=ResetPasswordResponse,
)
def reset_password_endpoint(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    return reset_password(
        db,
        data.identifier,
        data.new_password,
    )
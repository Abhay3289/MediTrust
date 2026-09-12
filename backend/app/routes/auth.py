from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.services import auth_service
from app.services.auth_service import (
    EmailAlreadyExistsError,
    InactiveUserError,
    PhoneAlreadyExistsError,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """
    Creates a new patient/doctor/mediator account.
    (Admin accounts cannot be created here — see RegisterRequest.)
    """
    try:
        user = auth_service.create_user(db, data)
    except EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )
    except PhoneAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this phone number already exists.",
        )
    return user


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """
    Verifies email + password and returns a JWT access token.
    """
    try:
        user = auth_service.authenticate_user(db, data.email, data.password)
    except InactiveUserError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = auth_service.generate_token_for_user(user)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the profile of whoever the access token belongs to.
    Requires: Authorization: Bearer <token>
    """
    return current_user


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """
    Logout for a stateless JWT system.

    This does NOT invalidate the token on the server (JWTs are
    stateless — see Phase 13 explanation). It confirms the caller was
    genuinely authenticated, and signals the frontend to delete its
    stored token. The token technically remains valid until it expires
    or the server's JWT_SECRET_KEY changes.
    """
    return {"message": "Logged out. Please remove the token on the client."}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Starts a password reset. Always returns the same generic message,
    whether or not the email is registered, so this endpoint cannot be
    used to discover which emails exist on MediTrust.
    """
    user = auth_service.get_user_by_email(db, data.email)

    if user is not None and user.is_active:
        reset_token = auth_service.generate_password_reset_token(user)
        # DEVELOPMENT ONLY: no email service is configured yet, so we
        # print the token to the server console so it can be tested.
        # In production, this token must be emailed to the user and
        # never logged or returned in the API response.
        print(f"[DEV ONLY] Password reset token for {user.email}: {reset_token}")

    return {
        "message": "If that email is registered, a password reset link has been sent."
    }


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Completes a password reset using the token issued by /forgot-password.
    """
    user = auth_service.verify_password_reset_token(db, data.token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token.",
        )

    auth_service.reset_user_password(db, user, data.new_password)
    return {"message": "Password has been reset successfully."}


# --- Demonstration endpoints for role-based access control ---
# These show how require_role() protects a route by role. In a real
# feature (e.g. a hospitals module), require_role(...) would be added
# directly to that module's own routes, not kept here permanently.


@router.get("/admin-only", tags=["Role Access Demo"])
def admin_only_demo(current_user: User = Depends(require_role(UserRole.admin))):
    return {"message": f"Welcome, admin {current_user.full_name}."}


@router.get("/doctor-only", tags=["Role Access Demo"])
def doctor_only_demo(current_user: User = Depends(require_role(UserRole.doctor))):
    return {"message": f"Welcome, doctor {current_user.full_name}."}

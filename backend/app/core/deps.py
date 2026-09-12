from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.user import User, UserRole
from app.services.auth_service import get_user_by_id

# Tells FastAPI (and Swagger docs) that routes using this expect a
# header like: Authorization: Bearer <token>
bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Reusable dependency: extracts the JWT from the Authorization header,
    verifies it, and loads the matching user from the database.

    Any route that adds `current_user: User = Depends(get_current_user)`
    automatically becomes a protected route — FastAPI will reject the
    request before the route's own code ever runs if the token is
    missing, invalid, expired, or belongs to an inactive user.
    """
    token = credentials.credentials

    try:
        payload = decode_access_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

    # A password-reset token must never work as a login token.
    if payload.get("purpose") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This token cannot be used for authentication.",
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
        )

    user = get_user_by_id(db, int(user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    return user


def require_role(*allowed_roles: UserRole):
    """
    Dependency FACTORY for role-based access control.

    Usage in a route:
        Depends(require_role(UserRole.admin))
        Depends(require_role(UserRole.doctor, UserRole.admin))  # multiple allowed

    It builds on top of get_current_user: a request must first pass
    the normal token checks (valid, not expired, active user), and
    ONLY THEN is the user's role checked against the allowed list.
    """

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            allowed_names = [role.value for role in allowed_roles]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires one of these roles: {allowed_names}.",
            )
        return current_user

    return role_checker

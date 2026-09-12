import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class UserRole(str, enum.Enum):
    patient = "patient"
    doctor = "doctor"
    mediator = "mediator"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(150), nullable=False)

    email = Column(String(255), unique=True, index=True, nullable=False)

    # Optional field, but if provided, it must be unique.
    # PostgreSQL allows multiple NULL values in a unique column,
    # so this does not force every user to have a phone number.
    phone = Column(String(20), unique=True, index=True, nullable=True)

    # We only ever store the HASH of a password, never the real password.
    password_hash = Column(String(255), nullable=False)

    role = Column(Enum(UserRole), nullable=False, default=UserRole.patient)

    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"

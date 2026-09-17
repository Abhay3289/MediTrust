from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserRole(str, Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    full_name: Mapped[str] = mapped_column(String(120))

    email: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=True
    )

    phone: Mapped[str | None] = mapped_column(
        String(30),
        unique=True,
        index=True,
        nullable=True
    )

    hashed_password: Mapped[str] = mapped_column(Text)

    role: Mapped[UserRole] = mapped_column(
        String(20),
        default=UserRole.PATIENT,
        index=True
    )

    city: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True
    )

    latitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    longitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    consent: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    appointments = relationship(
        "Appointment",
        back_populates="patient"
    )

    consultations = relationship(
        "Consultation",
        back_populates="patient"
    )

    reviews = relationship(
        "Review",
        back_populates="user"
    )

    saved_hospitals = relationship(
        "SavedHospital",
        back_populates="user",
        cascade="all, delete-orphan"
    )
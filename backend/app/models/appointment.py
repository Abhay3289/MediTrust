from datetime import datetime, date, time
from enum import Enum

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AppointmentType(str, Enum):
    IN_CLINIC = "in_clinic"
    VIDEO = "video"


class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True
    )

    doctor_id: Mapped[str] = mapped_column(
        ForeignKey("doctors.id"),
        index=True
    )

    hospital_id: Mapped[str | None] = mapped_column(
        ForeignKey("hospitals.id"),
        nullable=True,
        index=True
    )

    appointment_date: Mapped[date] = mapped_column(
        Date,
        index=True
    )

    appointment_time: Mapped[time] = mapped_column(Time)

    appointment_type: Mapped[AppointmentType] = mapped_column(
        String(40),
        default=AppointmentType.IN_CLINIC
    )

    status: Mapped[AppointmentStatus] = mapped_column(
        String(30),
        default=AppointmentStatus.PENDING,
        index=True
    )

    notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )

    patient = relationship(
        "User",
        back_populates="appointments"
    )

    doctor = relationship(
        "Doctor",
        back_populates="appointments"
    )

    hospital = relationship(
        "Hospital",
        back_populates="appointments"
    )
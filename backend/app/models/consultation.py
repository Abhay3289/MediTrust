from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ConsultationStatus(str, Enum):
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Consultation(Base):
    __tablename__ = "consultations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True
    )

    doctor_id: Mapped[str] = mapped_column(
        ForeignKey("doctors.id"),
        index=True
    )

    appointment_id: Mapped[int | None] = mapped_column(
        ForeignKey("appointments.id"),
        nullable=True
    )

    scheduled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True)
    )

    status: Mapped[ConsultationStatus] = mapped_column(
        String(30),
        default=ConsultationStatus.SCHEDULED,
        index=True
    )

    session_reference: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True
    )

    notes: Mapped[str | None] = mapped_column(Text)

    patient = relationship(
        "User",
        back_populates="consultations"
    )

    doctor = relationship(
        "Doctor",
        back_populates="consultations"
    )
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Float, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Hospital(Base):
    __tablename__ = "hospitals"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    tagline: Mapped[str | None] = mapped_column(String(300))
    type: Mapped[str | None] = mapped_column(String(120))
    address: Mapped[str] = mapped_column(String(300))
    city: Mapped[str] = mapped_column(String(120), index=True)
    phone: Mapped[str | None] = mapped_column(String(40))
    emergency_hotline: Mapped[str | None] = mapped_column(String(40))
    website: Mapped[str | None] = mapped_column(String(300))
    opening_hours: Mapped[str | None] = mapped_column(String(300))
    latitude: Mapped[float] = mapped_column(Float, index=True)
    longitude: Mapped[float] = mapped_column(Float, index=True)
    rating: Mapped[float] = mapped_column(Float, default=0)
    reviews_count: Mapped[int] = mapped_column(Integer, default=0)
    hospital_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    quality_accreditation: Mapped[str | None] = mapped_column(String(120))
    is_24x7_emergency: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    has_pediatrics: Mapped[bool] = mapped_column(Boolean, default=False)
    has_diagnostics: Mapped[bool] = mapped_column(Boolean, default=False)
    er_wait_time: Mapped[str | None] = mapped_column(String(80))
    specialties: Mapped[list] = mapped_column(JSON, default=list)
    facilities: Mapped[list] = mapped_column(JSON, default=list)
    trust_breakdown: Mapped[dict] = mapped_column(JSON, default=dict)
    overview: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    doctors = relationship("Doctor", back_populates="hospital")
    reviews = relationship("Review", back_populates="hospital", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="hospital")
    saved_by = relationship("SavedHospital", back_populates="hospital", cascade="all, delete-orphan")
    stays = relationship("Stay", back_populates="hospital")

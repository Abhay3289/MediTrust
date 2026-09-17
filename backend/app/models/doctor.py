from sqlalchemy import Boolean, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Doctor(Base):
    __tablename__ = "doctors"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    name: Mapped[str] = mapped_column(String(180), index=True)
    specialty: Mapped[str] = mapped_column(String(160), index=True)
    experience: Mapped[str | None] = mapped_column(String(80))
    hospital_id: Mapped[str | None] = mapped_column(
    ForeignKey("hospitals.id"),
    nullable=True,
    index=True
)
    hospital_label: Mapped[str | None] = mapped_column(String(250))
    rating: Mapped[float] = mapped_column(Float, default=0)
    reviews_count: Mapped[int] = mapped_column(Integer, default=0)
    available_today: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    avatar_bg: Mapped[str | None] = mapped_column(String(30))
    initials: Mapped[str | None] = mapped_column(String(10))
    consultation_fee: Mapped[str | None] = mapped_column(String(40))
    bio: Mapped[str | None] = mapped_column(Text)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    availability: Mapped[list] = mapped_column(JSON, default=list)
    hospital = relationship("Hospital", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")
    consultations = relationship("Consultation", back_populates="doctor")
    reviews = relationship("Review", back_populates="doctor", cascade="all, delete-orphan")

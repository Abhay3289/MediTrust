from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Stay(Base):
    __tablename__ = "stays"
    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(180))
    type: Mapped[str] = mapped_column(String(100))
    near_hospital_id: Mapped[str] = mapped_column(ForeignKey("hospitals.id"), index=True)
    address: Mapped[str] = mapped_column(String(300))
    distance_from_hospital: Mapped[float] = mapped_column(Float)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    price_per_day: Mapped[int] = mapped_column(Integer)
    food_per_day: Mapped[int] = mapped_column(Integer)
    mandatory_charges: Mapped[int] = mapped_column(Integer)
    long_stay_support: Mapped[bool] = mapped_column(Boolean, default=False)
    caregiver_friendly: Mapped[bool] = mapped_column(Boolean, default=False)
    accessible: Mapped[bool] = mapped_column(Boolean, default=False)
    facilities: Mapped[list] = mapped_column(JSON, default=list)
    # Each room: {type, beds, price_per_day, ac, attached_bathroom, accessible, available}
    room_options: Mapped[list] = mapped_column(JSON, default=list)
    # Verified guest reviews: {author, rating, date, comment}
    reviews: Mapped[list] = mapped_column(JSON, default=list)
    contact: Mapped[str | None] = mapped_column(String(40))
    overview: Mapped[str | None] = mapped_column(Text)
    stay_breakdown: Mapped[dict] = mapped_column(JSON, default=dict)
    hospital = relationship("Hospital", back_populates="stays")
    requests = relationship("StayRequest", back_populates="stay", cascade="all, delete-orphan")


class StayRequest(Base):
    __tablename__ = "stay_requests"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    stay_id: Mapped[str] = mapped_column(ForeignKey("stays.id", ondelete="CASCADE"), index=True)
    hospital_id: Mapped[str | None] = mapped_column(ForeignKey("hospitals.id"))
    room_type: Mapped[str] = mapped_column(String(80))
    check_in: Mapped[date] = mapped_column(Date)
    nights: Mapped[int] = mapped_column(Integer)
    guests: Mapped[int] = mapped_column(Integer)
    include_food: Mapped[bool] = mapped_column(Boolean, default=True)
    contact_name: Mapped[str] = mapped_column(String(120))
    contact_phone: Mapped[str] = mapped_column(String(30))
    notes: Mapped[str | None] = mapped_column(Text)
    estimated_cost: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    stay = relationship("Stay", back_populates="requests")

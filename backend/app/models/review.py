from datetime import datetime, timezone
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    hospital_id: Mapped[str | None] = mapped_column(ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=True, index=True)
    doctor_id: Mapped[str | None] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=True, index=True)
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str] = mapped_column(Text)
    reviewer_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    user = relationship("User", back_populates="reviews")
    hospital = relationship("Hospital", back_populates="reviews")
    doctor = relationship("Doctor", back_populates="reviews")

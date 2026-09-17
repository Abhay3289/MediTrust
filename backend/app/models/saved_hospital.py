from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
class SavedHospital(Base):
    __tablename__ = "saved_hospitals"
    __table_args__ = (UniqueConstraint("user_id", "hospital_id", name="uq_saved_user_hospital"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    hospital_id: Mapped[str] = mapped_column(ForeignKey("hospitals.id", ondelete="CASCADE"), index=True)
    user = relationship("User", back_populates="saved_hospitals")
    hospital = relationship("Hospital", back_populates="saved_by")

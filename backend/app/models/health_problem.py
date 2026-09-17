from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
class HealthProblem(Base):
    __tablename__ = "health_problems"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    name: Mapped[str] = mapped_column(String(180), index=True)
    keywords: Mapped[list] = mapped_column(JSON, default=list)
    recommended_departments: Mapped[list] = mapped_column(JSON, default=list)
    relevant_hospital_ids: Mapped[list] = mapped_column(JSON, default=list)
    guidance: Mapped[str | None] = mapped_column(Text)

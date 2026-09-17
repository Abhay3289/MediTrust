from pydantic import BaseModel, Field
class DoctorBase(BaseModel):
    name: str
    specialty: str
    experience: str | None = None
    hospital_id: str | None = None
    hospital_label: str | None = None
    rating: float = 0
    reviews_count: int = 0
    available_today: bool = False
    avatar_bg: str | None = None
    initials: str | None = None
    consultation_fee: str | None = None
    bio: str | None = None
    verified: bool = False
    availability: list = Field(default_factory=list)
class DoctorResponse(DoctorBase):
    id: str
    model_config = {"from_attributes": True}
class PaginatedDoctors(BaseModel):
    items: list[DoctorResponse]
    page: int
    limit: int
    total: int
    pages: int

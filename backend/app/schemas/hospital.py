from pydantic import BaseModel, Field
class HospitalBase(BaseModel):
    name: str
    tagline: str | None = None
    type: str | None = None
    address: str
    city: str
    phone: str | None = None
    emergency_hotline: str | None = None
    website: str | None = None
    opening_hours: str | None = None
    latitude: float
    longitude: float
    rating: float = 0
    reviews_count: int = 0
    hospital_verified: bool = False
    quality_accreditation: str | None = None
    is_24x7_emergency: bool = False
    has_pediatrics: bool = False
    has_diagnostics: bool = False
    er_wait_time: str | None = None
    specialties: list[str] = Field(default_factory=list)
    facilities: list[str] = Field(default_factory=list)
    trust_breakdown: dict = Field(default_factory=dict)
    overview: str | None = None
class HospitalResponse(HospitalBase):
    id: str
    distance: float | None = None
    distance_text: str | None = None
    model_config = {"from_attributes": True}
class PaginatedHospitals(BaseModel):
    items: list[HospitalResponse]
    page: int
    limit: int
    total: int
    pages: int

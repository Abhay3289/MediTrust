from pydantic import BaseModel, Field
class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = None
    city: str | None = None
    latitude: float | None = None
    longitude: float | None = None
class UserProfile(BaseModel):
    id: int
    full_name: str
    email: str | None
    phone: str | None
    role: str
    city: str | None
    latitude: float | None
    longitude: float | None
    consent: bool
    model_config = {"from_attributes": True}

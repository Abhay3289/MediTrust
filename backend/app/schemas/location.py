from pydantic import BaseModel, Field
class NearbyHospital(BaseModel):
    id: str
    name: str
    address: str
    city: str
    latitude: float
    longitude: float
    distance_km: float
    is_24x7_emergency: bool
    rating: float
class ReverseGeocodeResponse(BaseModel):
    city: str | None
    state: str | None
    country: str | None
    formatted_address: str

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StayRequestCreate(BaseModel):
    stay_id: str
    room_type: str = Field(min_length=1, max_length=80)
    check_in: date
    nights: int = Field(ge=1, le=365)
    guests: int = Field(ge=1, le=10)
    include_food: bool = True
    contact_name: str = Field(min_length=2, max_length=120)
    contact_phone: str = Field(min_length=7, max_length=30)
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("check_in")
    @classmethod
    def not_in_past(cls, value: date) -> date:
        if value < date.today():
            raise ValueError("Check-in date cannot be in the past")
        return value

    @field_validator("contact_phone")
    @classmethod
    def phone_digits(cls, value: str) -> str:
        digits = "".join(ch for ch in value if ch.isdigit())
        if not 7 <= len(digits) <= 15:
            raise ValueError("Enter a valid phone number")
        return value.strip()


class StayRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    stay_id: str
    stay_name: str
    stay_address: str
    stay_contact: str | None
    hospital_id: str | None
    room_type: str
    check_in: date
    nights: int
    guests: int
    include_food: bool
    contact_name: str
    contact_phone: str
    notes: str | None
    estimated_cost: int
    status: str
    created_at: datetime

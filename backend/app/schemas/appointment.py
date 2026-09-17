from datetime import date, time
from pydantic import BaseModel, Field
class AppointmentCreate(BaseModel):
    doctor_id: str
    hospital_id: str | None = None
    appointment_date: date
    appointment_time: time
    appointment_type: str = "in_clinic"
    notes: str | None = Field(default=None, max_length=2000)
class AppointmentUpdate(BaseModel):
    appointment_date: date | None = None
    appointment_time: time | None = None
    appointment_type: str | None = None
    status: str | None = None
    notes: str | None = None
class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: str
    hospital_id: str | None
    appointment_date: date
    appointment_time: time
    appointment_type: str
    status: str
    notes: str | None
    model_config = {"from_attributes": True}

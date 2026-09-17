from datetime import datetime
from pydantic import BaseModel
class ConsultationCreate(BaseModel):
    doctor_id: str
    scheduled_at: datetime
    notes: str | None = None
class ConsultationUpdate(BaseModel):
    status: str | None = None
    notes: str | None = None
class ConsultationResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: str
    appointment_id: int | None
    scheduled_at: datetime
    status: str
    session_reference: str | None
    notes: str | None
    model_config = {"from_attributes": True}

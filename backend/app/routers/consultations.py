from fastapi import APIRouter,Depends,HTTPException
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.consultation import Consultation
from app.models.doctor import Doctor
from app.schemas.consultation import ConsultationCreate,ConsultationUpdate,ConsultationResponse
router=APIRouter(prefix="/consultations",tags=["Consultations"])
@router.post("",response_model=ConsultationResponse,status_code=201)
def create(data:ConsultationCreate,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    if not db.get(Doctor,data.doctor_id): raise HTTPException(404,"Doctor not found")
    scheduled=data.scheduled_at.replace(tzinfo=timezone.utc) if data.scheduled_at.tzinfo is None else data.scheduled_at
    if scheduled < datetime.now(timezone.utc): raise HTTPException(422,"Consultation time cannot be in the past")
    c=Consultation(patient_id=user.id,doctor_id=data.doctor_id,scheduled_at=scheduled,notes=data.notes,status="scheduled")
    db.add(c); db.commit(); db.refresh(c); return c
@router.get("",response_model=list[ConsultationResponse])
def list_all(user:User=Depends(get_current_user),db:Session=Depends(get_db)): return db.scalars(select(Consultation).where(Consultation.patient_id==user.id).order_by(Consultation.scheduled_at.desc())).all()
@router.get("/{id}",response_model=ConsultationResponse)
def get_one(id:int,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    c=db.get(Consultation,id)
    if not c or c.patient_id!=user.id: raise HTTPException(404,"Consultation not found")
    return c
@router.patch("/{id}",response_model=ConsultationResponse)
def update(id:int,data:ConsultationUpdate,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    c=db.get(Consultation,id)
    if not c or c.patient_id!=user.id: raise HTTPException(404,"Consultation not found")
    if data.status and data.status not in {"scheduled","in_progress","completed","cancelled"}: raise HTTPException(422,"Invalid consultation status")
    for k,v in data.model_dump(exclude_unset=True).items(): setattr(c,k,v)
    db.commit(); db.refresh(c); return c

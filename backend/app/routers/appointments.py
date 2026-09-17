from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate,AppointmentUpdate,AppointmentResponse
from app.services.appointment_service import create_appointment
router=APIRouter(prefix="/appointments",tags=["Appointments"])
@router.post("",response_model=AppointmentResponse,status_code=201)
def create(data:AppointmentCreate,user:User=Depends(get_current_user),db:Session=Depends(get_db)): return create_appointment(db,user.id,data)
@router.get("",response_model=list[AppointmentResponse])
def list_all(user:User=Depends(get_current_user),db:Session=Depends(get_db)): return db.scalars(select(Appointment).where(Appointment.patient_id==user.id).order_by(Appointment.appointment_date.desc(),Appointment.appointment_time)).all()
@router.get("/{appointment_id}",response_model=AppointmentResponse)
def get_one(appointment_id:int,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    a=db.get(Appointment,appointment_id)
    if not a or a.patient_id!=user.id: raise HTTPException(404,"Appointment not found")
    return a
@router.patch("/{appointment_id}",response_model=AppointmentResponse)
def update(appointment_id:int,data:AppointmentUpdate,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    a=db.get(Appointment,appointment_id)
    if not a or a.patient_id!=user.id: raise HTTPException(404,"Appointment not found")
    if data.status and data.status not in {"pending","confirmed","completed","cancelled"}: raise HTTPException(422,"Invalid appointment status")
    for k,v in data.model_dump(exclude_unset=True).items(): setattr(a,k,v)
    db.commit(); db.refresh(a); return a
@router.delete("/{appointment_id}")
def delete(appointment_id:int,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    a=db.get(Appointment,appointment_id)
    if not a or a.patient_id!=user.id: raise HTTPException(404,"Appointment not found")
    a.status="cancelled"; db.commit(); return {"message":"Appointment cancelled"}

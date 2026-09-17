from math import ceil
from fastapi import APIRouter,Depends,Query,HTTPException
from sqlalchemy import func,or_,select
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.doctor import Doctor
from app.schemas.doctor import DoctorResponse,PaginatedDoctors
router=APIRouter(prefix="/doctors",tags=["Doctors"])
def dout(d): return DoctorResponse.model_validate(d)
@router.get("",response_model=PaginatedDoctors)
def list_doctors(page:int=Query(1,ge=1),limit:int=Query(20,ge=1,le=100),specialty:str|None=None,hospital_id:str|None=None,rating:float|None=None,db:Session=Depends(get_db)):
    stmt=select(Doctor)
    if specialty: stmt=stmt.where(Doctor.specialty.ilike(f"%{specialty}%"))
    if hospital_id: stmt=stmt.where(Doctor.hospital_id==hospital_id)
    if rating is not None: stmt=stmt.where(Doctor.rating>=rating)
    total=db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows=db.scalars(stmt.order_by(Doctor.rating.desc()).offset((page-1)*limit).limit(limit)).all()
    return {"items":[dout(x) for x in rows],"page":page,"limit":limit,"total":total,"pages":ceil(total/limit) if total else 0}
@router.get("/search",response_model=list[DoctorResponse])
def search(q:str=Query(...,min_length=1),db:Session=Depends(get_db)):
    pat=f"%{q}%"; rows=db.scalars(select(Doctor).where(or_(Doctor.name.ilike(pat),Doctor.specialty.ilike(pat),Doctor.hospital_label.ilike(pat))).order_by(Doctor.rating.desc()).limit(50)).all(); return [dout(x) for x in rows]
@router.get("/{doctor_id}",response_model=DoctorResponse)
def get_doctor(doctor_id:str,db:Session=Depends(get_db)):
    d=db.get(Doctor,doctor_id)
    if not d: raise HTTPException(404,"Doctor not found")
    return dout(d)
@router.get("/{doctor_id}/availability")
def availability(doctor_id:str,db:Session=Depends(get_db)):
    d=db.get(Doctor,doctor_id)
    if not d: raise HTTPException(404,"Doctor not found")
    return {"doctor_id":doctor_id,"available_today":d.available_today,"slots":d.availability}

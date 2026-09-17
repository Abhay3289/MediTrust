from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.hospital import Hospital
from app.models.saved_hospital import SavedHospital
from app.schemas.hospital import HospitalResponse
router=APIRouter(prefix="/saved-hospitals",tags=["Saved Hospitals"])
def out(h): return HospitalResponse.model_validate(h)
@router.post("/{hospital_id}",response_model=HospitalResponse,status_code=201)
def save(hospital_id:str,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    h=db.get(Hospital,hospital_id)
    if not h: raise HTTPException(404,"Hospital not found")
    if not db.scalar(select(SavedHospital).where(SavedHospital.user_id==user.id,SavedHospital.hospital_id==hospital_id)):
        db.add(SavedHospital(user_id=user.id,hospital_id=hospital_id)); db.commit()
    return out(h)
@router.delete("/{hospital_id}")
def unsave(hospital_id:str,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    s=db.scalar(select(SavedHospital).where(SavedHospital.user_id==user.id,SavedHospital.hospital_id==hospital_id))
    if not s: raise HTTPException(404,"Hospital is not saved")
    db.delete(s); db.commit(); return {"message":"Hospital removed from saved list"}
@router.get("",response_model=list[HospitalResponse])
def saved(user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    return db.scalars(select(Hospital).join(SavedHospital).where(SavedHospital.user_id==user.id)).all()

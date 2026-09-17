from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.health_problem import HealthProblem
from app.models.hospital import Hospital
router=APIRouter(prefix="/health-problems",tags=["Health Problems"])
@router.get("")
def list_problems(db:Session=Depends(get_db)): return db.scalars(select(HealthProblem).order_by(HealthProblem.name)).all()
@router.get("/{problem_id}/recommendations")
def recommendations(problem_id:str,db:Session=Depends(get_db)):
    p=db.get(HealthProblem,problem_id)
    if not p: raise HTTPException(404,"Health problem not found")
    hs=db.scalars(select(Hospital).where(Hospital.id.in_(p.relevant_hospital_ids))).all()
    return {"problem":p,"hospitals":hs,"disclaimer":"This is service discovery, not a medical diagnosis."}

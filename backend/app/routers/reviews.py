from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy import select,func
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.review import Review
from app.models.hospital import Hospital
from app.models.doctor import Doctor
from app.schemas.review import ReviewCreate,ReviewResponse
router=APIRouter(tags=["Reviews"])
def create_review(db,user,kind,id,data):
    obj=db.get(Hospital if kind=="hospital" else Doctor,id)
    if not obj: raise HTTPException(404,f"{kind.title()} not found")
    r=Review(user_id=user.id, rating=data.rating, comment=data.comment, reviewer_name=user.full_name, **{f"{kind}_id":id}); db.add(r); db.commit(); db.refresh(r)
    avg=db.scalar(select(func.avg(Review.rating)).where(getattr(Review,f"{kind}_id")==id)) or 0
    obj.rating=round(float(avg),2); obj.reviews_count=db.scalar(select(func.count()).where(getattr(Review,f"{kind}_id")==id)) or 0; db.commit()
    return r
@router.get("/hospitals/{hospital_id}/reviews",response_model=list[ReviewResponse])
def hospital_reviews(hospital_id:str,db:Session=Depends(get_db)): return db.scalars(select(Review).where(Review.hospital_id==hospital_id).order_by(Review.created_at.desc())).all()
@router.post("/hospitals/{hospital_id}/reviews",response_model=ReviewResponse,status_code=201)
def hospital_review(hospital_id:str,data:ReviewCreate,user:User=Depends(get_current_user),db:Session=Depends(get_db)): return create_review(db,user,"hospital",hospital_id,data)
@router.get("/doctors/{doctor_id}/reviews",response_model=list[ReviewResponse])
def doctor_reviews(doctor_id:str,db:Session=Depends(get_db)): return db.scalars(select(Review).where(Review.doctor_id==doctor_id).order_by(Review.created_at.desc())).all()
@router.post("/doctors/{doctor_id}/reviews",response_model=ReviewResponse,status_code=201)
def doctor_review(doctor_id:str,data:ReviewCreate,user:User=Depends(get_current_user),db:Session=Depends(get_db)): return create_review(db,user,"doctor",doctor_id,data)

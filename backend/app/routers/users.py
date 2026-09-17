from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserUpdate,UserProfile
router=APIRouter(prefix="/users",tags=["Users"])
@router.get("/me",response_model=UserProfile)
def profile(user:User=Depends(get_current_user)): return user
@router.patch("/me",response_model=UserProfile)
def update(data:UserUpdate,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    for k,v in data.model_dump(exclude_unset=True).items(): setattr(user,k,v)
    db.commit(); db.refresh(user); return user

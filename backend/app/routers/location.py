from fastapi import APIRouter,HTTPException
from app.schemas.location import ReverseGeocodeResponse
from app.services.location_service import reverse_geocode
router=APIRouter(prefix="/location",tags=["Location"])
@router.get("/reverse-geocode",response_model=ReverseGeocodeResponse)
async def reverse(latitude:float,longitude:float):
    try: return await reverse_geocode(latitude,longitude)
    except Exception as e: raise HTTPException(502,"Unable to resolve this location right now")

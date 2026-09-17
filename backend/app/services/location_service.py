from math import radians, sin, cos, sqrt, atan2
from urllib.parse import quote
import httpx

def haversine_km(lat1, lon1, lat2, lon2):
    r=6371.0
    dlat=radians(lat2-lat1); dlon=radians(lon2-lon1)
    a=sin(dlat/2)**2+cos(radians(lat1))*cos(radians(lat2))*sin(dlon/2)**2
    return 2*r*atan2(sqrt(a),sqrt(1-a))

async def reverse_geocode(latitude: float, longitude: float):
    url=f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={latitude}&lon={longitude}"
    async with httpx.AsyncClient(timeout=8, headers={"User-Agent":"MediTrust/1.0"}) as client:
        response=await client.get(url); response.raise_for_status(); data=response.json()
    a=data.get("address",{})
    return {"city": a.get("city") or a.get("town") or a.get("village"), "state": a.get("state"), "country": a.get("country"), "formatted_address": data.get("display_name", "")}

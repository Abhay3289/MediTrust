from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.hospital import Hospital
from app.models.stay import Stay, StayRequest
from app.models.user import User
from app.schemas.stay import StayRequestCreate, StayRequestResponse
from app.services.google_places_service import nearby_accommodations
from app.services.live_stay_service import LivePreferences, rank_live_stays
from app.services.location_service import haversine_km
from app.services.stay_service import (
    StayPreferences,
    pick_room,
    recommend,
    serialize_hospital,
    serialize_stay,
    total_cost,
)


router = APIRouter(
    prefix="/stays",
    tags=["Patient Stays"],
)


# =========================================================
# EXISTING MEDISTRUST STAYS
# =========================================================

@router.get("")
def list_stays(
    hospital_id: str | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(Stay)

    if hospital_id:
        stmt = stmt.where(
            Stay.near_hospital_id == hospital_id
        )

    stays = db.scalars(
        stmt.order_by(Stay.price_per_day)
    ).all()

    return [serialize_stay(stay) for stay in stays]


# =========================================================
# RECOMMENDATIONS (MAP + BEST STAY / ROOM)
# =========================================================

@router.get("/recommend")
def recommend_stays(
    hospital_id: str | None = None,
    budget_per_day: int | None = Query(None, ge=0, le=100000),
    nights: int = Query(3, ge=1, le=365),
    guests: int = Query(1, ge=1, le=10),
    include_food: bool = True,
    need_caregiver: bool = False,
    need_accessible: bool = False,
    need_ac: bool = False,
    max_distance_km: float = Query(5, gt=0, le=50),
    db: Session = Depends(get_db),
):
    """
    Rank MediTrust stays for a patient and pick the best room in each.

    Without hospital_id every stay is scored against its own hospital.
    """
    stmt = select(Stay)
    hospital = None

    if hospital_id:
        hospital = db.get(Hospital, hospital_id)
        if not hospital:
            raise HTTPException(status_code=404, detail="Hospital not found")
        stmt = stmt.where(Stay.near_hospital_id == hospital_id)

    stays = db.scalars(stmt).all()
    hospitals = {
        h.id: h
        for h in db.scalars(
            select(Hospital).where(
                Hospital.id.in_({s.near_hospital_id for s in stays})
            )
        ).all()
    }

    prefs = StayPreferences(
        budget_per_day=budget_per_day or None,
        nights=nights,
        guests=guests,
        include_food=include_food,
        need_caregiver=need_caregiver,
        need_accessible=need_accessible,
        need_ac=need_ac,
        max_distance_km=max_distance_km,
    )

    return {
        "hospital": serialize_hospital(hospital) if hospital else None,
        "preferences": prefs.__dict__,
        "stays": recommend(stays, hospitals, prefs),
    }


# =========================================================
# LIVE STAYS NEAR ANY HOSPITAL LOCATION (GOOGLE PLACES)
# =========================================================

@router.get("/live")
async def live_stays(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(5, gt=0, le=25),
    budget_per_day: int | None = Query(None, ge=0, le=100000),
    nights: int = Query(3, ge=1, le=365),
    guests: int = Query(1, ge=1, le=10),
    affordable_only: bool = False,
):
    """
    Real PGs, hostels, dharamshalas, guest houses and hotels around a
    hospital's coordinates, ranked by price, distance and rating.

    Works for Google hospitals too, which are not in the MediTrust database.
    Prices are estimates (see live_stay_service).
    """
    try:
        places = await nearby_accommodations(
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Unable to fetch nearby stays from Google right now. Please try again.",
        )

    prefs = LivePreferences(
        radius_km=radius_km,
        budget_per_day=budget_per_day or None,
        nights=nights,
        guests=guests,
    )
    stays = rank_live_stays(places, latitude, longitude, prefs)
    if affordable_only:
        stays = [s for s in stays if s["is_affordable"]]
        for i, stay in enumerate(stays, start=1):
            stay["rank"] = i
            stay["is_best_match"] = i == 1

    return {
        "center": {"latitude": latitude, "longitude": longitude},
        "preferences": prefs.__dict__,
        "count": len(stays),
        "stays": stays,
    }


# =========================================================
# STAY REQUESTS
# =========================================================

def _request_response(req: StayRequest) -> dict:
    return {
        **{c.name: getattr(req, c.name) for c in StayRequest.__table__.columns},
        "stay_name": req.stay.name,
        "stay_address": req.stay.address,
        "stay_contact": req.stay.contact,
    }


@router.post(
    "/requests",
    response_model=StayRequestResponse,
    status_code=201,
)
def create_stay_request(
    data: StayRequestCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stay = db.get(Stay, data.stay_id)
    if not stay:
        raise HTTPException(status_code=404, detail="Stay not found")

    prefs = StayPreferences(
        nights=data.nights,
        guests=data.guests,
        include_food=data.include_food,
    )
    _, rooms = pick_room(stay, prefs)
    room = next((r for r in rooms if r["type"] == data.room_type), None)

    if not room:
        raise HTTPException(status_code=422, detail="Selected room type does not exist for this stay")
    if not room["fits_group"]:
        raise HTTPException(status_code=422, detail=f"{room['type']} has only {room['beds']} bed(s) for {data.guests} guest(s)")
    if not room["is_available"]:
        raise HTTPException(status_code=409, detail=f"{room['type']} is fully booked right now")

    req = StayRequest(
        user_id=user.id,
        stay_id=stay.id,
        hospital_id=stay.near_hospital_id,
        room_type=room["type"],
        check_in=data.check_in,
        nights=data.nights,
        guests=data.guests,
        include_food=data.include_food,
        contact_name=data.contact_name.strip(),
        contact_phone=data.contact_phone,
        notes=(data.notes or "").strip() or None,
        estimated_cost=total_cost(stay, room, prefs),
        status="pending",
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return _request_response(req)


@router.get(
    "/requests/me",
    response_model=list[StayRequestResponse],
)
def my_stay_requests(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    requests = db.scalars(
        select(StayRequest)
        .where(StayRequest.user_id == user.id)
        .order_by(StayRequest.created_at.desc())
    ).all()
    return [_request_response(r) for r in requests]


@router.patch(
    "/requests/{request_id}/cancel",
    response_model=StayRequestResponse,
)
def cancel_stay_request(
    request_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    req = db.get(StayRequest, request_id)
    if not req or req.user_id != user.id:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status == "cancelled":
        raise HTTPException(status_code=409, detail="Request is already cancelled")
    if req.check_in < date.today():
        raise HTTPException(status_code=409, detail="Past requests cannot be cancelled")
    req.status = "cancelled"
    db.commit()
    db.refresh(req)
    return _request_response(req)


# =========================================================
# NEARBY MEDISTRUST + REAL-WORLD ACCOMMODATION
# =========================================================

@router.get("/nearby")
async def nearby_stays(
    hospital_id: str,
    radius_km: float = Query(
        10,
        gt=0,
        le=50,
    ),
    db: Session = Depends(get_db),
):
    """
    Returns:

    1. MediTrust database stays near the hospital.
    2. Real-world accommodation from Google Places.

    External Google Places listings are NOT MediTrust verified.
    """

    # -----------------------------------------------------
    # FIND HOSPITAL
    # -----------------------------------------------------

    hospital = db.get(
        Hospital,
        hospital_id,
    )

    if not hospital:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found",
        )

    hospital_lat = hospital.latitude
    hospital_lon = hospital.longitude

    result = []

    # -----------------------------------------------------
    # 1. MEDISTRUST DATABASE STAYS
    # -----------------------------------------------------

    db_stays = db.scalars(
        select(Stay)
        .where(
            Stay.near_hospital_id == hospital_id
        )
        .order_by(Stay.price_per_day)
    ).all()

    for stay in db_stays:
        distance = (
            haversine_km(hospital_lat, hospital_lon, stay.latitude, stay.longitude)
            if stay.latitude is not None and stay.longitude is not None
            else stay.distance_from_hospital
        )
        result.append(
            {
                **serialize_stay(stay),
                "distance_from_hospital": round(distance, 2),
                "distance_text": f"{distance:.1f} km away",
                "source": "meditrust",
                "is_meditrust_listed": True,
                "google_maps_url": None,
                "rating": None,
                "reviews_count": len(stay.reviews or []),
            }
        )

    # -----------------------------------------------------
    # 2. GOOGLE REAL-WORLD ACCOMMODATION
    # -----------------------------------------------------

    try:
        places = await nearby_accommodations(
            latitude=hospital_lat,
            longitude=hospital_lon,
            radius_km=radius_km,
        )
    except Exception:
        # If Google Places temporarily fails, still return
        # MediTrust database stays instead of breaking page.
        places = []

    # -----------------------------------------------------
    # ADD GOOGLE RESULTS
    # -----------------------------------------------------

    existing_names = {
        stay.name.strip().lower()
        for stay in db_stays
        if stay.name
    }

    for place in places:
        location = place.get(
            "location",
            {},
        )

        place_lat = location.get("latitude")
        place_lon = location.get("longitude")

        if place_lat is None or place_lon is None:
            continue

        distance = haversine_km(
            hospital_lat,
            hospital_lon,
            place_lat,
            place_lon,
        )

        if distance > radius_km:
            continue

        display_name = (
            place.get("displayName", {})
            .get("text")
            or "Accommodation"
        )

        # Avoid duplicate if same accommodation already
        # exists in MediTrust database.
        if display_name.strip().lower() in existing_names:
            continue

        place_types = place.get(
            "types",
            [],
        )

        primary_type = place.get(
            "primaryType"
        )

        if primary_type:
            accommodation_type = primary_type.replace(
                "_",
                " ",
            ).title()
        elif place_types:
            accommodation_type = place_types[0].replace(
                "_",
                " ",
            ).title()
        else:
            accommodation_type = "Nearby Accommodation"

        result.append(
            {
                "id": f"google-{place.get('id')}",
                "name": display_name,
                "type": accommodation_type,
                "near_hospital_id": hospital_id,
                "address": place.get(
                    "formattedAddress"
                ),
                "latitude": place_lat,
                "longitude": place_lon,
                "distance_from_hospital": round(
                    distance,
                    2,
                ),
                "distance_text": (
                    f"{distance:.1f} km away"
                ),
                "verified": False,

                # Google does not necessarily provide
                # patient-stay pricing, so don't invent it.
                "price_per_day": None,
                "food_per_day": None,
                "mandatory_charges": None,

                "long_stay_support": False,
                "caregiver_friendly": False,
                "accessible": False,
                "facilities": [],

                "contact": None,
                "overview": None,
                "stay_breakdown": {},

                "source": "google_places",
                "is_meditrust_listed": False,

                "google_maps_url": place.get(
                    "googleMapsUri"
                ),

                "rating": place.get(
                    "rating"
                ),

                "reviews_count": place.get(
                    "userRatingCount",
                    0,
                ),
            }
        )

    # -----------------------------------------------------
    # SORT BY DISTANCE
    # -----------------------------------------------------

    result.sort(
        key=lambda stay: (
            stay.get(
                "distance_from_hospital"
            )
            if stay.get(
                "distance_from_hospital"
            ) is not None
            else float("inf")
        )
    )

    return result

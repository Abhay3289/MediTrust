from math import ceil

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import func, or_, select, String, cast
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.hospital import Hospital
from app.schemas.hospital import (
    HospitalResponse,
    PaginatedHospitals,
    HospitalBase,
)
from app.schemas.location import NearbyHospital
from app.services.location_service import haversine_km
from app.core.dependencies import get_current_user
from app.models.user import User

from app.services.google_places_service import (
    nearby_hospitals as google_nearby_hospitals,
    search_hospitals as google_search_hospitals,
)


router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


# =========================================================
# HELPER
# =========================================================

def out(h, d=None):
    return HospitalResponse.model_validate(
        {
            **{
                c: getattr(h, c)
                for c in [
                    "id",
                    "name",
                    "tagline",
                    "type",
                    "address",
                    "city",
                    "phone",
                    "emergency_hotline",
                    "website",
                    "opening_hours",
                    "latitude",
                    "longitude",
                    "rating",
                    "reviews_count",
                    "hospital_verified",
                    "quality_accreditation",
                    "is_24x7_emergency",
                    "has_pediatrics",
                    "has_diagnostics",
                    "er_wait_time",
                    "specialties",
                    "facilities",
                    "trust_breakdown",
                    "overview",
                ]
            },
            "distance": d,
            "distance_text": (
                f"{d:.1f} km away" if d is not None else None
            ),
        }
    )


# =========================================================
# GET ALL HOSPITALS
# =========================================================

@router.get("", response_model=PaginatedHospitals)
def list_hospitals(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    location: str | None = None,
    specialty: str | None = None,
    rating: float | None = None,
    emergency: bool | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(Hospital)

    # Location filter
    if location:
        stmt = stmt.where(
            Hospital.city.ilike(f"%{location}%")
        )

    # Specialty filter
    if specialty and specialty.strip():
        stmt = stmt.where(
            cast(Hospital.specialties, String).ilike(
                f"%{specialty.strip()}%"
            )
        )

    # Rating filter
    if rating is not None:
        stmt = stmt.where(
            Hospital.rating >= rating
        )

    # Emergency filter
    if emergency is not None:
        stmt = stmt.where(
            Hospital.is_24x7_emergency == emergency
        )

    # Total count
    total = (
        db.scalar(
            select(func.count())
            .select_from(stmt.subquery())
        )
        or 0
    )

    # Paginated results
    rows = db.scalars(
        stmt
        .order_by(Hospital.rating.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()

    return {
        "items": [out(h) for h in rows],
        "page": page,
        "limit": limit,
        "total": total,
        "pages": ceil(total / limit) if total else 0,
    }


# =========================================================
# SEARCH HOSPITALS
# =========================================================

@router.get("/search", response_model=list[HospitalResponse])
def search_hospitals(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    query = q.strip()

    if not query:
        return []

    pattern = f"%{query}%"

    rows = db.scalars(
        select(Hospital)
        .where(
            or_(
                Hospital.name.ilike(pattern),
                Hospital.city.ilike(pattern),
                Hospital.address.ilike(pattern),
                cast(
                    Hospital.specialties,
                    String
                ).ilike(pattern),
            )
        )
        .order_by(Hospital.rating.desc())
        .limit(50)
    ).all()

    return [out(h) for h in rows]


# =========================================================
# NEARBY HOSPITALS
# =========================================================

@router.get(
    "/nearby",
    response_model=list[HospitalResponse],
)
def nearby_hospitals(
    latitude: float,
    longitude: float,
    radius_km: float = Query(
        25,
        gt=0,
        le=200,
    ),
    specialty: str | None = Query(
        None
    ),
    db: Session = Depends(get_db),
):
    """
    Returns hospitals within the requested radius.

    Default:
        radius = 25 km

    Optional:
        specialty = Cardiology
        specialty = Pediatrics
        specialty = Dermatology
        etc.
    """

    # Start with all hospitals
    stmt = select(Hospital)

    # -----------------------------------------------------
    # SPECIALTY FILTER
    # -----------------------------------------------------

    if specialty and specialty.strip():
        specialty_pattern = (
            f"%{specialty.strip()}%"
        )

        stmt = stmt.where(
            cast(
                Hospital.specialties,
                String,
            ).ilike(
                specialty_pattern
            )
        )

    hospitals = db.scalars(stmt).all()

    result = []

    # -----------------------------------------------------
    # DISTANCE FILTER
    # -----------------------------------------------------

    for hospital in hospitals:

        distance = haversine_km(
            latitude,
            longitude,
            hospital.latitude,
            hospital.longitude,
        )

        # Only hospitals inside selected radius
        if distance <= radius_km:

            result.append(
                out(
                    hospital,
                    round(distance, 2),
                )
            )

    # -----------------------------------------------------
    # NEAREST FIRST
    # -----------------------------------------------------

    result.sort(
        key=lambda hospital: (
            hospital.distance
            if hospital.distance is not None
            else float("inf")
        )
    )

    return result
# ============================================
# GOOGLE REAL HOSPITALS - NEARBY
# =========================================================

@router.get("/real/nearby")
async def real_nearby_hospitals(
    latitude: float,
    longitude: float,
    radius_km: float = Query(
        25,
        gt=0,
        le=50,
    ),
):
    places = await google_nearby_hospitals(
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
    )

    result = []

    for place in places:
        location = place.get("location", {})

        result.append(
            {
                "id": place.get("id"),
                "name": place.get(
                    "displayName", {}
                ).get("text", "Hospital"),
                "address": place.get(
                    "formattedAddress"
                ),
                "latitude": location.get(
                    "latitude"
                ),
                "longitude": location.get(
                    "longitude"
                ),
                "rating": place.get("rating"),
                "reviews_count": place.get(
                    "userRatingCount", 0
                ),
                "google_maps_url": place.get(
                    "googleMapsUri"
                ),
                "source": "google",
            }
        )

    return result

# =========================================================
# GOOGLE REAL HOSPITALS - SEARCH
# =========================================================

@router.get("/real/search")
async def real_search_hospitals(
    q: str = Query(..., min_length=1),
    latitude: float | None = None,
    longitude: float | None = None,
    radius_km: float = Query(
        25,
        gt=0,
        le=50,
    ),
):
    places = await google_search_hospitals(
        query=q,
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
    )

    result = []

    for place in places:
        location = place.get("location", {})

        result.append(
            {
                "id": place.get("id"),
                "name": place.get(
                    "displayName", {}
                ).get("text", "Hospital"),
                "address": place.get(
                    "formattedAddress"
                ),
                "latitude": location.get(
                    "latitude"
                ),
                "longitude": location.get(
                    "longitude"
                ),
                "rating": place.get("rating"),
                "reviews_count": place.get(
                    "userRatingCount", 0
                ),
                "google_maps_url": place.get(
                    "googleMapsUri"
                ),
                "source": "google",
            }
        )

    return result
# =========================================================
# EMERGENCY NEARBY
# =========================================================

@router.get(
    "/emergency/nearby",
    response_model=list[NearbyHospital],
)
def emergency_nearby(
    latitude: float,
    longitude: float,
    radius_km: float = Query(
        25,
        gt=0,
        le=200,
    ),
    db: Session = Depends(get_db),
):
    hospitals = db.scalars(
        select(Hospital)
    ).all()

    result = []

    for hospital in hospitals:

        if not hospital.is_24x7_emergency:
            continue

        distance = haversine_km(
            latitude,
            longitude,
            hospital.latitude,
            hospital.longitude,
        )

        if distance <= radius_km:

            result.append(
                {
                    "id": hospital.id,
                    "name": hospital.name,
                    "address": hospital.address,
                    "city": hospital.city,
                    "latitude": hospital.latitude,
                    "longitude": hospital.longitude,
                    "distance_km": round(
                        distance,
                        2,
                    ),
                    "is_24x7_emergency": (
                        hospital.is_24x7_emergency
                    ),
                    "rating": hospital.rating,
                }
            )

    # Nearest first
    result.sort(
        key=lambda x: x["distance_km"]
    )

    return result


# =========================================================
# GET SINGLE HOSPITAL
# =========================================================

@router.get(
    "/{hospital_id}",
    response_model=HospitalResponse,
)
def get_hospital(
    hospital_id: str,
    db: Session = Depends(get_db),
):
    hospital = db.get(
        Hospital,
        hospital_id,
    )

    if not hospital:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found",
        )

    return out(hospital)


# =========================================================
# CREATE HOSPITAL
# =========================================================

@router.post(
    "",
    response_model=HospitalResponse,
    status_code=201,
)
def create_hospital(
    data: HospitalBase,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != "caregiver":
        raise HTTPException(
            status_code=403,
            detail=(
                "Only authorized users can "
                "create hospital records"
            ),
        )

    import uuid

    hospital = Hospital(
        id=f"hosp-{uuid.uuid4().hex[:10]}",
        **data.model_dump(),
    )

    db.add(hospital)
    db.commit()
    db.refresh(hospital)

    return out(hospital)


# =========================================================
# UPDATE HOSPITAL
# =========================================================

@router.patch(
    "/{hospital_id}",
    response_model=HospitalResponse,
)
def update_hospital(
    hospital_id: str,
    data: HospitalBase,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != "caregiver":
        raise HTTPException(
            status_code=403,
            detail=(
                "Only authorized users can "
                "update hospital records"
            ),
        )

    hospital = db.get(
        Hospital,
        hospital_id,
    )

    if not hospital:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found",
        )

    for key, value in data.model_dump().items():
        setattr(
            hospital,
            key,
            value,
        )

    db.commit()
    db.refresh(hospital)

    return out(hospital)


# =========================================================
# DELETE HOSPITAL
# =========================================================

@router.delete(
    "/{hospital_id}"
)
def delete_hospital(
    hospital_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != "caregiver":
        raise HTTPException(
            status_code=403,
            detail=(
                "Only authorized users can "
                "delete hospital records"
            ),
        )

    hospital = db.get(
        Hospital,
        hospital_id,
    )

    if not hospital:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found",
        )

    db.delete(hospital)
    db.commit()

    return {
        "message": "Hospital deleted"
    }
"""Patient stay recommendation engine.

Scores every stay (0-100) against the patient's needs and picks the best room
inside it. Weights are published so the ranking stays explainable:

    distance 30 | budget 25 | needs 20 | quality 15 | availability 10
"""
from dataclasses import dataclass

from app.models.hospital import Hospital
from app.models.stay import Stay
from app.services.location_service import haversine_km

WEIGHTS = {"distance": 30, "budget": 25, "needs": 20, "quality": 15, "availability": 10}

# Same weights the frontend Stay Score uses (utils/stayEngine.js).
QUALITY_WEIGHTS = {
    "hospitalDistance": 0.20,
    "longStaySupport": 0.20,
    "priceTransparency": 0.20,
    "verificationHygiene": 0.15,
    "caregiverSupport": 0.10,
    "accessibility": 0.10,
    "patientExperience": 0.05,
}

LONG_STAY_NIGHTS = 7


@dataclass
class StayPreferences:
    budget_per_day: int | None = None
    nights: int = 3
    guests: int = 1
    include_food: bool = True
    need_caregiver: bool = False
    need_accessible: bool = False
    need_ac: bool = False
    max_distance_km: float = 5.0


def stay_distance_km(stay: Stay, hospital: Hospital | None) -> float:
    if hospital and stay.latitude is not None and stay.longitude is not None:
        return round(haversine_km(hospital.latitude, hospital.longitude, stay.latitude, stay.longitude), 2)
    return stay.distance_from_hospital


def quality_score(stay: Stay) -> int:
    breakdown = stay.stay_breakdown or {}
    return round(sum((breakdown.get(k) or 0) * w for k, w in QUALITY_WEIGHTS.items()))


def default_rooms(stay: Stay) -> list[dict]:
    return [{
        "type": "Standard Room",
        "beds": 2,
        "price_per_day": stay.price_per_day,
        "ac": False,
        "attached_bathroom": True,
        "accessible": stay.accessible,
        "available": 1,
    }]


def daily_cost(stay: Stay, room: dict, prefs: StayPreferences) -> int:
    food = stay.food_per_day * prefs.guests if prefs.include_food else 0
    return room["price_per_day"] + food


def total_cost(stay: Stay, room: dict, prefs: StayPreferences) -> int:
    return daily_cost(stay, room, prefs) * prefs.nights + stay.mandatory_charges


def _room_score(stay: Stay, room: dict, prefs: StayPreferences) -> float:
    score = 0.0
    if prefs.budget_per_day:
        over = daily_cost(stay, room, prefs) - prefs.budget_per_day
        score += 50 if over <= 0 else max(0, 50 - over / prefs.budget_per_day * 100)
    else:
        score += 50 - min(room["price_per_day"], 5000) / 100
    score += 15 if room.get("attached_bathroom") else 0
    if room.get("ac"):
        score += 15 if prefs.need_ac else 5
    if prefs.need_accessible and room.get("accessible"):
        score += 20
    # Prefer rooms that fit the group without too many unused beds.
    score += max(0, 10 - (room["beds"] - prefs.guests) * 4)
    return score


def pick_room(stay: Stay, prefs: StayPreferences) -> tuple[dict | None, list[dict]]:
    """Return (best room, all rooms annotated with fit info)."""
    rooms = stay.room_options or default_rooms(stay)
    annotated = []
    for room in rooms:
        fits = room["beds"] >= prefs.guests
        available = room.get("available", 0) > 0
        annotated.append({
            **room,
            "fits_group": fits,
            "is_available": available,
            "daily_cost": daily_cost(stay, room, prefs),
            "total_cost": total_cost(stay, room, prefs),
            "recommended": False,
        })
    candidates = [r for r in annotated if r["fits_group"] and r["is_available"]]
    if prefs.need_accessible:
        candidates = [r for r in candidates if r.get("accessible")] or candidates
    if prefs.need_ac:
        candidates = [r for r in candidates if r.get("ac")] or candidates
    if not candidates:
        return None, annotated
    best = max(candidates, key=lambda r: (_room_score(stay, r, prefs), -r["price_per_day"]))
    best["recommended"] = True
    return best, annotated


def score_stay(stay: Stay, hospital: Hospital | None, prefs: StayPreferences) -> dict:
    distance = stay_distance_km(stay, hospital)
    room, rooms = pick_room(stay, prefs)
    reasons: list[str] = []
    warnings: list[str] = []
    parts: dict[str, float] = {}

    # Distance: full marks at the door, zero at 2x the allowed distance.
    limit = max(prefs.max_distance_km, 0.5)
    parts["distance"] = max(0.0, 1 - distance / (limit * 2))
    walk_minutes = round(distance / 5 * 60)
    if distance <= 1:
        reasons.append(f"Only {distance:.1f} km from the hospital (about {walk_minutes} min walk)")
    elif distance <= limit:
        reasons.append(f"{distance:.1f} km from the hospital, within your {limit:g} km limit")
    else:
        warnings.append(f"{distance:.1f} km away, beyond your {limit:g} km limit")

    # Budget, judged on the recommended room.
    if room is None:
        parts["budget"] = 0.0
    elif prefs.budget_per_day:
        per_day = room["daily_cost"]
        if per_day <= prefs.budget_per_day:
            parts["budget"] = 0.7 + 0.3 * (1 - per_day / prefs.budget_per_day)
            reasons.append(f"₹{per_day:,}/day fits your ₹{prefs.budget_per_day:,} budget")
        else:
            over = per_day - prefs.budget_per_day
            parts["budget"] = max(0.0, 0.7 - over / prefs.budget_per_day)
            warnings.append(f"₹{over:,}/day over your budget")
    else:
        parts["budget"] = max(0.0, 1 - room["daily_cost"] / 6000)

    # Needs.
    needs, met = 0, 0
    if prefs.need_caregiver:
        needs += 1
        if stay.caregiver_friendly:
            met += 1
            reasons.append("Caregiver-friendly")
        else:
            warnings.append("Not marked caregiver-friendly")
    if prefs.need_accessible:
        needs += 1
        if stay.accessible:
            met += 1
            reasons.append("Wheelchair accessible")
        else:
            warnings.append("Not wheelchair accessible")
    if prefs.nights >= LONG_STAY_NIGHTS:
        needs += 1
        if stay.long_stay_support:
            met += 1
            reasons.append(f"Supports long stays ({prefs.nights} nights)")
        else:
            warnings.append("No long-stay support")
    if prefs.need_ac:
        needs += 1
        if room and room.get("ac"):
            met += 1
            reasons.append("AC room available")
        else:
            warnings.append("No AC room available for your group")
    parts["needs"] = met / needs if needs else 1.0

    quality = quality_score(stay)
    parts["quality"] = quality / 100
    if stay.verified:
        reasons.append("MediTrust verified")

    if room is None:
        parts["availability"] = 0.0
        warnings.append(f"No free room for {prefs.guests} guest(s) right now")
    else:
        free = sum(r.get("available", 0) for r in rooms if r["fits_group"])
        parts["availability"] = min(1.0, free / 3)
        if free <= 1:
            warnings.append("Only 1 matching room left")

    match_score = round(sum(parts[k] * w for k, w in WEIGHTS.items()))
    if room is None:
        match_score = min(match_score, 40)

    return {
        "match_score": match_score,
        "score_breakdown": {k: round(parts[k] * w, 1) for k, w in WEIGHTS.items()},
        "distance_km": distance,
        "distance_text": f"{distance:.1f} km from hospital",
        "walk_minutes": walk_minutes,
        "within_distance": distance <= limit,
        "quality_score": quality,
        "recommended_room": room,
        "rooms": rooms,
        "reasons": reasons,
        "warnings": warnings,
    }


def serialize_stay(stay: Stay) -> dict:
    return {
        "id": stay.id,
        "name": stay.name,
        "type": stay.type,
        "near_hospital_id": stay.near_hospital_id,
        "address": stay.address,
        "latitude": stay.latitude,
        "longitude": stay.longitude,
        "distance_from_hospital": stay.distance_from_hospital,
        "distance_text": f"{stay.distance_from_hospital:.1f} km from hospital",
        "verified": stay.verified,
        "price_per_day": stay.price_per_day,
        "food_per_day": stay.food_per_day,
        "mandatory_charges": stay.mandatory_charges,
        "long_stay_support": stay.long_stay_support,
        "caregiver_friendly": stay.caregiver_friendly,
        "accessible": stay.accessible,
        "facilities": stay.facilities or [],
        "room_options": stay.room_options or default_rooms(stay),
        "reviews": stay.reviews or [],
        "contact": stay.contact,
        "overview": stay.overview,
        "stay_breakdown": stay.stay_breakdown or {},
    }


def serialize_hospital(hospital: Hospital) -> dict:
    return {
        "id": hospital.id,
        "name": hospital.name,
        "address": hospital.address,
        "latitude": hospital.latitude,
        "longitude": hospital.longitude,
    }


def recommend(stays: list[Stay], hospitals: dict[str, Hospital], prefs: StayPreferences) -> list[dict]:
    results = []
    for stay in stays:
        hospital = hospitals.get(stay.near_hospital_id)
        results.append({
            **serialize_stay(stay),
            **score_stay(stay, hospital, prefs),
            "hospital": serialize_hospital(hospital) if hospital else None,
        })
    results.sort(key=lambda r: (-r["match_score"], r["distance_km"]))
    for rank, r in enumerate(results, start=1):
        r["rank"] = rank
        r["is_best_match"] = rank == 1 and r["recommended_room"] is not None
    return results

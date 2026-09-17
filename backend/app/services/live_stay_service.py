"""Real-world (Google Places) stays near any hospital location.

Google does not publish room prices for most lodging, so every price here is
an *estimate* in INR per room per night, derived from the place type, its name
and Google's price level. The response always flags this with
``price_is_estimate`` so the UI can tell patients to confirm with the owner.

Ranking (0-100) favours what a patient's family usually needs most:
    affordability 45% · distance 35% · rating 20%
"""

from dataclasses import dataclass

from app.services.location_service import haversine_km


WEIGHTS = {"price": 0.45, "distance": 0.35, "rating": 0.20}
WALK_KMPH = 4.8

# (min, max) INR per night.
PRICE_BY_PRICE_LEVEL = {
    "PRICE_LEVEL_FREE": (0, 0),
    "PRICE_LEVEL_INEXPENSIVE": (500, 1500),
    "PRICE_LEVEL_MODERATE": (1500, 3500),
    "PRICE_LEVEL_EXPENSIVE": (3500, 8000),
    "PRICE_LEVEL_VERY_EXPENSIVE": (8000, 20000),
}

# Checked in order against the lower-cased name; first match wins.
PRICE_BY_NAME = [
    (("dharamshala", "dharamsala", "dharamshal", "sarai", "rain basera", "ashram", "shelter", "sewa sadan", "seva sadan"), "Dharamshala / Shelter", (100, 600)),
    (("paying guest", " pg ", " p.g"), "PG", (300, 900)),
    (("hostel", "dormitory", "dorm"), "Hostel", (300, 1000)),
    (("homestay", "home stay", "guest house", "guesthouse", "lodge"), "Guest House", (700, 1800)),
    (("oyo", "fabhotel", "treebo", "zostel", "capital o", "collection o", "townhouse"), "Budget Hotel", (800, 2000)),
    ((" taj ", "oberoi", "leela", "marriott", "hyatt", "radisson", " itc ", " jw ", "hilton", "sheraton", "novotel", "westin", "le meridien", "pullman", "crowne plaza", "holiday inn", "courtyard"), "Premium Hotel", (6000, 18000)),
    (("resort",), "Resort", (4000, 12000)),
    (("service apartment", "serviced apartment", "apartment", "residency", "suites"), "Service Apartment", (1500, 3500)),
]

PRICE_BY_TYPE = {
    "hostel": ("Hostel", (300, 1000)),
    "guest_house": ("Guest House", (700, 1800)),
    "bed_and_breakfast": ("Guest House", (900, 2200)),
    "farmstay": ("Homestay", (900, 2200)),
    "private_guest_room": ("Guest House", (700, 1800)),
    "motel": ("Budget Hotel", (900, 2000)),
    "budget_japanese_inn": ("Budget Hotel", (900, 2000)),
    "inn": ("Budget Hotel", (900, 2200)),
    "extended_stay_hotel": ("Long-Stay Residence", (1200, 3000)),
    "cottage": ("Homestay", (1200, 3000)),
    "campground": ("Budget Stay", (300, 1000)),
    "hotel": ("Hotel", (1500, 4000)),
    "resort_hotel": ("Resort", (4000, 12000)),
    "lodging": ("Lodging", (1000, 2500)),
}

DEFAULT_TYPE = ("Lodging", (1000, 2500))

# Place types that show up in text searches but are not somewhere to sleep.
NOT_LODGING = {"hospital", "doctor", "school", "university", "restaurant", "store", "place_of_worship"}


@dataclass
class LivePreferences:
    radius_km: float = 5
    budget_per_day: int | None = None
    nights: int = 3
    guests: int = 1


def _padded_name(place: dict) -> str:
    # Spaces around the name let keywords like " pg " match whole words.
    name = ((place.get("displayName") or {}).get("text") or "").lower()
    return f" {''.join(c if c.isalnum() or c == '.' else ' ' for c in name)} "


def estimate_price(place: dict) -> tuple[str, int, int]:
    """Return (stay type label, min, max) INR per night for one room."""
    name = _padded_name(place)
    for keywords, label, price in PRICE_BY_NAME:
        if any(k in name for k in keywords):
            break
    else:
        types = [place.get("primaryType")] + list(place.get("types") or [])
        label, price = next(
            (PRICE_BY_TYPE[t] for t in types if t in PRICE_BY_TYPE),
            DEFAULT_TYPE,
        )

    level = PRICE_BY_PRICE_LEVEL.get(place.get("priceLevel"))
    if level and label not in ("Dharamshala / Shelter", "PG", "Hostel"):
        price = level
    return label, price[0], price[1]


def is_lodging(place: dict) -> bool:
    types = set(place.get("types") or [])
    if place.get("primaryType") in NOT_LODGING:
        return False
    name = _padded_name(place)
    return "lodging" in types or bool(types & PRICE_BY_TYPE.keys()) or any(
        k in name for keywords, _, _ in PRICE_BY_NAME for k in keywords
    )


def rooms_needed(guests: int) -> int:
    # Assume two people share one room.
    return max(1, -(-guests // 2))


def _price_score(avg_price: int, prefs: LivePreferences) -> float:
    if prefs.budget_per_day:
        if avg_price <= prefs.budget_per_day:
            return 100
        over = (avg_price - prefs.budget_per_day) / prefs.budget_per_day
        return max(0.0, 100 - over * 120)
    # No budget given: cheaper is better, ₹5000+/night scores 0.
    return max(0.0, 100 - avg_price / 50)


def build_live_stay(place: dict, hospital_lat: float, hospital_lon: float, prefs: LivePreferences) -> dict | None:
    location = place.get("location") or {}
    lat, lon = location.get("latitude"), location.get("longitude")
    if lat is None or lon is None or not is_lodging(place):
        return None

    distance = haversine_km(hospital_lat, hospital_lon, lat, lon)
    if distance > prefs.radius_km:
        return None

    label, price_min, price_max = estimate_price(place)
    rooms = rooms_needed(prefs.guests)
    daily_min, daily_max = price_min * rooms, price_max * rooms
    avg_daily = (daily_min + daily_max) // 2
    rating = place.get("rating")
    reviews = place.get("userRatingCount") or 0

    within_budget = prefs.budget_per_day is None or daily_min <= prefs.budget_per_day
    distance_score = max(0.0, 100 * (1 - distance / prefs.radius_km))
    # Few reviews => pull the rating towards a neutral 3.5.
    rating_score = (((rating or 3.5) * reviews + 3.5 * 5) / (reviews + 5)) / 5 * 100
    score = round(
        WEIGHTS["price"] * _price_score(avg_daily, prefs)
        + WEIGHTS["distance"] * distance_score
        + WEIGHTS["rating"] * rating_score
    )

    reasons, warnings = [], []
    if price_max <= 1500:
        reasons.append("Budget-friendly option")
    if distance <= 1:
        reasons.append("Walking distance to the hospital")
    if rating and rating >= 4 and reviews >= 20:
        reasons.append(f"Rated {rating} by {reviews} guests on Google")
    if prefs.budget_per_day and not within_budget:
        warnings.append("Likely above your budget")
    if not place.get("nationalPhoneNumber"):
        warnings.append("No phone number listed")

    return {
        "id": f"google-{place.get('id')}",
        "place_id": place.get("id"),
        "name": (place.get("displayName") or {}).get("text") or "Accommodation",
        "type": label,
        "address": place.get("formattedAddress"),
        "latitude": lat,
        "longitude": lon,
        "distance_km": round(distance, 2),
        "distance_text": f"{distance:.1f} km from hospital",
        "walk_minutes": max(1, round(distance / WALK_KMPH * 60)),
        "rating": rating,
        "reviews_count": reviews,
        "phone": place.get("nationalPhoneNumber"),
        "google_maps_url": place.get("googleMapsUri"),
        "price_min": price_min,
        "price_max": price_max,
        "rooms_needed": rooms,
        "daily_cost_min": daily_min,
        "daily_cost_max": daily_max,
        "total_cost_min": daily_min * prefs.nights,
        "total_cost_max": daily_max * prefs.nights,
        "price_is_estimate": True,
        "within_budget": within_budget,
        "is_affordable": daily_max <= 1500 * rooms,
        "match_score": score,
        "reasons": reasons,
        "warnings": warnings,
        "source": "google_places",
        "verified": False,
    }


def rank_live_stays(places: list[dict], hospital_lat: float, hospital_lon: float, prefs: LivePreferences) -> list[dict]:
    stays, seen = [], set()
    for p in places:
        stay = build_live_stay(p, hospital_lat, hospital_lon, prefs)
        # Google often lists the same property once per room/unit.
        key = stay and (stay["name"].lower(), round(stay["latitude"], 4), round(stay["longitude"], 4))
        if stay and key not in seen:
            seen.add(key)
            stays.append(stay)
    stays.sort(key=lambda s: (not s["within_budget"], -s["match_score"], s["distance_km"]))
    for i, stay in enumerate(stays, start=1):
        stay["rank"] = i
        stay["is_best_match"] = i == 1
    return stays

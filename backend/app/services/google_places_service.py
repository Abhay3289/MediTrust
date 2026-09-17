import asyncio
import time

import httpx

from app.core.config import settings


GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:searchNearby"
GOOGLE_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"

# Same area/query searched again shortly after (page reload, retry,
# another visitor nearby) reuses this instead of spending Google quota.
_CACHE_TTL_SECONDS = 600
_hospital_cache: dict[tuple, tuple[float, list]] = {}


def get_api_key():
    api_key = settings.google_maps_api_key

    if not api_key:
        raise RuntimeError("GOOGLE_MAPS_API_KEY is not configured")

    return api_key


# ---------------------------------------------------------
# HOSPITALS
# ---------------------------------------------------------

async def nearby_hospitals(
    latitude: float,
    longitude: float,
    radius_km: float = 25,
):
    cache_key = ("nearby", round(latitude, 3), round(longitude, 3), round(radius_km, 1))
    cached = _hospital_cache.get(cache_key)
    if cached and time.monotonic() - cached[0] < _CACHE_TTL_SECONDS:
        return cached[1]

    api_key = get_api_key()

    radius_meters = min(radius_km * 1000, 50000)

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": (
            "places.id,"
            "places.displayName,"
            "places.formattedAddress,"
            "places.location,"
            "places.rating,"
            "places.userRatingCount,"
            "places.googleMapsUri"
        ),
    }

    payload = {
        "includedTypes": ["hospital"],
        "maxResultCount": 20,
        "locationRestriction": {
            "circle": {
                "center": {
                    "latitude": latitude,
                    "longitude": longitude,
                },
                "radius": radius_meters,
            }
        },
    }

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            GOOGLE_PLACES_URL,
            headers=headers,
            json=payload,
        )

    response.raise_for_status()

    places = response.json().get("places", [])
    _hospital_cache[cache_key] = (time.monotonic(), places)
    return places


async def search_hospitals(
    query: str,
    latitude: float | None = None,
    longitude: float | None = None,
    radius_km: float = 25,
):
    cache_key = (
        "search",
        query.strip().lower(),
        round(latitude, 3) if latitude is not None else None,
        round(longitude, 3) if longitude is not None else None,
        round(radius_km, 1),
    )
    cached = _hospital_cache.get(cache_key)
    if cached and time.monotonic() - cached[0] < _CACHE_TTL_SECONDS:
        return cached[1]

    api_key = get_api_key()

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": (
            "places.id,"
            "places.displayName,"
            "places.formattedAddress,"
            "places.location,"
            "places.rating,"
            "places.userRatingCount,"
            "places.googleMapsUri"
        ),
    }

    text_query = query.strip()

    if "hospital" not in text_query.lower():
        text_query += " hospital"

    payload = {
        "textQuery": text_query,
        "pageSize": 20,
    }

    if latitude is not None and longitude is not None:
        payload["locationBias"] = {
            "circle": {
                "center": {
                    "latitude": latitude,
                    "longitude": longitude,
                },
                "radius": radius_km * 1000,
            }
        }

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            GOOGLE_TEXT_SEARCH_URL,
            headers=headers,
            json=payload,
        )

    response.raise_for_status()

    places = response.json().get("places", [])
    _hospital_cache[cache_key] = (time.monotonic(), places)
    return places


# ---------------------------------------------------------
# PATIENT STAY / NEARBY ACCOMMODATION
# ---------------------------------------------------------

# Budget-friendly searches on top of the generic "lodging" nearby search.
ACCOMMODATION_QUERIES = [
    "PG accommodation",
    "hostel",
    "guest house",
    "dharamshala",
    "budget hotel",
]

ACCOMMODATION_FIELD_MASK = (
    "places.id,"
    "places.displayName,"
    "places.formattedAddress,"
    "places.location,"
    "places.rating,"
    "places.userRatingCount,"
    "places.googleMapsUri,"
    "places.primaryType,"
    "places.types,"
    "places.priceLevel,"
    "places.nationalPhoneNumber,"
    "places.businessStatus"
)

# Same area is searched again whenever the patient changes a filter,
# so keep results briefly to save Google quota.
_CACHE_TTL_SECONDS = 600
_accommodation_cache: dict[tuple, tuple[float, list]] = {}


async def nearby_accommodations(
    latitude: float,
    longitude: float,
    radius_km: float = 10,
):
    key = (round(latitude, 3), round(longitude, 3), round(radius_km, 1))
    cached = _accommodation_cache.get(key)
    if cached and time.monotonic() - cached[0] < _CACHE_TTL_SECONDS:
        return cached[1]

    api_key = get_api_key()

    radius_meters = min(radius_km * 1000, 50000)

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": ACCOMMODATION_FIELD_MASK,
    }

    circle = {
        "circle": {
            "center": {
                "latitude": latitude,
                "longitude": longitude,
            },
            "radius": radius_meters,
        }
    }

    nearby_payload = {
        "includedTypes": ["lodging"],
        "maxResultCount": 20,
        "rankPreference": "DISTANCE",
        "locationRestriction": circle,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        requests = [
            client.post(GOOGLE_PLACES_URL, headers=headers, json=nearby_payload)
        ] + [
            client.post(
                GOOGLE_TEXT_SEARCH_URL,
                headers=headers,
                json={
                    "textQuery": query,
                    "pageSize": 20,
                    "locationBias": circle,
                },
            )
            for query in ACCOMMODATION_QUERIES
        ]
        responses = await asyncio.gather(*requests, return_exceptions=True)

    results = {}
    errors = []

    for response in responses:
        if isinstance(response, Exception):
            errors.append(response)
            continue
        if response.is_error:
            errors.append(httpx.HTTPStatusError(
                f"Google Places error {response.status_code}: {response.text[:200]}",
                request=response.request,
                response=response,
            ))
            continue
        for place in response.json().get("places", []):
            place_id = place.get("id")
            if place_id and place.get("businessStatus", "OPERATIONAL") == "OPERATIONAL":
                results[place_id] = place

    # Every request failed: surface the error instead of "no stays found".
    if errors and len(errors) == len(responses):
        raise errors[0]

    places = list(results.values())
    _accommodation_cache[key] = (time.monotonic(), places)
    return places

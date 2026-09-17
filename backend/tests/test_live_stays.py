from app.services.live_stay_service import (
    LivePreferences,
    estimate_price,
    rank_live_stays,
    rooms_needed,
)

HOSPITAL = (28.5672, 77.2100)


def place(pid, name, lat, lon, types=("lodging",), **extra):
    return {
        "id": pid,
        "displayName": {"text": name},
        "location": {"latitude": lat, "longitude": lon},
        "types": list(types),
        **extra,
    }


def test_estimate_price_uses_name_first():
    assert estimate_price(place("1", "Shri Ram Dharamshala", 0, 0))[0] == "Dharamshala / Shelter"
    assert estimate_price(place("2", "Sai PG for Boys", 0, 0))[0] == "PG"
    assert estimate_price(place("3", "PGIMER Staff Quarters", 0, 0, types=("hotel",)))[0] == "Hotel"
    assert estimate_price(place("4", "The Taj Mahal Hotel", 0, 0))[0] == "Premium Hotel"


def test_price_level_overrides_type_but_not_cheap_names():
    assert estimate_price(place("1", "City Inn", 0, 0, types=("hotel",), priceLevel="PRICE_LEVEL_EXPENSIVE"))[1:] == (3500, 8000)
    assert estimate_price(place("2", "Zen Hostel", 0, 0, priceLevel="PRICE_LEVEL_EXPENSIVE"))[1:] == (300, 1000)


def test_rooms_needed():
    assert [rooms_needed(g) for g in (1, 2, 3, 5)] == [1, 1, 2, 3]


def test_rank_filters_radius_and_non_lodging_and_prefers_cheap_near():
    places = [
        place("far", "Far Guest House", 28.70, 77.21),
        place("hosp", "AIIMS", 28.568, 77.21, types=("hospital",)),
        place("lux", "Grand Marriott", 28.568, 77.211),
        place("cheap", "Seva Sadan Dharamshala", 28.569, 77.211),
    ]
    stays = rank_live_stays(places, *HOSPITAL, LivePreferences(radius_km=3, budget_per_day=1000))
    assert [s["place_id"] for s in stays] == ["cheap", "lux"]
    assert stays[0]["is_best_match"] and stays[0]["within_budget"]
    assert not stays[1]["within_budget"]
    assert stays[0]["total_cost_max"] == stays[0]["daily_cost_max"] * 3


def test_rank_drops_duplicate_listings():
    dup = [place(str(i), "Gautam Nagar Homestay", 28.568, 77.211) for i in range(2)]
    assert len(rank_live_stays(dup, *HOSPITAL, LivePreferences())) == 1

from app.services.location_service import haversine_km

def test_haversine_zero():
    assert haversine_km(28.6139,77.2090,28.6139,77.2090) == 0

def test_haversine_reasonable():
    d=haversine_km(28.6139,77.2090,28.7041,77.1025)
    assert 10 < d < 20

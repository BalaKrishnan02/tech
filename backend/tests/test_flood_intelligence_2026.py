import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_flood_intelligence_current_tnagar():
    response = client.get("/api/v1/flood-intelligence/current?locality=t_nagar&lat=13.0418&lng=80.2341")
    assert response.status_code == 200
    data = response.json()
    assert "selected_location" in data
    assert data["selected_location"]["locality_name"] == "T. Nagar (Thyagaraya Nagar)"
    assert "rainfall_observations" in data
    assert "water_levels" in data
    assert "sources_and_provenance" in data
    assert "chembarambakkam" in str(data["water_levels"]["reservoirs"])
    # Verify strict dataset freshness
    prov = data["sources_and_provenance"]["chennai_dss"]
    assert "observation_date" in prov
    assert "last_retrieval_time" in prov
    assert "freshness_status" in prov

def test_flood_intelligence_satellite_detect():
    payload = {
        "lat": 13.0418,
        "lng": 80.2341,
        "radius_km": 3.5,
        "locality_name": "T. Nagar"
    }
    response = client.post("/api/v1/flood-intelligence/satellite-detect", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "satellite_metadata" in data
    assert data["satellite_metadata"]["mission"] == "Sentinel-1"
    assert "geojson_inundation_layer" in data
    assert "inundation_summary" in data
    assert data["inundation_summary"]["inundated_area_hectares"] > 0

def test_flood_intelligence_damage_assessment():
    payload = {
        "locality": "t_nagar",
        "inundated_hectares": 22.6,
        "inundation_percentage": 5.87,
        "hazard_level": "MODERATE"
    }
    response = client.post("/api/v1/flood-intelligence/damage-assessment", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "model_estimated_exposure" in data
    assert "officially_confirmed_damage" in data
    assert "unavailable_information" in data
    assert data["model_estimated_exposure"]["potentially_exposed_buildings_count"] > 0

def test_flood_intelligence_events_2026():
    response = client.get("/api/v1/flood-intelligence/events-2026?state=Tamil Nadu")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 1
    event = data["events"][0]
    assert event["is_2026_event"] is True
    assert "2026" in event["event_name"]

def test_flood_intelligence_historical_benchmarks():
    response = client.get("/api/v1/flood-intelligence/historical-benchmarks")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 4
    for b in data["benchmarks"]:
        assert b["is_2026_event"] is False
        assert b["event_year"] < 2026

def test_flood_intelligence_sources():
    response = client.get("/api/v1/flood-intelligence/sources")
    assert response.status_code == 200
    sources = response.json()["sources"]
    source_ids = [s["source_id"] for s in sources]
    assert "CHENNAI_DSS" in source_ids
    assert "IMD_MAUSAM" in source_ids
    assert "NASA_GPM" in source_ids
    assert "ESA_COPERNICUS_CDSE" in source_ids

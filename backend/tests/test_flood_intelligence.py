import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.flood_intelligence.service import FloodIntelligenceService

client = TestClient(app)

def test_locations_hierarchy():
    """Verify state, district, and neighborhood hierarchies are returned."""
    response = client.get("/api/v1/flood-intelligence/locations")
    assert response.status_code == 200
    data = response.json()
    assert "states" in data
    assert "districts" in data
    assert "neighborhoods" in data
    assert len(data["states"]) >= 36
    # Ensure Chennai neighborhoods are present
    n_ids = [n["id"] for n in data["neighborhoods"]]
    assert "tnagar" in n_ids
    assert "velachery" in n_ids
    assert "adyar" in n_ids

def test_search_locations():
    """Test place search for neighborhoods, districts, and states."""
    res1 = client.get("/api/v1/flood-intelligence/search?query=T. Nagar")
    assert res1.status_code == 200
    results1 = res1.json()
    assert any("tnagar" in r.get("id", "").lower() or "t. nagar" in r.get("name", "").lower() for r in results1)

    res2 = client.get("/api/v1/flood-intelligence/search?query=Chennai")
    assert res2.status_code == 200
    assert len(res2.json()) > 0

def test_monitor_tnagar_neighborhood():
    """Test full flood monitoring for T. Nagar neighborhood."""
    response = client.get("/api/v1/flood-intelligence/monitor?neighborhood_id=tnagar")
    assert response.status_code == 200
    data = response.json()

    # Location check
    loc = data["location"]
    assert loc["id"] == "tnagar"
    assert loc["type"] == "neighborhood"
    assert "coordinates" in loc["boundary_geojson"]

    # Current flood situation
    sit = data["current_flood_situation"]
    assert sit["overall_risk_level"] in ["CRITICAL", "HIGH"]
    assert len(sit["active_warnings"]) > 0
    assert sit["active_warnings"][0]["severity"] == "RED"
    assert sit["rainfall_telemetry"]["primary_station"]["current_24h_mm"] > 100

    # Satellite SAR detection (no upload needed)
    sat = data["satellite_detection"]
    assert "Sentinel-1" in sat["mission"]
    assert sat["estimated_inundated_sqkm"] > 0
    assert "inundation_geojson" in sat

    # Impact assessment (3-way distinction)
    impact = data["impact_assessment"]
    assert "confirmed_damage_official" in impact
    assert "potential_exposure_gis" in impact
    assert "model_estimated_hydrodynamics" in impact
    assert impact["potential_exposure_gis"]["potentially_exposed_buildings"] > 0

    # Map layers
    layers = data["map_layers"]
    assert "inundation_layer" in layers
    assert "rain_gauges_layer" in layers
    assert "reservoirs_layer" in layers
    assert "waterlogging_layer" in layers

def test_monitor_state_and_district():
    """Test selecting full district (Chennai) and full state (Tamil Nadu)."""
    res_dist = client.get("/api/v1/flood-intelligence/monitor?district_code=CHN")
    assert res_dist.status_code == 200
    dist_data = res_dist.json()
    assert dist_data["location"]["type"] == "district"
    assert dist_data["location"]["district_code"] == "CHN"

    res_state = client.get("/api/v1/flood-intelligence/monitor?state_code=TN")
    assert res_state.status_code == 200
    state_data = res_state.json()
    assert state_data["location"]["type"] == "state"
    assert state_data["location"]["state_code"] == "TN"

def test_custom_polygon():
    """Test custom drawn polygon evaluation."""
    payload = {
        "name": "Mambalam Canal Polygon",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [80.225, 13.035],
                [80.240, 13.035],
                [80.240, 13.045],
                [80.225, 13.045],
                [80.225, 13.035]
            ]]
        }
    }
    response = client.post("/api/v1/flood-intelligence/custom-polygon", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["location"]["type"] == "custom_polygon"
    assert data["satellite_detection"]["estimated_inundated_sqkm"] > 0
    assert data["impact_assessment"]["status"] == "SUFFICIENT_DATA_ASSESSED"

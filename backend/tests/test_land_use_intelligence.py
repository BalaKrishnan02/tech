import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_satellite_catalog_endpoint():
    response = client.get("/api/v1/land-cover/satellite-catalog")
    assert response.status_code == 200
    catalog = response.json()
    assert isinstance(catalog, list)
    assert len(catalog) >= 3
    first_pair = catalog[0]
    assert "pre_observation" in first_pair
    assert "post_observation" in first_pair
    assert "Copernicus" in first_pair["pre_observation"]["mission"]

def test_model_specifications():
    response = client.get("/api/v1/land-cover/model-specs")
    assert response.status_code == 200
    specs = response.json()
    assert specs["accuracy"] > 0.85
    assert specs["cohen_kappa"] > 0.80
    assert len(specs["classes"]) == 6
    assert "Wetlands / Swamps" in specs["classes"]

def test_land_use_package_tnagar_chennai():
    response = client.get("/api/v1/land-cover/package?state_code=TN&district_code=CHN&neighborhood_id=tnagar")
    assert response.status_code == 200
    pkg = response.json()
    
    # 1. Location selection
    assert "T. Nagar" in pkg["location"]["name"]
    assert pkg["location"]["district"] == "Chennai"
    assert "boundary_geojson" in pkg["location"]
    
    # 2. Satellite pair (Real-Time Google Satellite and SAR Post-Flood Observation)
    assert "satellite_pair" in pkg
    assert pkg["satellite_pair"]["pre_observation"]["spatial_resolution"] == "10m Optical"
    assert "google_sat_realtime" in pkg["satellite_pair"]["pre_observation"]["display_url"]
    assert "google_sat_after" in pkg["satellite_pair"]["post_observation"]["display_url"]
    
    # 2b. Real-Time Classified Rasters
    assert "classification_rasters" in pkg
    assert "before_raster_url" in pkg["classification_rasters"]
    assert "after_raster_url" in pkg["classification_rasters"]
    assert pkg["classification_rasters"]["is_realtime"] is True
    
    # 3. 6-Class breakdown
    assert len(pkg["class_breakdown"]) == 6
    class_names = [c["name"] for c in pkg["class_breakdown"]]
    assert "Built-up / Urban" in class_names
    assert "Dense Vegetation" in class_names
    assert "Water Bodies" in class_names
    assert "Wetlands / Swamps" in class_names
    
    # 4. Transition matrix
    assert "transition_matrix" in pkg
    assert "key_conversions" in pkg["transition_matrix"]
    assert "discrimination_notes" in pkg["transition_matrix"]
    
    # 5. Flood impact cross-analysis
    flood = pkg["flood_impact_analysis"]
    assert "inundation_summary" in flood
    assert flood["inundation_summary"]["total_inundated_area_hectares"] > 0
    assert len(flood["land_cover_classes_submerged"]) >= 3
    assert flood["infrastructure_exposure_estimates"]["potentially_exposed_buildings"] > 0
    
    # 6. CA-Markov future simulation
    camarkov = pkg["camarkov_projections"]
    assert "scenarios" in camarkov
    assert "1_year_projection" in camarkov["scenarios"]
    assert "3_year_projection" in camarkov["scenarios"]
    assert "5_year_projection" in camarkov["scenarios"]
    
    # 7. Multi-year time series
    assert len(pkg["multi_year_timeseries"]) == 5

def test_custom_polygon_land_use():
    custom_geo = {
        "type": "Polygon",
        "coordinates": [[
            [80.2200, 13.0300],
            [80.2450, 13.0300],
            [80.2480, 13.0450],
            [80.2200, 13.0300]
        ]]
    }
    response = client.post("/api/v1/land-cover/custom-polygon", json={
        "geojson": custom_geo,
        "pair_id": "pair_2026_monsoon_surge",
        "development_pressure": 1.2
    })
    assert response.status_code == 200
    res = response.json()
    assert res["location"]["type"] == "custom_polygon"
    assert "class_breakdown" in res
    assert "camarkov_projections" in res

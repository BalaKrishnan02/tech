import pytest
from backend.app.services.flood_intelligence.service import FloodIntelligenceService
from backend.app.services.flood_intelligence.localities_registry import (
    KEY_DISTRICTS,
    ALL_MONITORED_NEIGHBORHOODS,
)
from backend.app.services.land_cover.intelligence_service import LandUseIntelligenceService


def test_hierarchy_contains_extended_districts():
    hierarchy = FloodIntelligenceService.get_locations_hierarchy()
    dist_codes = {d["code"] for d in hierarchy["districts"]}
    # Check that all requested districts are present
    assert "CHN" in dist_codes  # Chennai
    assert "CBE" in dist_codes  # Coimbatore
    assert "CUD" in dist_codes  # Cuddalore
    assert "TVM" in dist_codes  # Tiruvannamalai
    assert "MDU" in dist_codes  # Madurai
    assert "PDY" in dist_codes  # Puducherry
    assert "KRK" in dist_codes  # Karaikal


def test_all_monitored_neighborhoods_resolve():
    assert len(ALL_MONITORED_NEIGHBORHOODS) >= 30
    for nh in ALL_MONITORED_NEIGHBORHOODS:
        res = FloodIntelligenceService.resolve_location(neighborhood_id=nh["id"])
        assert res["id"] == nh["id"]
        assert res["district_code"] == nh["district_code"]
        assert res["state_code"] == nh["state_code"]
        assert "boundary_geojson" in res
        assert res["boundary_geojson"]["type"] == "Polygon"
        assert len(res["boundary_geojson"]["coordinates"][0]) >= 4


def test_land_use_analysis_on_new_districts():
    # Test Coimbatore R.S. Puram
    cbe_pkg = LandUseIntelligenceService.analyze_land_use_for_location(
        state_code="TN",
        district_code="CBE",
        neighborhood_id="cbe_rspuram",
    )
    assert cbe_pkg["location"]["id"] == "cbe_rspuram"
    assert cbe_pkg["location"]["district_code"] == "CBE"
    assert len(cbe_pkg["class_breakdown"]) > 0

    # Test Tiruvannamalai Girivalam
    tvm_pkg = LandUseIntelligenceService.analyze_land_use_for_location(
        state_code="TN",
        district_code="TVM",
        neighborhood_id="tvm_girivalam",
    )
    assert tvm_pkg["location"]["id"] == "tvm_girivalam"
    assert tvm_pkg["location"]["district_code"] == "TVM"

    # Test Puducherry White Town
    pdy_pkg = LandUseIntelligenceService.analyze_land_use_for_location(
        state_code="PY",
        district_code="PDY",
        neighborhood_id="pdy_white_town",
    )
    assert pdy_pkg["location"]["id"] == "pdy_white_town"
    assert pdy_pkg["location"]["district_code"] == "PDY"

    # Test Karaikal Port
    krk_pkg = LandUseIntelligenceService.analyze_land_use_for_location(
        state_code="PY",
        district_code="KRK",
        neighborhood_id="krk_port_coastal",
    )
    assert krk_pkg["location"]["id"] == "krk_port_coastal"
    assert krk_pkg["location"]["district_code"] == "KRK"

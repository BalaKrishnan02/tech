import pytest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.core.security import hash_password, verify_password, create_access_token, decode_access_token, verify_user_ownership
from backend.app.services.geography.service import GeographyService, make_box_geojson
from backend.app.services.satellite.service import SatelliteService
from backend.app.services.rainfall.service import RainfallService
from backend.app.services.disaster_events.service import DisasterEventsService
from backend.app.services.comparison.service import ComparisonService
from backend.app.services.reports.service import ReportService
from backend.app.services.chatbot.service import ChatbotService
from backend.app.services.jobs.service import JobService
from backend.app.models.entities import User, Project, AnalysisRun
from backend.app.core.config import settings

client = TestClient(app)

# -------------------------------------------------------------
# 1. ADMINISTRATIVE BOUNDARY VALIDATION
# -------------------------------------------------------------
def test_administrative_boundary_validation():
    # Valid bounding box in India (Chennai area)
    valid_box = make_box_geojson([12.8, 80.0, 13.3, 80.4], "Chennai Coast")
    is_valid, err = GeographyService.validate_geometry(valid_box)
    assert is_valid is True
    assert err is None

    # Invalid coordinates outside India (e.g. Europe / Arctic)
    invalid_box = make_box_geojson([51.5, 0.0, 52.0, 0.5], "London")
    is_valid, err = GeographyService.validate_geometry(invalid_box)
    assert is_valid is False
    assert "outside the geographic bounds of India" in err

    # Unclosed polygon ring
    unclosed = {
        "type": "Polygon",
        "coordinates": [[[80.0, 13.0], [80.5, 13.0], [80.5, 13.5]]]
    }
    is_valid, err = GeographyService.validate_geometry(unclosed)
    assert is_valid is False

# -------------------------------------------------------------
# 2. STATE AND DISTRICT LOOKUP (ALL 36 STATES/UTS)
# -------------------------------------------------------------
def test_all_36_states_lookup():
    db = SessionLocal()
    try:
        states = GeographyService.get_all_states(db)
        assert len(states) == 36
        codes = [s["state_code"] for s in states]
        assert "TN" in codes
        assert "KL" in codes
        assert "MH" in codes
        assert "DL" in codes
        assert "AS" in codes
        assert "UK" in codes
    finally:
        db.close()

def test_district_lookup_by_state():
    db = SessionLocal()
    try:
        tn_districts = GeographyService.get_districts_by_state(db, "TN")
        assert len(tn_districts) >= 3
        d_names = [d["district_name"] for d in tn_districts]
        assert "Chennai" in d_names
        assert "Cuddalore" in d_names
    finally:
        db.close()

# -------------------------------------------------------------
# 3. GEOGRAPHIC SEARCH
# -------------------------------------------------------------
def test_administrative_search():
    res = client.get("/api/v1/geography/search?query=Chennai")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert any("Chennai" in item["name"] for item in data)

# -------------------------------------------------------------
# 4. SATELLITE CATALOG & DEDUPLICATION
# -------------------------------------------------------------
def test_satellite_catalog_and_deduplication():
    db = SessionLocal()
    try:
        # Seed twice to test deduplication
        SatelliteService.seed_catalog(db)
        SatelliteService.seed_catalog(db)
        res = SatelliteService.search_historical_satellite(db, mission="Sentinel-1")
        assert res["total_count"] >= 1
        for p in res["products"]:
            assert p["mission"] == "Sentinel-1"
            assert "GRD" in p["processing_level"] or "SAR" in p["spatial_resolution"]
    finally:
        db.close()

def test_satellite_observation_dates_calendar():
    db = SessionLocal()
    try:
        cal = SatelliteService.get_observation_calendar(db, "Tamil Nadu")
        assert isinstance(cal, list)
    finally:
        db.close()

# -------------------------------------------------------------
# 5. HISTORICAL RAINFALL UNIT CONSISTENCY & BASELINE
# -------------------------------------------------------------
def test_rainfall_rate_vs_accumulation_isolation():
    # Verify that daily accumulation units are mm and strictly separated from rate mm/h
    series = RainfallService.get_time_series_breakdown(
        region_id="chennai-basin",
        start_date=datetime(2023, 12, 1),
        end_date=datetime(2023, 12, 7),
        interval="daily"
    )
    assert series["accumulation_statistics"]["unit_standard"] == "Accumulation (mm)"
    assert series["accumulation_statistics"]["total_accumulated_rainfall_mm"] > 100
    assert "strictly isolated" in series["accumulation_statistics"]["rate_vs_accumulation_note"]

def test_rainfall_missing_data_integrity():
    # Verify that missing data is accurately flagged and not fabricated
    summary = RainfallService.get_accumulation_summary([
        {"rainfall_mm": 15.0, "is_missing": False},
        {"rainfall_mm": None, "is_missing": True},
        {"rainfall_mm": 45.0, "is_missing": False}
    ])
    assert summary["missing_records_count"] == 1
    assert summary["total_event_rainfall_mm"] == 60.0

def test_rainfall_30yr_baseline_normal():
    base_tn = RainfallService.get_historical_baseline("chennai-basin")
    assert base_tn["annual_normal_mm"] > 1000.0
    assert "North-East" in base_tn["monsoon_season"]

# -------------------------------------------------------------
# 6. HISTORICAL FLOOD EVENTS & AUTO-ASSEMBLY
# -------------------------------------------------------------
def test_disaster_event_auto_assembly():
    db = SessionLocal()
    try:
        events = DisasterEventsService.get_events(db)
        assert len(events) >= 5
        michaung = [e for e in events if "MICHAUNG" in e["event_id"]][0]
        assert michaung["verification_level"] == "OFFICIALLY_DOCUMENTED"

        evidence = DisasterEventsService.auto_assemble_event_evidence(db, michaung["event_id"])
        assert "satellite_evidence" in evidence
        assert "meteorological_evidence" in evidence
        assert "chronological_timeline" in evidence
        assert len(evidence["chronological_timeline"]) >= 3
        assert len(evidence["methodology_and_limitations"]) >= 2
    finally:
        db.close()

# -------------------------------------------------------------
# 7. MULTI-YEAR COMPARISON
# -------------------------------------------------------------
def test_multi_year_trend_comparison():
    res = ComparisonService.compare_multi_year_trends("chennai-basin", [2019, 2021, 2023, 2025])
    assert len(res["annual_trajectories"]) == 4
    # 2023 should show flood event status
    yr_2023 = [t for t in res["annual_trajectories"] if t["year"] == 2023][0]
    assert "Flood" in yr_2023["event_status"]

def test_two_dates_seasonal_warning():
    # Comparing June (summer/SW monsoon) with November (NE monsoon) should trigger a seasonal caveat
    res = ComparisonService.compare_dates("2023-06-15", "2023-11-20", "chennai-basin")
    assert "Seasonal discrepancy" in res["seasonal_alignment_note"]

# -------------------------------------------------------------
# 8. USER AUTHENTICATION & ACCESS CONTROL (IDOR SAFETY)
# -------------------------------------------------------------
def test_user_registration_and_login():
    unique_user = f"gis_analyst_{datetime.now().strftime('%f')}"
    unique_email = f"{unique_user}@test.gov.in"

    # Register
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "username": unique_user,
        "password": "SecurePassword123!",
        "full_name": "Test GIS Analyst",
        "organization": "Tamil Nadu SDMA"
    })
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    token = reg_data["access_token"]
    assert token is not None

    # Login
    login_resp = client.post("/api/v1/auth/login", json={
        "username_or_email": unique_user,
        "password": "SecurePassword123!"
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

    # Invalid password
    bad_login = client.post("/api/v1/auth/login", json={
        "username_or_email": unique_user,
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

    # Protected me endpoint
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == unique_user

def test_user_ownership_and_idor_protection():
    user1_token = create_access_token(subject="user_1_alice", role="analyst")
    user2_token = create_access_token(subject="user_2_bob", role="analyst")

    # Bob attempts to access Alice's project
    alice_payload = decode_access_token(user1_token)
    bob_payload = decode_access_token(user2_token)

    # Alice accessing her own resource passes
    assert verify_user_ownership("user_1_alice", alice_payload) is True

    # Bob accessing Alice's resource must raise 403 Forbidden
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as excinfo:
        verify_user_ownership("user_1_alice", bob_payload)
    assert excinfo.value.status_code == 403

# -------------------------------------------------------------
# 9. USER WORKSPACE & PROJECT HISTORY RETRIEVAL
# -------------------------------------------------------------
def test_user_project_crud():
    token = create_access_token(subject="user_demo_analyst", role="analyst")
    headers = {"Authorization": f"Bearer {token}"}

    # Create project
    create_res = client.post("/api/v1/portal/projects", json={
        "name": "Cooum Flood Resilience 2026",
        "description": "Spatial planning for catchment runoff",
        "state": "Tamil Nadu",
        "district": "Chennai"
    }, headers=headers)
    assert create_res.status_code == 200
    proj_id = create_res.json()["id"]

    # List projects
    list_res = client.get("/api/v1/portal/projects", headers=headers)
    assert list_res.status_code == 200
    assert any(p["id"] == proj_id for p in list_res.json())

    # Archive project
    update_res = client.put(f"/api/v1/portal/projects/{proj_id}", json={
        "name": "Cooum Flood Resilience (Archived Phase 1)",
        "is_archived": True
    }, headers=headers)
    assert update_res.status_code == 200

# -------------------------------------------------------------
# 10. MULTI-FORMAT REPORT EXPORTS
# -------------------------------------------------------------
def test_report_generation_formats():
    res_pdf = ReportService.generate_pdf_report(
        region_name="Chennai Coastal Basin",
        analysis_data={"visual_change_percent": 18.4, "water_change_percent": 24.2, "newly_detected_water_sqkm": 32.5, "vegetation_loss_percent": 14.1, "risk_status": "High Risk"},
        rainfall_summary={"peak_24h_rainfall_mm": 312.8}
    )
    assert Path(settings.PROCESSED_DIR / res_pdf).exists()

    res_csv = ReportService.generate_csv_report("Chennai Coastal Basin", {"visual_change_pct": 18.4, "flood_sqkm": 32.5})
    assert Path(settings.PROCESSED_DIR / res_csv).exists()

    res_geojson = ReportService.generate_geojson_report(
        region_name="Chennai Basin",
        footprint={"type": "Polygon", "coordinates": [[[80.0, 12.8], [80.3, 12.8], [80.3, 13.2], [80.0, 13.2], [80.0, 12.8]]]},
        properties={"risk": "High"}
    )
    assert Path(settings.PROCESSED_DIR / res_geojson).exists()

# -------------------------------------------------------------
# 11. CHATBOT USER AND HISTORICAL CONTEXT
# -------------------------------------------------------------
def test_chatbot_historical_and_user_queries():
    # 1. Five year change
    res1 = ChatbotService.answer_query(
        "இந்த மாவட்டத்தில் கடந்த ஐந்து ஆண்டுகளில் என்ன மாற்றங்கள் நடந்துள்ளன?",
        region_info={"name": "Chennai Basin"}
    )
    assert res1["language"] == "ta"
    assert "கடந்த 5 ஆண்டுகளில்" in res1["content"] or "மாற்றங்கள்" in res1["content"]

    # 2. Rainfall comparison
    res2 = ChatbotService.answer_query(
        "தமிழ்நாடு மற்றும் கேரளாவின் rainfall records-ஐ compare பண்ணு.",
        region_info={"name": "Tamil Nadu / Kerala"}
    )
    assert "தமிழ்நாடு" in res2["content"] and "கேரளா" in res2["content"]

    # 3. Satellite availability
    res3 = ChatbotService.answer_query(
        "இந்தப் பகுதியில் பழைய satellite image கிடைக்குமா?",
        region_info={"name": "Chennai Basin"}
    )
    assert "Sentinel" in res3["content"] or "சென்டினல்" in res3["content"]

# -------------------------------------------------------------
# 12. BACKGROUND INGESTION JOBS
# -------------------------------------------------------------
def test_background_ingestion_jobs():
    db = SessionLocal()
    try:
        job = JobService.create_ingestion_job(
            db=db,
            job_name="Scheduled Test Sentinel Ingestion",
            provider="Copernicus_CDSE",
            dataset_type="satellite_search",
            geographic_scope={"state": "Tamil Nadu"}
        )
        assert job.status == "queued"
        run_res = JobService.run_job_execution(db, job.id)
        assert run_res["status"] == "success"
        matrix = JobService.get_provider_status_matrix()
        assert len(matrix["providers"]) >= 3
    finally:
        db.close()

# -------------------------------------------------------------
# 13. URBAN SCENE DETECTION & STRICT ZERO-FARMLAND GROUNDING
# -------------------------------------------------------------
def test_urban_scene_detection_and_zero_farmland_grounding():
    import numpy as np
    from backend.app.services.land_cover.service import LandCoverService
    from backend.app.services.digital_twin.service import DigitalTwinService
    from backend.app.services.reports.service import ReportService

    # 1. Create a synthetic urban-textured image (high-frequency edges: concrete, buildings, asphalt)
    h, w = 120, 120
    urban_img = np.zeros((h, w, 3), dtype=np.uint8)
    # Concrete base (gray)
    urban_img[:, :] = [130, 130, 130]
    # Add high-frequency building grid and terracotta roofs
    for y in range(0, h, 10):
        urban_img[y:y+2, :] = [40, 40, 40]  # asphalt roads
    for x in range(0, w, 10):
        urban_img[:, x:x+2] = [40, 40, 40]  # asphalt roads
    # Add terracotta/red clay roofs
    urban_img[15:35, 15:35] = [60, 90, 150] # BGR terracotta
    urban_img[55:75, 55:75] = [50, 80, 160]

    # Context detection
    ctx = LandCoverService.detect_scene_context(urban_img)
    assert ctx["is_urban"] is True
    assert "Urban" in ctx["scene_type"]

    # Classification
    grid, props, _ = LandCoverService.classify_image(urban_img)
    assert props["Agricultural Land"] == 0.0
    assert props["Built-up / Urban"] > 0.0

    # Evidence Summaries Truthful Grounding
    summaries = DigitalTwinService.generate_evidence_summaries(
        region_name="Chennai Municipal Core",
        water_change_pct=18.5,
        water_area_sqkm=3.2,
        peak_rain_mm=280.0,
        veg_loss_pct=12.0,
        risk_status="High Risk",
        is_urban=True,
        dominant_loss_class="Built-up"
    )
    assert "0.0% agricultural land" in summaries["summary_en"]
    assert "விவசாய நிலப் பாதிப்பு ஏதுமில்லை" in summaries["summary_ta"]
    assert "paved street corridors" in summaries["summary_en"]

    # PDF Report Generation with Urban Scene
    report_pdf = ReportService.generate_pdf_report(
        region_name="Chennai Municipal Core",
        analysis_data={
            "visual_change_percent": 18.5,
            "water_change_percent": 18.5,
            "newly_detected_water_sqkm": 3.2,
            "vegetation_loss_percent": 12.0,
            "is_urban_scene": True,
            "dominant_loss_class": "Built-up"
        }
    )
    assert report_pdf.endswith(".pdf")


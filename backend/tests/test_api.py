import pytest
from datetime import datetime, timedelta
import numpy as np
import cv2
from pathlib import Path
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.image_upload.service import ImageUploadService
from backend.app.services.image_comparison.service import ImageComparisonService
from backend.app.services.flood_detection.service import FloodDetectionService
from backend.app.services.vegetation.service import VegetationService
from backend.app.services.land_cover.service import LandCoverService
from backend.app.services.chatbot.service import ChatbotService
from backend.app.services.digital_twin.service import DigitalTwinService
from backend.app.services.rainfall.service import RainfallService
from backend.app.core.config import settings

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/v1/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "computer_vision_change_detection" in data["capabilities"]

def test_regions_listing():
    response = client.get("/api/v1/regions/")
    assert response.status_code == 200
    regions = response.json()
    assert len(regions) >= 1
    slugs = [r["slug"] for r in regions]
    assert "chennai-basin" in slugs

def test_image_pair_validation_date_order():
    # Valid date order
    b_date = datetime(2023, 11, 20)
    a_date = datetime(2023, 12, 5)
    res = ImageUploadService.validate_pair(
        {"acquisition_date": b_date, "width": 800, "height": 600, "is_georeferenced": False},
        {"acquisition_date": a_date, "width": 800, "height": 600, "is_georeferenced": False}
    )
    assert res["date_order_valid"] is True

    # Inverted date order
    res_bad = ImageUploadService.validate_pair(
        {"acquisition_date": a_date, "width": 800, "height": 600, "is_georeferenced": False},
        {"acquisition_date": b_date, "width": 800, "height": 600, "is_georeferenced": False}
    )
    assert res_bad["date_order_valid"] is False
    assert any("Date anomaly" in w for w in res_bad["warnings"])

def test_image_pair_dimension_mismatch():
    res = ImageUploadService.validate_pair(
        {"acquisition_date": datetime(2023, 1, 1), "width": 1000, "height": 500},
        {"acquisition_date": datetime(2023, 1, 2), "width": 600, "height": 600}
    )
    assert res["dimension_compatibility"] == "Aspect ratio mismatch"
    assert any("discrepancy" in w for w in res["warnings"])

def test_computer_vision_change_detection():
    # Synthetic test images
    img1 = np.ones((200, 200, 3), dtype=np.uint8) * 100
    img2 = img1.copy()
    # Add difference patch to img2
    img2[50:100, 50:100] = [20, 200, 20]

    p1 = settings.PROCESSED_DIR / "test_pre.png"
    p2 = settings.PROCESSED_DIR / "test_post.png"
    cv2.imwrite(str(p1), img1)
    cv2.imwrite(str(p2), img2)

    res = ImageComparisonService.compare_images(str(p1), str(p2), is_georeferenced=True, resolution_meters=10.0)
    assert res["visual_change_percent"] > 0.0
    assert res["georeferenced_changed_area_sqkm"] is not None
    assert Path(res["difference_map_path"]).exists()

def test_flood_detection_permanent_vs_new():
    # Base terrain
    img_pre = np.ones((150, 150, 3), dtype=np.uint8) * 120
    # Permanent river (blue)
    img_pre[:, 70:80] = [200, 80, 20]

    img_post = img_pre.copy()
    # Flood expansion (swollen river)
    img_post[:, 50:100] = [200, 80, 20]

    p1 = settings.PROCESSED_DIR / "test_fl_pre.png"
    p2 = settings.PROCESSED_DIR / "test_fl_post.png"
    cv2.imwrite(str(p1), img_pre)
    cv2.imwrite(str(p2), img_post)

    res = FloodDetectionService.analyze_flood(str(p1), str(p2), resolution_meters=10.0)
    assert res["new_water_pixels"] > 0
    assert res["water_change_percent"] > 0
    assert Path(res["flood_overlay_path"]).exists()

def test_vegetation_vari_calculation():
    # Green image vs dead/submerged image
    green_img = np.zeros((100, 100, 3), dtype=np.uint8)
    green_img[:, :] = [30, 180, 30] # High green

    brown_img = np.zeros((100, 100, 3), dtype=np.uint8)
    brown_img[:, :] = [80, 80, 80] # Grey mud

    p1 = settings.PROCESSED_DIR / "test_veg_pre.png"
    p2 = settings.PROCESSED_DIR / "test_veg_post.png"
    cv2.imwrite(str(p1), green_img)
    cv2.imwrite(str(p2), brown_img)

    res = VegetationService.analyze_vegetation(str(p1), str(p2))
    assert res["pre_ndvi_mean"] > res["post_ndvi_mean"]
    assert res["ndvi_change_delta"] < 0
    assert Path(res["ndvi_map_path"]).exists()

def test_chatbot_tamil_handling():
    # Query in Tamil about image difference
    resp_ta = ChatbotService.answer_query("இந்த இரண்டு படங்கள்ல என்ன வித்தியாசம்?")
    assert resp_ta["language"] == "ta"
    assert "வித்தியாசம்" in resp_ta["content"] or "பகுப்பாய்வு" in resp_ta["content"] or "படங்கள்" in resp_ta["content"]

    # Query in Tamil about rainfall
    resp_rain = ChatbotService.answer_query("இந்தப் பகுதியில் எவ்வளவு மழை பெய்திருக்கு?")
    assert resp_rain["language"] == "ta"
    assert "மழை" in resp_rain["content"]

def test_chatbot_missing_data_behavior():
    # Query without any active analysis
    resp = ChatbotService.answer_query("What is the flood impact?", region_info=None, analysis_data=None)
    assert resp["is_evidence_complete"] is False
    assert resp["missing_data_explanation"] is not None

def test_digital_twin_risk_formula():
    risk = DigitalTwinService.calculate_risk_index(
        water_change_percent=18.0,
        rainfall_peak_mm=280.0,
        vegetation_loss_percent=25.0,
        built_up_inundation_percent=5.0
    )
    assert 0.0 <= risk["score"] <= 100.0
    assert "Composite Risk Formula" in risk["formula_details"]
    assert risk["status"] in ["Moderate Risk", "High Risk", "Critical Risk"]

def test_rainfall_accumulation_summary():
    records = [
        {"rainfall_mm": 10.0},
        {"rainfall_mm": 50.0},
        {"rainfall_mm": 120.0}
    ]
    summary = RainfallService.get_accumulation_summary(records)
    assert summary["total_event_rainfall_mm"] == 180.0
    assert summary["peak_24h_rainfall_mm"] == 120.0

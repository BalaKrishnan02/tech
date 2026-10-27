from fastapi import APIRouter
from datetime import datetime
from backend.app.core.config import settings

router = APIRouter()

@router.get("/")
def get_health():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected",
        "capabilities": [
            "computer_vision_change_detection",
            "sentinel_flood_expansion",
            "ndvi_vegetation_health",
            "random_forest_land_cover",
            "nasa_gpm_rainfall",
            "tamil_voice_assistant",
            "report_generation"
        ]
    }

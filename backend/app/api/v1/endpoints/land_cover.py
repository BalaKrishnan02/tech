from fastapi import APIRouter, Query, HTTPException, Body
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from backend.app.services.land_cover.intelligence_service import LandUseIntelligenceService

router = APIRouter()

class CustomPolygonLandUseRequest(BaseModel):
    geojson: Dict[str, Any]
    pair_id: Optional[str] = "pair_2026_monsoon_surge"
    development_pressure: Optional[float] = 1.0

class CAMarkovPredictRequest(BaseModel):
    state_code: Optional[str] = None
    district_code: Optional[str] = None
    neighborhood_id: Optional[str] = None
    horizon_years: Optional[List[int]] = [1, 3, 5]
    development_pressure: Optional[float] = 1.0

@router.get("/package")
def get_land_use_package(
    state_code: Optional[str] = Query(None, description="State code e.g. TN"),
    district_code: Optional[str] = Query(None, description="District code e.g. CHN"),
    neighborhood_id: Optional[str] = Query(None, description="Neighborhood ID e.g. tnagar, velachery"),
    pair_id: Optional[str] = Query("pair_2026_monsoon_surge", description="Satellite observation pair ID"),
    development_pressure: Optional[float] = Query(1.0, ge=0.2, le=3.0, description="CA-Markov urban growth pressure factor")
):
    """
    Returns the comprehensive AI-Powered Land Use Change and Flood Impact Package:
    - Geographic boundaries and centroid
    - Automatically retrieved Sentinel-2 and Sentinel-1 satellite observations (2026 & historical)
    - 6-class multispectral classification (Water, Vegetation, Agriculture, Built-up, Barren, Wetlands)
    - 6x6 Land-Use Transition Matrix with hectares, sqkm, and percentages
    - Seasonal vegetation phenology vs permanent urbanization discrimination
    - Flood impact cross-analysis (submerged hectares per class, building & road exposure)
    - Multi-year continuous monitoring time series (2019-2026)
    - CA-Markov future land-use projections (1-Year 2027, 3-Year 2029, 5-Year 2031)
    - Model architecture, input bands (B2-B11), accuracy (96.4%), and Kappa (0.941).
    """
    try:
        return LandUseIntelligenceService.analyze_land_use_for_location(
            state_code=state_code,
            district_code=district_code,
            neighborhood_id=neighborhood_id,
            pair_id=pair_id,
            development_pressure=development_pressure
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate land-use package: {str(e)}")

@router.post("/custom-polygon")
def analyze_custom_polygon_land_use(req: CustomPolygonLandUseRequest):
    """
    Executes automated satellite land-use classification, change detection,
    flood impact assessment, and CA-Markov future simulation for a user-drawn polygon.
    """
    try:
        return LandUseIntelligenceService.analyze_land_use_for_location(
            custom_polygon=req.geojson,
            pair_id=req.pair_id,
            development_pressure=req.development_pressure or 1.0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze custom polygon: {str(e)}")

@router.get("/satellite-catalog")
def get_satellite_catalog():
    """Returns available satellite observation pairs with authentic acquisition dates and sensor metadata."""
    return LandUseIntelligenceService.AVAILABLE_SATELLITE_PAIRS

@router.get("/model-specs")
def get_model_specifications():
    """Returns the trained Random Forest classifier and CA-Markov simulation specifications."""
    from backend.app.services.land_cover.service import LandCoverService
    model_data = LandCoverService.train_baseline_model()
    return model_data

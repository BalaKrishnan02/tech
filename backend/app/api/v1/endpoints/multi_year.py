from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, List, Dict, Any

from backend.app.services.comparison.service import ComparisonService

router = APIRouter()

@router.get("/compare-dates")
def compare_dates(
    date_1: str = Query(..., description="First observation date YYYY-MM-DD"),
    date_2: str = Query(..., description="Second observation date YYYY-MM-DD"),
    region_id: str = Query("chennai-basin", description="Region identifier"),
    sensor: Optional[str] = Query("optical_multispectral", description="Sensor mode")
):
    """Compares land use, water extent, and vegetation between two distinct historical dates."""
    return ComparisonService.compare_dates(date_1, date_2, region_id, sensor)

@router.get("/trends")
def get_multi_year_trends(
    region_id: str = Query("chennai-basin", description="Region identifier"),
    years: List[int] = Query([2019, 2021, 2023, 2025, 2026], description="List of years to compare"),
    season: str = Query("post_monsoon", description="post_monsoon, pre_monsoon, or annual_mean")
):
    """Analyzes multi-year trajectory across multiple years, evaluating recovery and urban expansion."""
    return ComparisonService.compare_multi_year_trends(region_id, years, season)

@router.get("/compare-regions")
def compare_regions(
    region_1: str = Query("chennai-basin", description="First region ID or state"),
    region_2: str = Query("cuddalore-delta", description="Second region ID or state"),
    year: int = Query(2026, description="Observation comparison year")
):
    """Compares two distinct administrative regions side-by-side with methodology comparability validation."""
    return ComparisonService.compare_regions(region_1, region_2, year)

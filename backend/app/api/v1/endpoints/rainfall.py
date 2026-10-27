from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from backend.app.database.session import get_db
from backend.app.models.entities import Region, RainfallObservation
from backend.app.services.rainfall.service import RainfallService

router = APIRouter()

@router.get("/{region_id}")
def get_rainfall_data(
    region_id: str,
    year: Optional[int] = Query(None, description="Report year (e.g. 2026, 2025, 2024, 2023, 2022, 2021, 2018, 2015)"),
    db: Session = Depends(get_db)
):
    """
    Returns annual & event rainfall telemetry report.
    Supports 2026 (current live/calibrated telemetry) and past historical report years.
    """
    reg = db.query(Region).filter((Region.id == region_id) | (Region.slug == region_id)).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Region not found")

    target_year = year or 2026
    return RainfallService.get_rainfall_report(
        region_id=reg.id,
        region_name=reg.name,
        lat=reg.latitude,
        lon=reg.longitude,
        year=target_year
    )

@router.get("/{region_id}/series")
def get_time_series(
    region_id: str,
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    interval: str = Query("daily", description="hourly, daily, monthly, annual, event"),
    db: Session = Depends(get_db)
):
    """
    Returns historical rainfall accumulation time series strictly separated by accumulation window.
    Compares against 30-year IMD climatological baseline.
    """
    dt_end = datetime.strptime(end_date, "%Y-%m-%d") if end_date else datetime(2023, 12, 10)
    dt_start = datetime.strptime(start_date, "%Y-%m-%d") if start_date else (dt_end - timedelta(days=14))

    return RainfallService.get_time_series_breakdown(
        region_id=region_id,
        start_date=dt_start,
        end_date=dt_end,
        interval=interval
    )

@router.get("/{region_id}/multi-year")
def get_multi_year_comparison(
    region_id: str,
    years: List[int] = Query([2021, 2022, 2023, 2024], description="Years to compare"),
    start_month: int = Query(10, description="Start month (1-12)"),
    end_month: int = Query(12, description="End month (1-12)")
):
    """Compares rainfall totals across multiple years for the same seasonal window."""
    return RainfallService.compare_multi_year_rainfall(
        region_id=region_id,
        years=years,
        start_month=start_month,
        end_month=end_month
    )

@router.get("/{region_id}/baseline")
def get_baseline_normal(region_id: str):
    """Returns official 30-year IMD climatological normal for the region."""
    return RainfallService.get_historical_baseline(region_id)

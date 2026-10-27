from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

from backend.app.database.session import get_db
from backend.app.services.satellite.service import SatelliteService
from backend.app.services.jobs.service import JobService

router = APIRouter()

class IngestSatelliteRequest(BaseModel):
    provider: Optional[str] = "Copernicus_CDSE"
    dataset_type: Optional[str] = "satellite_search"
    state: Optional[str] = None
    district: Optional[str] = None
    mission: Optional[str] = "all"
    start_date: Optional[str] = None
    end_date: Optional[str] = None

@router.get("/search")
def search_satellite_observations(
    state: Optional[str] = Query(None, description="State name (e.g. Tamil Nadu, Kerala)"),
    district: Optional[str] = Query(None, description="District name (e.g. Chennai, Ernakulam)"),
    mission: Optional[str] = Query("all", description="Sentinel-1, Sentinel-2, or all"),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    max_cloud_cover: Optional[float] = Query(30.0, description="Max allowed cloud cover %"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Searches historical Copernicus Sentinel-1 radar and Sentinel-2 optical imagery.
    Returns product metadata, footprints, cloud stats, and exact dates with available observations.
    """
    dt_start = datetime.strptime(start_date, "%Y-%m-%d") if start_date else None
    dt_end = datetime.strptime(end_date, "%Y-%m-%d") if end_date else None

    results = SatelliteService.search_historical_satellite(
        db=db,
        state=state,
        district=district,
        mission=mission,
        start_date=dt_start,
        end_date=dt_end,
        max_cloud_cover=max_cloud_cover,
        page=page,
        page_size=page_size
    )
    return results

@router.get("/calendar")
def get_observation_calendar(
    region_or_district: Optional[str] = Query("all", description="Region, State, or District filter"),
    db: Session = Depends(get_db)
):
    """Returns monthly count of available Sentinel observations to show data density."""
    return SatelliteService.get_observation_calendar(db, region_or_district)

@router.post("/ingest-job")
def trigger_satellite_ingest_job(
    req: IngestSatelliteRequest,
    db: Session = Depends(get_db)
):
    """Queues a background satellite search and ingestion backfill job."""
    dt_start = datetime.strptime(req.start_date, "%Y-%m-%d") if req.start_date else None
    dt_end = datetime.strptime(req.end_date, "%Y-%m-%d") if req.end_date else None

    job = JobService.create_ingestion_job(
        db=db,
        job_name=f"Ingest-{req.mission or 'Sentinel'}-{req.state or 'India'}",
        provider=req.provider or "Copernicus_CDSE",
        dataset_type="satellite_search",
        geographic_scope={"state": req.state, "district": req.district},
        date_range_start=dt_start,
        date_range_end=dt_end
    )
    
    # Run immediate execution for responsive demo
    JobService.run_job_execution(db, job.id)

    return {
        "job_id": job.id,
        "status": "completed",
        "message": "Satellite catalog ingestion job executed successfully."
    }

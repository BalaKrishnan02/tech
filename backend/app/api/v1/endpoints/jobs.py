from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from backend.app.database.session import get_db
from backend.app.models.entities import AnalysisRun, IngestionJob
from backend.app.schemas.schemas import AnalysisRunStatusResponse
from backend.app.services.jobs.service import JobService

router = APIRouter()

@router.get("/")
def list_ingestion_jobs(limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    """Lists recent background ingestion and backfill jobs."""
    return JobService.list_jobs(db, limit)

@router.get("/provider-status")
def get_provider_status_matrix():
    """Returns telemetry status, data freshness, and modes for Copernicus CDSE, NASA, and IMD."""
    return JobService.get_provider_status_matrix()

@router.post("/{job_id}/run")
def trigger_job_run(job_id: str, db: Session = Depends(get_db)):
    """Triggers execution of a queued ingestion job."""
    return JobService.run_job_execution(db, job_id)

@router.post("/{job_id}/cancel")
def cancel_job(job_id: str, db: Session = Depends(get_db)):
    """Cancels a pending or running job."""
    JobService.cancel_job(db, job_id)
    return {"message": f"Job {job_id} cancelled."}

@router.get("/{job_id}")
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    """Checks status of an ingestion job or analysis run."""
    # Check ingestion jobs first
    ingest_job = db.query(IngestionJob).filter(IngestionJob.id == job_id).first()
    if ingest_job:
        return {
            "id": ingest_job.id,
            "job_name": ingest_job.job_name,
            "provider": ingest_job.provider,
            "status": ingest_job.status,
            "progress": ingest_job.progress_percent,
            "records_ingested": ingest_job.records_ingested,
            "error_summary": ingest_job.error_summary,
            "log_messages": ingest_job.log_messages,
            "created_at": ingest_job.created_at,
            "updated_at": ingest_job.updated_at
        }

    # Fallback to analysis runs
    run = db.query(AnalysisRun).filter(AnalysisRun.id == job_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Job not found")

    return AnalysisRunStatusResponse(
        id=run.id,
        region_id=run.region_id,
        status=run.status,
        progress=run.progress,
        error_message=run.error_message,
        quality_warnings=run.quality_warnings or [],
        created_at=run.created_at,
        completed_at=run.completed_at
    )

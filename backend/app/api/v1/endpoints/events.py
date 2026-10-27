from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from backend.app.database.session import get_db
from backend.app.services.disaster_events.service import DisasterEventsService

router = APIRouter()

@router.get("/")
def get_historical_events(
    event_type: Optional[str] = Query("all", description="flood, cyclone, landslide, drought, or all"),
    state: Optional[str] = Query(None, description="State name filter"),
    district: Optional[str] = Query(None, description="District name filter"),
    verification_level: Optional[str] = Query(None, description="OFFICIALLY_DOCUMENTED, USER_SUBMITTED, ALGORITHMICALLY_DETECTED"),
    db: Session = Depends(get_db)
):
    """Retrieves verified historical disaster events across India."""
    return DisasterEventsService.get_events(
        db=db,
        event_type=event_type,
        state=state,
        district=district,
        verification_level=verification_level
    )

@router.get("/{event_id}")
def get_event_detail(event_id: str, db: Session = Depends(get_db)):
    """Retrieves metadata for a specific disaster event."""
    event = DisasterEventsService.get_event_by_id(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Disaster event '{event_id}' not found.")
    return {
        "id": event.id,
        "event_id": event.event_id,
        "event_type": event.event_type,
        "event_name": event.event_name,
        "state": event.state,
        "district": event.district,
        "start_date": event.start_date.strftime("%Y-%m-%d"),
        "end_date": event.end_date.strftime("%Y-%m-%d"),
        "source_agency": event.source_agency,
        "source_record_identifier": event.source_record_identifier,
        "supporting_documents": event.supporting_documents,
        "verification_level": event.verification_level,
        "estimated_inundation_sqkm": event.estimated_inundation_sqkm,
        "impact_summary": event.impact_summary,
        "metadata": event.metadata_json,
        "footprint": event.geographic_footprint
    }

@router.get("/{event_id}/assemble")
def auto_assemble_event_evidence(event_id: str, db: Session = Depends(get_db)):
    """
    Selects a historical event and automatically compiles:
    - Pre-event and post-event satellite observations
    - Rainfall records during the event period
    - Water extent change calculations
    - Vegetation and land-cover changes
    - Chronological timeline
    - Report explaining evidence and technical limitations
    """
    res = DisasterEventsService.auto_assemble_event_evidence(db, event_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

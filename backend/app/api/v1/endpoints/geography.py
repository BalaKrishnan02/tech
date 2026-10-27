from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from backend.app.database.session import get_db
from backend.app.services.geography.service import GeographyService
from backend.app.models.entities import AdministrativeBoundary, Region, DataProduct, RainfallObservation

router = APIRouter()

class ValidateGeometryRequest(BaseModel):
    geometry: Dict[str, Any]

@router.get("/states")
def get_all_states(db: Session = Depends(get_db)):
    """Returns all 28 Indian States and 8 Union Territories with centroid, bounding box, and telemetry status."""
    return GeographyService.get_all_states(db)

@router.get("/districts")
def get_districts(
    state_code: str = Query(..., description="Two-letter State/UT code (e.g. TN, KL, MH, DL)"),
    db: Session = Depends(get_db)
):
    """Returns registered districts for a specific State or Union Territory."""
    districts = GeographyService.get_districts_by_state(db, state_code)
    return districts

@router.get("/search")
def search_administrative_units(
    query: str = Query(..., min_length=2, description="Search query by name"),
    db: Session = Depends(get_db)
):
    """Searches administrative units across India (State, UT, District, Subdistrict)."""
    return GeographyService.search_administrative_units(db, query)

@router.get("/boundary/{boundary_id}")
def get_boundary_geojson(boundary_id: str, db: Session = Depends(get_db)):
    """Returns RFC 7946 GeoJSON Feature for an administrative boundary."""
    record = db.query(AdministrativeBoundary).filter(
        (AdministrativeBoundary.id == boundary_id) |
        (AdministrativeBoundary.state_code == boundary_id.upper()) |
        (AdministrativeBoundary.district_code == boundary_id.upper())
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Administrative boundary not found.")

    return record.boundary_geojson

@router.get("/national-overview")
def get_national_overview(db: Session = Depends(get_db)):
    """Returns All-India aggregated summary indicators, telemetry stats, and coverage matrix."""
    return GeographyService.get_national_overview(db)

@router.get("/state-dashboard/{state_code}")
def get_state_dashboard(state_code: str, db: Session = Depends(get_db)):
    """State-level dashboard summarizing districts, active events, and observation telemetry."""
    state_rec = db.query(AdministrativeBoundary).filter(
        AdministrativeBoundary.state_code == state_code.upper(),
        AdministrativeBoundary.admin_level == "state"
    ).first()

    if not state_rec:
        raise HTTPException(status_code=404, detail=f"State code '{state_code}' not found.")

    districts = GeographyService.get_districts_by_state(db, state_code)
    
    # Check observation products matching state
    sat_products = db.query(DataProduct).filter(
        DataProduct.metadata_json["state"].astext == state_rec.state_name
    ).count() if db.bind.dialect.name == "postgresql" else db.query(DataProduct).count()

    return {
        "state_code": state_rec.state_code,
        "state_name": state_rec.state_name,
        "entity_type": state_rec.metadata_json.get("entity_type", "State"),
        "capital": state_rec.metadata_json.get("capital"),
        "area_sqkm": state_rec.area_sqkm,
        "centroid": [state_rec.centroid_lat, state_rec.centroid_lon],
        "bbox": state_rec.bbox,
        "total_monitored_districts": len(districts),
        "districts": districts,
        "data_freshness": {
            "has_observation_data": state_rec.has_observation_data,
            "satellite_passes_indexed": sat_products,
            "latest_satellite_sensor": "Sentinel-1/2 (Copernicus)",
            "rainfall_baseline": "IMD 30-Year Normal Available"
        },
        "provenance": {
            "authority": state_rec.source_provenance,
            "license": state_rec.license,
            "resolution": state_rec.data_resolution
        }
    }

@router.get("/district-dashboard/{district_code}")
def get_district_dashboard(district_code: str, db: Session = Depends(get_db)):
    """District-level drill-down dashboard with flood risk profile and boundaries."""
    dist_rec = db.query(AdministrativeBoundary).filter(
        AdministrativeBoundary.district_code == district_code.upper(),
        AdministrativeBoundary.admin_level == "district"
    ).first()

    if not dist_rec:
        raise HTTPException(status_code=404, detail=f"District code '{district_code}' not found.")

    return {
        "district_code": dist_rec.district_code,
        "district_name": dist_rec.district_name,
        "state_code": dist_rec.state_code,
        "state_name": dist_rec.state_name,
        "area_sqkm": dist_rec.area_sqkm,
        "centroid": [dist_rec.centroid_lat, dist_rec.centroid_lon],
        "bbox": dist_rec.bbox,
        "vulnerability_profile": dist_rec.metadata_json.get("vulnerability_profile", "Moderate"),
        "subdistricts": dist_rec.metadata_json.get("subdistricts", []),
        "has_observation_data": dist_rec.has_observation_data,
        "provenance": dist_rec.source_provenance,
        "boundary_geojson": dist_rec.boundary_geojson
    }

@router.post("/validate-boundary")
def validate_custom_boundary(req: ValidateGeometryRequest):
    """Validates user-submitted custom bounding box or polygon geometry."""
    is_valid, err_msg = GeographyService.validate_geometry(req.geometry)
    if not is_valid:
        raise HTTPException(status_code=400, detail=err_msg)
    return {"valid": True, "message": "Geometry is valid WGS84 polygon within India territory."}

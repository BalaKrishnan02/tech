from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
from typing import Dict, Any, Optional

from backend.app.database.session import get_db
from backend.app.models.entities import Region, AnalysisRun, Report, RainfallObservation, HistoricalEvent
from backend.app.schemas.schemas import ReportCreateRequest
from backend.app.services.reports.service import ReportService
from backend.app.services.rainfall.service import RainfallService
from backend.app.core.config import settings
from backend.app.core.security import get_optional_user_payload, verify_user_ownership

router = APIRouter()

@router.post("/generate")
def create_report(
    payload: ReportCreateRequest,
    current_payload: Optional[Dict[str, Any]] = Depends(get_optional_user_payload),
    db: Session = Depends(get_db)
):
    user_id = current_payload.get("sub") if current_payload else None

    reg = db.query(Region).filter((Region.id == payload.region_id) | (Region.slug == payload.region_id)).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Region not found")

    # Get latest analysis
    analysis = db.query(AnalysisRun).filter(
        AnalysisRun.region_id == reg.id,
        AnalysisRun.status == "completed"
    ).order_by(AnalysisRun.created_at.desc()).first()

    analysis_data = {}
    if analysis:
        analysis_data = {
            "visual_change_percent": analysis.change_result.visual_change_percent if analysis.change_result else "N/A",
            "water_change_percent": analysis.flood_result.water_change_percent if analysis.flood_result else "N/A",
            "newly_detected_water_sqkm": analysis.flood_result.newly_detected_water_sqkm if analysis.flood_result else None,
            "vegetation_loss_percent": analysis.vegetation_result.vegetation_loss_percent if analysis.vegetation_result else "N/A",
            "risk_status": "High Risk"
        }

    rain_records = db.query(RainfallObservation).filter(RainfallObservation.region_id == reg.id).all()
    rainfall_summary = RainfallService.get_accumulation_summary([
        {"rainfall_mm": r.rainfall_mm} for r in rain_records
    ]) if rain_records else None

    report_type = payload.report_type.upper()
    if report_type == "PDF":
        filename = ReportService.generate_pdf_report(
            region_name=reg.name,
            analysis_data=analysis_data,
            rainfall_summary=rainfall_summary,
            state=reg.state,
            district=reg.district
        )
    elif report_type == "CSV":
        filename = ReportService.generate_csv_report(
            region_name=reg.name,
            metrics=analysis_data
        )
    elif report_type == "JSON":
        filename = ReportService.generate_json_report(
            region_name=reg.name,
            full_data={"metrics": analysis_data, "rainfall": rainfall_summary, "region_info": {"id": reg.id, "state": reg.state}}
        )
    elif report_type == "GEOJSON":
        footprint = reg.boundary_geojson or {
            "type": "Polygon",
            "coordinates": [[[reg.longitude - 0.1, reg.latitude - 0.1], [reg.longitude + 0.1, reg.latitude - 0.1], [reg.longitude + 0.1, reg.latitude + 0.1], [reg.longitude - 0.1, reg.latitude + 0.1], [reg.longitude - 0.1, reg.latitude - 0.1]]]
        }
        filename = ReportService.generate_geojson_report(
            region_name=reg.name,
            footprint=footprint,
            properties={"analysis_metrics": analysis_data}
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported report type. Supported: PDF, CSV, JSON, GEOJSON")

    # Save record
    rep_rec = Report(
        user_id=user_id,
        region_id=reg.id,
        analysis_run_id=analysis.id if analysis else None,
        title=payload.title or f"{reg.name} - Disaster Assessment {report_type}",
        report_type=report_type,
        file_path=str(settings.PROCESSED_DIR / filename),
        summary=f"Automated {report_type} assessment report for {reg.name}"
    )
    db.add(rep_rec)
    db.commit()

    return {
        "report_id": rep_rec.id,
        "title": rep_rec.title,
        "filename": filename,
        "report_type": report_type,
        "download_url": f"/api/v1/reports/download/{filename}"
    }

@router.get("/download/{filename}")
def download_report(
    filename: str,
    current_payload: Optional[Dict[str, Any]] = Depends(get_optional_user_payload),
    db: Session = Depends(get_db)
):
    filepath = settings.PROCESSED_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Requested report file not found on server.")

    # Ownership check if report is logged in database
    rep = db.query(Report).filter(Report.file_path.ilike(f"%{filename}")).first()
    if rep and rep.user_id and current_payload:
        verify_user_ownership(rep.user_id, current_payload)

    media_types = {
        ".pdf": "application/pdf",
        ".csv": "text/csv",
        ".json": "application/json",
        ".geojson": "application/geo+json"
    }
    ext = Path(filename).suffix.lower()
    return FileResponse(
        path=str(filepath),
        media_type=media_types.get(ext, "application/octet-stream"),
        filename=filename
    )

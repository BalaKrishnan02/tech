from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.app.models.entities import (
    User, Project, AnalysisRun, UploadedImage, Report,
    DigitalTwinState, ChatbotSession, ChatbotMessage, AuditEvent
)
from backend.app.core.security import verify_user_ownership

class UserPortalService:
    @classmethod
    def get_user_dashboard(cls, db: Session, user_id: str) -> Dict[str, Any]:
        """Assembles personalized dashboard metrics for authenticated user."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User account not found.")

        projects_count = db.query(Project).filter(Project.user_id == user_id, Project.is_archived == False).count()
        runs_count = db.query(AnalysisRun).filter(AnalysisRun.user_id == user_id).count()
        images_count = db.query(UploadedImage).filter(UploadedImage.user_id == user_id).count()
        reports_count = db.query(Report).filter(Report.user_id == user_id).count()

        # Recent analysis runs
        recent_runs = db.query(AnalysisRun).filter(
            AnalysisRun.user_id == user_id
        ).order_by(AnalysisRun.created_at.desc()).limit(5).all()

        return {
            "user_profile": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "role": user.role,
                "organization": user.organization,
                "preferences": user.preferences
            },
            "workspace_statistics": {
                "active_projects": projects_count,
                "total_analyses_executed": runs_count,
                "uploaded_imagery_count": images_count,
                "generated_reports_count": reports_count
            },
            "recent_activity": [
                {
                    "run_id": r.id,
                    "region_id": r.region_id,
                    "project_id": r.project_id,
                    "analysis_type": r.analysis_type,
                    "status": r.status,
                    "progress": r.progress,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                    "completed_at": r.completed_at.isoformat() if r.completed_at else None
                }
                for r in recent_runs
            ]
        }

    @classmethod
    def create_project(
        cls,
        db: Session,
        user_id: str,
        name: str,
        description: Optional[str] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        region_id: Optional[str] = None
    ) -> Project:
        project = Project(
            user_id=user_id,
            name=name,
            description=description,
            state=state,
            district=district,
            region_id=region_id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    @classmethod
    def list_projects(cls, db: Session, user_id: str, include_archived: bool = False) -> List[Dict[str, Any]]:
        query = db.query(Project).filter(Project.user_id == user_id)
        if not include_archived:
            query = query.filter(Project.is_archived == False)
        projects = query.order_by(Project.created_at.desc()).all()

        return [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "state": p.state,
                "district": p.district,
                "region_id": p.region_id,
                "is_archived": p.is_archived,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                "analyses_count": len(p.analyses),
                "images_count": len(p.images)
            }
            for p in projects
        ]

    @classmethod
    def update_project(
        cls,
        db: Session,
        user_id: str,
        project_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_archived: Optional[bool] = None
    ) -> Project:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        if project.user_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden: You do not own this project.")

        if name is not None:
            project.name = name
        if description is not None:
            project.description = description
        if is_archived is not None:
            project.is_archived = is_archived
        project.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(project)
        return project

    @classmethod
    def delete_project(cls, db: Session, user_id: str, project_id: str) -> bool:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        if project.user_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden: You do not own this project.")

        db.delete(project)
        db.commit()
        return True

    @classmethod
    def get_analysis_history(
        cls,
        db: Session,
        user_id: str,
        state: Optional[str] = None,
        district: Optional[str] = None,
        analysis_type: Optional[str] = None,
        status_filter: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves user's private analysis runs with filtering and search.
        Allows reopening past results.
        """
        query = db.query(AnalysisRun).filter(AnalysisRun.user_id == user_id)

        if analysis_type and analysis_type.lower() != "all":
            query = query.filter(AnalysisRun.analysis_type == analysis_type)
        if status_filter:
            query = query.filter(AnalysisRun.status == status_filter)

        runs = query.order_by(AnalysisRun.created_at.desc()).all()
        results = []

        for r in runs:
            # Check state/district through related region if available
            r_name = r.region.name if r.region else r.region_id
            r_state = r.region.state if r.region else ""
            r_district = r.region.district if r.region else ""

            if state and state.lower() not in r_state.lower():
                continue
            if district and district.lower() not in (r_district or "").lower():
                continue
            if search_query:
                sq = search_query.lower()
                if sq not in r_name.lower() and sq not in r.id.lower():
                    continue

            # Gather summary metrics for reopening
            change_pct = r.change_result.visual_change_percent if r.change_result else None
            water_sqkm = r.flood_result.newly_detected_water_sqkm if r.flood_result else None
            veg_loss = r.vegetation_result.vegetation_loss_percent if r.vegetation_result else None

            results.append({
                "id": r.id,
                "project_id": r.project_id,
                "region_id": r.region_id,
                "region_name": r_name,
                "state": r_state,
                "analysis_type": r.analysis_type,
                "model_version": r.model_version,
                "status": r.status,
                "progress": r.progress,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "completed_at": r.completed_at.isoformat() if r.completed_at else None,
                "error_details": r.error_message,
                "metrics_summary": {
                    "visual_change_percent": change_pct,
                    "newly_detected_water_sqkm": water_sqkm,
                    "vegetation_loss_percent": veg_loss
                },
                "before_image_id": r.before_image_id,
                "after_image_id": r.after_image_id,
                "parameters": r.parameters_json
            })

        return results

    @classmethod
    def reopen_analysis_result(cls, db: Session, user_id: str, run_id: str) -> Dict[str, Any]:
        """Reopens full past analysis run for the user with authorization check."""
        run = db.query(AnalysisRun).filter(AnalysisRun.id == run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail="Analysis run not found.")
        # Ensure user owns run or is admin or run is demo/unassigned
        if run.user_id and run.user_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to view this analysis run.")

        return {
            "run_id": run.id,
            "region_id": run.region_id,
            "project_id": run.project_id,
            "analysis_type": run.analysis_type,
            "model_version": run.model_version,
            "status": run.status,
            "created_at": run.created_at.isoformat() if run.created_at else None,
            "completed_at": run.completed_at.isoformat() if run.completed_at else None,
            "parameters": run.parameters_json,
            "change_detection": {
                "difference_map_path": run.change_result.difference_map_path if run.change_result else None,
                "change_mask_path": run.change_result.change_mask_path if run.change_result else None,
                "visual_change_percent": run.change_result.visual_change_percent if run.change_result else 0.0,
                "georeferenced_changed_area_sqkm": run.change_result.georeferenced_changed_area_sqkm if run.change_result else None,
            } if run.change_result else None,
            "flood_analysis": {
                "flood_overlay_path": run.flood_result.flood_overlay_path if run.flood_result else None,
                "newly_detected_water_sqkm": run.flood_result.newly_detected_water_sqkm if run.flood_result else None,
                "water_change_percent": run.flood_result.water_change_percent if run.flood_result else 0.0,
                "confidence_score": run.flood_result.confidence_score if run.flood_result else 0.85
            } if run.flood_result else None,
            "vegetation_analysis": {
                "vegetation_loss_percent": run.vegetation_result.vegetation_loss_percent if run.vegetation_result else None,
                "pre_ndvi_mean": run.vegetation_result.pre_ndvi_mean if run.vegetation_result else None,
                "post_ndvi_mean": run.vegetation_result.post_ndvi_mean if run.vegetation_result else None
            } if run.vegetation_result else None,
            "quality_warnings": run.quality_warnings
        }

    @classmethod
    def export_user_portal_data(cls, db: Session, user_id: str) -> Dict[str, Any]:
        """Exports complete JSON bundle of user's private data, projects, analyses, and history."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        projects = cls.list_projects(db, user_id, include_archived=True)
        analyses = cls.get_analysis_history(db, user_id)
        
        chat_sessions = db.query(ChatbotSession).filter(ChatbotSession.user_id == user_id).all()
        chat_export = []
        for s in chat_sessions:
            chat_export.append({
                "session_id": s.id,
                "title": s.title,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "messages": [
                    {"role": m.role, "content": m.content, "language": m.language, "created_at": m.created_at.isoformat() if m.created_at else None}
                    for m in s.messages
                ]
            })

        return {
            "export_version": "1.0",
            "export_timestamp": datetime.now(timezone.utc).isoformat(),
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "role": user.role,
                "organization": user.organization
            },
            "projects": projects,
            "analyses": analyses,
            "chat_history": chat_export,
            "legal_notice": "Personal data export complying with data privacy and ownership governance."
        }

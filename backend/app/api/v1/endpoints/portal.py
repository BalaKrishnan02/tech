from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from backend.app.database.session import get_db
from backend.app.core.security import get_current_user_payload
from backend.app.services.user_portal.service import UserPortalService

router = APIRouter()

class CreateProjectRequest(BaseModel):
    name: str
    description: Optional[str] = None
    state: Optional[str] = "Tamil Nadu"
    district: Optional[str] = None
    region_id: Optional[str] = None

class UpdateProjectRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_archived: Optional[bool] = None

@router.get("/dashboard")
def get_user_dashboard(
    current_payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """Personalized user dashboard with active workspaces, recent runs, and image assets."""
    user_id = current_payload.get("sub")
    return UserPortalService.get_user_dashboard(db, user_id)

@router.get("/projects")
def list_projects(
    include_archived: bool = Query(False),
    current_payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """Lists private projects owned by the authenticated user."""
    user_id = current_payload.get("sub")
    return UserPortalService.list_projects(db, user_id, include_archived)

@router.post("/projects")
def create_project(
    req: CreateProjectRequest,
    current_payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """Creates a new private project workspace."""
    user_id = current_payload.get("sub")
    p = UserPortalService.create_project(
        db=db,
        user_id=user_id,
        name=req.name,
        description=req.description,
        state=req.state,
        district=req.district,
        region_id=req.region_id
    )
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "state": p.state,
        "district": p.district,
        "region_id": p.region_id,
        "created_at": p.created_at.isoformat()
    }

@router.put("/projects/{project_id}")
def update_project(
    project_id: str,
    req: UpdateProjectRequest,
    current_payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """Updates or archives a user's private project (enforcing ownership authorization)."""
    user_id = current_payload.get("sub")
    p = UserPortalService.update_project(
        db=db,
        user_id=user_id,
        project_id=project_id,
        name=req.name,
        description=req.description,
        is_archived=req.is_archived
    )
    return {
        "id": p.id,
        "name": p.name,
        "is_archived": p.is_archived,
        "updated_at": p.updated_at.isoformat()
    }

@router.delete("/projects/{project_id}")
def delete_project(
    project_id: str,
    current_payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """Deletes a user's project (enforcing ownership authorization)."""
    user_id = current_payload.get("sub")
    UserPortalService.delete_project(db, user_id, project_id)
    return {"message": "Project deleted successfully."}

@router.get("/history")
def get_analysis_history(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    analysis_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """Retrieves authenticated user's private analysis history with multi-parameter filtering."""
    user_id = current_payload.get("sub")
    return UserPortalService.get_analysis_history(
        db=db,
        user_id=user_id,
        state=state,
        district=district,
        analysis_type=analysis_type,
        status_filter=status,
        search_query=search
    )

@router.get("/history/{run_id}/reopen")
def reopen_analysis_result(
    run_id: str,
    current_payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """Reopens past analysis result with full parameters, results, and ownership verification."""
    user_id = current_payload.get("sub")
    return UserPortalService.reopen_analysis_result(db, user_id, run_id)

@router.get("/export")
def export_portal_data(
    current_payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """Exports authenticated user's complete data bundle (projects, analyses, chat) in JSON."""
    user_id = current_payload.get("sub")
    return UserPortalService.export_user_portal_data(db, user_id)

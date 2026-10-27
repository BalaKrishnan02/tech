from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.app.database.session import get_db
from backend.app.models.entities import Alert, Region
from backend.app.schemas.schemas import AlertOut

router = APIRouter()

@router.get("/{region_id}", response_model=List[AlertOut])
def get_alerts_for_region(region_id: str, db: Session = Depends(get_db)):
    reg = db.query(Region).filter((Region.id == region_id) | (Region.slug == region_id)).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Region not found")

    alerts = db.query(Alert).filter(
        Alert.region_id == reg.id,
        Alert.is_dismissed == False
    ).order_by(Alert.created_at.desc()).all()

    return [
        AlertOut(
            id=a.id,
            region_id=a.region_id,
            region_name=reg.name,
            alert_type=a.alert_type,
            severity=a.severity,
            message=a.message,
            message_tamil=a.message_tamil,
            trigger_condition=a.trigger_condition,
            data_source=a.data_source,
            confidence=a.confidence or 0.9,
            is_dismissed=a.is_dismissed,
            created_at=a.created_at
        )
        for a in alerts
    ]

@router.post("/{alert_id}/dismiss")
def dismiss_alert(alert_id: str, db: Session = Depends(get_db)):
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
    a.is_dismissed = True
    db.commit()
    return {"status": "success", "message": "Alert dismissed"}

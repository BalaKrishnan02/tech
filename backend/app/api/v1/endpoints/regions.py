from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.app.database.session import get_db
from backend.app.models.entities import Region
from backend.app.schemas.schemas import RegionOut, RegionCreate

router = APIRouter()

@router.get("/", response_model=List[RegionOut])
def list_regions(db: Session = Depends(get_db)):
    return db.query(Region).filter(Region.is_active == True).all()

@router.get("/{region_id}", response_model=RegionOut)
def get_region(region_id: str, db: Session = Depends(get_db)):
    reg = db.query(Region).filter((Region.id == region_id) | (Region.slug == region_id)).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Region not found")
    return reg

@router.post("/", response_model=RegionOut)
def create_region(payload: RegionCreate, db: Session = Depends(get_db)):
    existing = db.query(Region).filter(Region.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Region with this slug already exists")
    new_reg = Region(
        id=payload.slug,
        slug=payload.slug,
        name=payload.name,
        state=payload.state,
        country=payload.country,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        bbox=payload.bbox
    )
    db.add(new_reg)
    db.commit()
    db.refresh(new_reg)
    return new_reg

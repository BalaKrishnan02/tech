from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from backend.app.database.session import get_db
from backend.app.models.entities import UploadedImage, Region
from backend.app.schemas.schemas import ImageUploadResponse, ImagePairValidationRequest, ImagePairValidationResponse
from backend.app.services.image_upload.service import ImageUploadService

router = APIRouter()

@router.post("/upload", response_model=ImageUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    region_id: str = Form(...),
    image_role: str = Form(...),  # 'before' or 'after'
    disaster_type: str = Form("flood"),
    acquisition_date: str = Form(...),
    image_source: str = Form("Sentinel-2 Optical / UAV"),
    db: Session = Depends(get_db)
):
    reg = db.query(Region).filter((Region.id == region_id) | (Region.slug == region_id)).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Specified study region not found")

    file_bytes = await file.read()
    valid, err_msg = ImageUploadService.validate_file(file.filename, len(file_bytes))
    if not valid:
        raise HTTPException(status_code=400, detail=err_msg)

    try:
        acq_dt = datetime.fromisoformat(acquisition_date.replace("Z", "+00:00"))
    except Exception:
        acq_dt = datetime.utcnow()

    try:
        inspected = ImageUploadService.inspect_and_save(
            file_bytes=file_bytes,
            original_filename=file.filename,
            image_role=image_role,
            disaster_type=disaster_type,
            acquisition_date=acq_dt,
            region_id=reg.id
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    image_rec = UploadedImage(
        id=inspected["id"],
        region_id=reg.id,
        filename=inspected["filename"],
        original_filename=inspected["original_filename"],
        file_path=inspected["file_path"],
        file_size=inspected["file_size"],
        mime_type=inspected["mime_type"],
        image_role=inspected["image_role"],
        disaster_type=inspected["disaster_type"],
        acquisition_date=inspected["acquisition_date"],
        image_source=image_source,
        is_georeferenced=inspected["is_georeferenced"],
        crs=inspected["crs"],
        bounds=inspected["bounds"],
        resolution_meters=inspected["resolution_meters"],
        width=inspected["width"],
        height=inspected["height"],
        bands=inspected["bands"],
        metadata_json=inspected["metadata_json"]
    )
    db.add(image_rec)
    db.commit()

    return ImageUploadResponse(
        id=image_rec.id,
        region_id=image_rec.region_id,
        filename=image_rec.filename,
        original_filename=image_rec.original_filename,
        image_role=image_rec.image_role,
        disaster_type=image_rec.disaster_type,
        acquisition_date=image_rec.acquisition_date,
        is_georeferenced=image_rec.is_georeferenced,
        crs=image_rec.crs,
        bounds=image_rec.bounds,
        resolution_meters=image_rec.resolution_meters,
        width=image_rec.width,
        height=image_rec.height,
        file_size=image_rec.file_size,
        file_url=f"/data/uploads/{image_rec.filename}",
        warnings=inspected["warnings"]
    )

@router.post("/validate-pair", response_model=ImagePairValidationResponse)
def validate_pair(payload: ImagePairValidationRequest, db: Session = Depends(get_db)):
    before_rec = db.query(UploadedImage).filter(UploadedImage.id == payload.before_image_id).first()
    after_rec = db.query(UploadedImage).filter(UploadedImage.id == payload.after_image_id).first()

    if not before_rec or not after_rec:
        raise HTTPException(status_code=404, detail="One or both image IDs could not be found.")

    b_dict = {
        "acquisition_date": before_rec.acquisition_date,
        "width": before_rec.width,
        "height": before_rec.height,
        "is_georeferenced": before_rec.is_georeferenced,
        "crs": before_rec.crs,
        "resolution_meters": before_rec.resolution_meters
    }
    a_dict = {
        "acquisition_date": after_rec.acquisition_date,
        "width": after_rec.width,
        "height": after_rec.height,
        "is_georeferenced": after_rec.is_georeferenced,
        "crs": after_rec.crs,
        "resolution_meters": after_rec.resolution_meters
    }

    result = ImageUploadService.validate_pair(b_dict, a_dict)
    return ImagePairValidationResponse(**result)

@router.get("/by-region/{region_id}", response_model=List[ImageUploadResponse])
def get_images_by_region(region_id: str, db: Session = Depends(get_db)):
    reg = db.query(Region).filter((Region.id == region_id) | (Region.slug == region_id)).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Region not found")
    imgs = db.query(UploadedImage).filter(UploadedImage.region_id == reg.id).order_by(UploadedImage.created_at.desc()).all()
    return [
        ImageUploadResponse(
            id=img.id,
            region_id=img.region_id,
            filename=img.filename,
            original_filename=img.original_filename,
            image_role=img.image_role,
            disaster_type=img.disaster_type,
            acquisition_date=img.acquisition_date,
            is_georeferenced=img.is_georeferenced,
            crs=img.crs,
            bounds=img.bounds,
            resolution_meters=img.resolution_meters,
            width=img.width,
            height=img.height,
            file_size=img.file_size,
            file_url=f"/data/uploads/{img.filename}",
            warnings=[]
        )
        for img in imgs
    ]

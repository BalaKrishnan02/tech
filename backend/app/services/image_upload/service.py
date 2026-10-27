import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Tuple, Dict, Any, List, Optional
from PIL import Image
import numpy as np

try:
    import rasterio
    from rasterio.crs import CRS
    RASTERIO_AVAILABLE = True
except ImportError:
    RASTERIO_AVAILABLE = False

from backend.app.core.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp", ".webp"}
MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB

class ImageUploadService:
    @staticmethod
    def validate_file(filename: str, file_size: int) -> Tuple[bool, Optional[str]]:
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            return False, f"File format '{ext}' is not supported. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        if file_size > MAX_FILE_SIZE_BYTES:
            return False, f"File size exceeds the 100MB limit. Current size: {file_size / (1024*1024):.2f}MB"
        return True, None

    @staticmethod
    def inspect_and_save(
        file_bytes: bytes,
        original_filename: str,
        image_role: str,
        disaster_type: str,
        acquisition_date: datetime,
        region_id: str
    ) -> Dict[str, Any]:
        unique_id = str(uuid.uuid4())
        ext = Path(original_filename).suffix.lower()
        if not ext:
            ext = ".png"
        saved_filename = f"{image_role}_{unique_id}{ext}"
        saved_path = settings.UPLOAD_DIR / saved_filename

        with open(saved_path, "wb") as f:
            f.write(file_bytes)

        is_georeferenced = False
        crs_str = None
        bounds = None
        resolution_meters = None
        width = 0
        height = 0
        bands = 3
        warnings = []
        extra_meta = {}

        # 1. Attempt GeoTIFF extraction if rasterio is available
        if ext in {".tif", ".tiff"} and RASTERIO_AVAILABLE:
            try:
                with rasterio.open(saved_path) as src:
                    width = src.width
                    height = src.height
                    bands = src.count
                    if src.crs:
                        is_georeferenced = True
                        crs_str = str(src.crs)
                        b = src.bounds
                        bounds = [float(b.left), float(b.bottom), float(b.right), float(b.top)]
                        # Calculate pixel resolution in meters
                        res_x, res_y = src.res
                        if src.crs.is_projected:
                            resolution_meters = float((abs(res_x) + abs(res_y)) / 2.0)
                        else:
                            # Rough degree-to-meter conversion at equator/mid-latitudes (~111km)
                            resolution_meters = float(((abs(res_x) + abs(res_y)) / 2.0) * 111320.0)
                        extra_meta["transform"] = [float(x) for x in src.transform][:6]
                        extra_meta["nodata"] = src.nodata
            except Exception as e:
                warnings.append(f"GeoTIFF parsing notice: {str(e)}. Treating as optical standard raster.")

        # 2. Standard image inspection via PIL
        if width == 0 or height == 0:
            try:
                with Image.open(saved_path) as img:
                    width, height = img.size
                    bands = len(img.getbands())
                    extra_meta["format"] = img.format
                    extra_meta["mode"] = img.mode
            except Exception as e:
                if saved_path.exists():
                    saved_path.unlink()
                raise ValueError(f"Corrupt or unreadable image file: {str(e)}")

        if not is_georeferenced:
            warnings.append(
                "Standard optical photograph detected without embedded CRS. Visual change detection will be performed; ground area (sq km) calculations require spatial coordinates or GSD."
            )

        return {
            "id": unique_id,
            "filename": saved_filename,
            "original_filename": original_filename,
            "file_path": str(saved_path),
            "file_size": len(file_bytes),
            "mime_type": f"image/{ext.replace('.', '')}",
            "image_role": image_role,
            "disaster_type": disaster_type,
            "acquisition_date": acquisition_date,
            "is_georeferenced": is_georeferenced,
            "crs": crs_str,
            "bounds": bounds,
            "resolution_meters": resolution_meters,
            "width": width,
            "height": height,
            "bands": bands,
            "metadata_json": extra_meta,
            "warnings": warnings,
        }

    @staticmethod
    def validate_pair(before_img: Dict[str, Any], after_img: Dict[str, Any]) -> Dict[str, Any]:
        warnings = []
        recommendations = []
        date_valid = True

        b_date = before_img["acquisition_date"]
        a_date = after_img["acquisition_date"]

        if isinstance(b_date, str):
            b_date = datetime.fromisoformat(b_date.replace("Z", "+00:00"))
        if isinstance(a_date, str):
            a_date = datetime.fromisoformat(a_date.replace("Z", "+00:00"))

        if a_date <= b_date:
            date_valid = False
            warnings.append(
                f"Date anomaly: After-disaster date ({a_date.strftime('%Y-%m-%d')}) is prior to or identical to Before-disaster date ({b_date.strftime('%Y-%m-%d')}). Please verify timestamps."
            )

        # Dimension compatibility
        b_w, b_h = before_img["width"], before_img["height"]
        a_w, a_h = after_img["width"], after_img["height"]
        aspect_b = b_w / max(1, b_h)
        aspect_a = a_w / max(1, a_h)
        aspect_diff = abs(aspect_b - aspect_a)

        dim_status = "Exact match"
        if b_w == a_w and b_h == a_h:
            dim_status = "Exact match"
        elif aspect_diff < 0.05:
            dim_status = "Scalable proportional match"
            recommendations.append("Images have matching aspect ratios and will be automatically scaled for comparison.")
        else:
            dim_status = "Aspect ratio mismatch"
            warnings.append(
                f"Dimension aspect ratio discrepancy ({b_w}x{b_h} vs {a_w}x{a_h}). Computer vision alignment will attempt homography, but perspective distortion may affect accuracy."
            )

        # Spatial Reference check
        spatial_status = "Unreferenced standard imagery"
        if before_img.get("is_georeferenced") and after_img.get("is_georeferenced"):
            spatial_status = "Both images georeferenced"
            if before_img.get("crs") != after_img.get("crs"):
                warnings.append(
                    f"CRS difference: Before image is '{before_img.get('crs')}', After image is '{after_img.get('crs')}'. Coordinate reprojection will be applied."
                )
        elif before_img.get("is_georeferenced") or after_img.get("is_georeferenced"):
            spatial_status = "Partial spatial reference"
            warnings.append("One image is georeferenced while the other is an ordinary photograph. Direct geospatial overlap is limited.")

        res_b = before_img.get("resolution_meters") or 10.0
        res_a = after_img.get("resolution_meters") or 10.0
        res_ratio = max(res_b, res_a) / max(0.1, min(res_b, res_a))
        if res_ratio > 3.0:
            warnings.append(f"High resolution difference (ratio ~{res_ratio:.1f}x). Smaller features in the higher resolution image may register as changes.")

        can_proceed = True
        return {
            "is_valid": len(warnings) == 0,
            "can_proceed": can_proceed,
            "before_acquisition_date": b_date,
            "after_acquisition_date": a_date,
            "date_order_valid": date_valid,
            "dimension_compatibility": dim_status,
            "spatial_reference_status": spatial_status,
            "resolution_ratio": float(res_ratio),
            "warnings": warnings,
            "recommendations": recommendations
        }

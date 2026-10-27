import os
import cv2
import numpy as np
from PIL import Image
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import uuid

from backend.app.core.config import settings

class ImageComparisonService:
    @staticmethod
    def align_images_opencv(img_before: np.ndarray, img_after: np.ndarray) -> Tuple[np.ndarray, str, float, list]:
        """
        Attempts ORB feature-based homography alignment between before and after images.
        Returns: (aligned_before, alignment_method, quality_score, warnings)
        """
        warnings = []
        h_after, w_after = img_after.shape[:2]
        
        # Convert to grayscale for feature detection
        gray_b = cv2.cvtColor(img_before, cv2.COLOR_BGR2GRAY) if len(img_before.shape) == 3 else img_before
        gray_a = cv2.cvtColor(img_after, cv2.COLOR_BGR2GRAY) if len(img_after.shape) == 3 else img_after

        # Initialize ORB detector
        orb = cv2.ORB_create(nfeatures=2000, scaleFactor=1.2, nlevels=8)
        kp_b, desc_b = orb.detectAndCompute(gray_b, None)
        kp_a, desc_a = orb.detectAndCompute(gray_a, None)

        if desc_b is None or desc_a is None or len(kp_b) < 10 or len(kp_a) < 10:
            warnings.append("Insufficient stable keypoints found for feature-based homography. Using direct aspect-ratio resizing.")
            aligned_before = cv2.resize(img_before, (w_after, h_after), interpolation=cv2.INTER_AREA)
            return aligned_before, "direct_resizing_fallback", 0.60, warnings

        matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = matcher.match(desc_b, desc_a)
        matches = sorted(matches, key=lambda x: x.distance)

        # Select top matches
        good_matches = matches[:max(20, int(len(matches) * 0.3))]
        if len(good_matches) < 8:
            warnings.append("Low feature match count between before and after imagery. Falling back to dimensional alignment.")
            aligned_before = cv2.resize(img_before, (w_after, h_after), interpolation=cv2.INTER_AREA)
            return aligned_before, "low_matches_fallback", 0.65, warnings

        src_pts = np.float32([kp_b[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        dst_pts = np.float32([kp_a[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

        homography, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
        if homography is None:
            warnings.append("RANSAC homography estimation was degenerate. Using proportional resize.")
            aligned_before = cv2.resize(img_before, (w_after, h_after), interpolation=cv2.INTER_AREA)
            return aligned_before, "homography_failed_resize", 0.70, warnings

        # Inlier ratio as quality score
        inliers = np.sum(mask) if mask is not None else 0
        inlier_ratio = inliers / max(1, len(good_matches))
        quality_score = float(min(1.0, max(0.5, 0.5 + inlier_ratio * 0.5)))

        aligned_before = cv2.warpPerspective(img_before, homography, (w_after, h_after))
        return aligned_before, "orb_ransac_homography", quality_score, warnings

    @classmethod
    def compare_images(
        cls,
        before_file_path: str,
        after_file_path: str,
        is_georeferenced: bool = False,
        resolution_meters: Optional[float] = None
    ) -> Dict[str, Any]:
        before_path = Path(before_file_path)
        after_path = Path(after_file_path)

        if not before_path.exists() or not after_path.exists():
            raise FileNotFoundError("One or both input image files could not be located on disk.")

        # Load images via OpenCV
        img_b = cv2.imread(str(before_path))
        img_a = cv2.imread(str(after_path))

        if img_b is None or img_a is None:
            raise ValueError("Failed to decode image data into raster array.")

        warnings = []
        # Step 1: Align
        aligned_b, method, quality_score, align_warnings = cls.align_images_opencv(img_b, img_a)
        warnings.extend(align_warnings)

        # Step 2: Compute Difference Map
        # Convert to Grayscale & Gaussian blur to suppress noise
        gray_b = cv2.cvtColor(aligned_b, cv2.COLOR_BGR2GRAY)
        gray_a = cv2.cvtColor(img_a, cv2.COLOR_BGR2GRAY)

        blur_b = cv2.GaussianBlur(gray_b, (7, 7), 0)
        blur_a = cv2.GaussianBlur(gray_a, (7, 7), 0)

        diff_abs = cv2.absdiff(blur_b, blur_a)

        # Adaptive Otsu thresholding + morphological cleanup for change mask
        _, thresh = cv2.threshold(diff_abs, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        change_mask = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
        change_mask = cv2.morphologyEx(change_mask, cv2.MORPH_CLOSE, kernel)

        # Calculate visual change percentage
        total_pixels = change_mask.shape[0] * change_mask.shape[1]
        changed_pixels = int(np.count_nonzero(change_mask))
        visual_change_percent = float(round((changed_pixels / max(1, total_pixels)) * 100.0, 2))

        # Georeferenced area calculation (sq km)
        changed_area_sqkm = None
        if resolution_meters and resolution_meters > 0:
            pixel_area_sqm = resolution_meters * resolution_meters
            changed_area_sqm = changed_pixels * pixel_area_sqm
            changed_area_sqkm = float(round(changed_area_sqm / 1_000_000.0, 4))
        else:
            warnings.append("Pixel ground sampling distance unknown; real-world area in sq km cannot be certified.")

        # Step 3: Color Heatmap Generation
        norm_diff = cv2.normalize(diff_abs, None, 0, 255, cv2.NORM_MINMAX)
        heatmap = cv2.applyColorMap(norm_diff, cv2.COLORMAP_JET)

        # Step 4: Overlay Heatmap on After Image
        alpha = 0.45
        heatmap_overlay = cv2.addWeighted(img_a, 1.0 - alpha, heatmap, alpha, 0)

        # Step 5: Save processed artifacts
        run_uuid = str(uuid.uuid4())[:8]
        diff_filename = f"diff_{run_uuid}.png"
        mask_filename = f"mask_{run_uuid}.png"
        overlay_filename = f"overlay_{run_uuid}.png"

        diff_path = settings.PROCESSED_DIR / diff_filename
        mask_path = settings.PROCESSED_DIR / mask_filename
        overlay_path = settings.PROCESSED_DIR / overlay_filename

        cv2.imwrite(str(diff_path), heatmap)
        cv2.imwrite(str(mask_path), change_mask)
        cv2.imwrite(str(overlay_path), heatmap_overlay)

        return {
            "difference_map_path": str(diff_path),
            "difference_map_filename": diff_filename,
            "change_mask_path": str(mask_path),
            "change_mask_filename": mask_filename,
            "heatmap_overlay_path": str(overlay_path),
            "heatmap_overlay_filename": overlay_filename,
            "visual_change_percent": visual_change_percent,
            "georeferenced_changed_area_sqkm": changed_area_sqkm,
            "alignment_method": method,
            "alignment_quality_score": quality_score,
            "total_pixels": total_pixels,
            "changed_pixels": changed_pixels,
            "warnings": warnings,
            "metrics": {
                "mean_diff_intensity": float(round(np.mean(diff_abs), 2)),
                "max_diff_intensity": int(np.max(diff_abs)),
                "std_diff": float(round(np.std(diff_abs), 2)),
                "inlier_alignment_score": quality_score,
            }
        }

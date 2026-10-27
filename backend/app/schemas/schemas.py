from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class RegionBase(BaseModel):
    name: str
    state: str = "Tamil Nadu"
    country: str = "India"
    description: Optional[str] = None
    latitude: float
    longitude: float
    bbox: Optional[List[float]] = None

class RegionCreate(RegionBase):
    slug: str

class RegionOut(RegionBase):
    id: str
    slug: str
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

class ImageUploadResponse(BaseModel):
    id: str
    region_id: str
    filename: str
    original_filename: str
    image_role: str
    disaster_type: str
    acquisition_date: datetime
    is_georeferenced: bool
    crs: Optional[str] = None
    bounds: Optional[List[float]] = None
    resolution_meters: Optional[float] = None
    width: int
    height: int
    file_size: int
    file_url: str
    warnings: List[str] = []

class ImagePairValidationRequest(BaseModel):
    before_image_id: str
    after_image_id: str

class ImagePairValidationResponse(BaseModel):
    is_valid: bool
    can_proceed: bool
    before_acquisition_date: datetime
    after_acquisition_date: datetime
    date_order_valid: bool
    dimension_compatibility: str
    spatial_reference_status: str
    resolution_ratio: float
    warnings: List[str] = []
    recommendations: List[str] = []

class AnalysisRunRequest(BaseModel):
    region_id: str
    before_image_id: str
    after_image_id: str
    analysis_type: str = "comprehensive"  # comprehensive, change_detection, flood, ndvi, land_cover
    project_id: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class AnalysisRunStatusResponse(BaseModel):
    id: str
    region_id: str
    status: str
    progress: float
    error_message: Optional[str] = None
    quality_warnings: List[str] = []
    created_at: datetime
    completed_at: Optional[datetime] = None

class ChangeDetectionOut(BaseModel):
    id: str
    difference_map_url: str
    change_mask_url: str
    heatmap_overlay_url: Optional[str] = None
    visual_change_percent: float
    georeferenced_changed_area_sqkm: Optional[float] = None
    alignment_method: str
    alignment_quality_score: float
    metrics: Dict[str, Any] = {}

class FloodAnalysisOut(BaseModel):
    id: str
    flood_overlay_url: str
    baseline_water_extent_sqkm: Optional[float] = None
    current_water_extent_sqkm: Optional[float] = None
    newly_detected_water_sqkm: Optional[float] = None
    water_change_percent: float
    confidence_score: float
    method_used: str
    limitations: List[str] = []
    is_potential_flood: bool

class VegetationOut(BaseModel):
    id: str
    pre_ndvi_mean: Optional[float] = None
    post_ndvi_mean: Optional[float] = None
    ndvi_change_delta: Optional[float] = None
    vegetation_loss_percent: Optional[float] = None
    ndvi_map_url: Optional[str] = None
    trend_data: List[Dict[str, Any]] = []

class LandCoverOut(BaseModel):
    id: str
    class_proportions_before: Dict[str, float] = {}
    class_proportions_after: Dict[str, float] = {}
    transition_matrix: Dict[str, Any] = {}
    model_version: str
    classification_raster_url: Optional[str] = None
    overall_accuracy: Optional[float] = None

class ComprehensiveAnalysisOut(BaseModel):
    run_id: str
    region_id: str
    region_name: str
    status: str
    before_image: ImageUploadResponse
    after_image: ImageUploadResponse
    change_detection: Optional[ChangeDetectionOut] = None
    flood_analysis: Optional[FloodAnalysisOut] = None
    vegetation_analysis: Optional[VegetationOut] = None
    land_cover_analysis: Optional[LandCoverOut] = None
    plain_language_summary: str
    summary_tamil: str
    quality_warnings: List[str] = []

class RainfallRecordOut(BaseModel):
    id: str
    region_id: str
    provider: str
    product_identifier: str
    observation_date: datetime
    accumulation_period_hours: int
    rainfall_mm: float
    temperature_c: Optional[float] = None
    spatial_resolution: str
    units: str
    is_demo: bool

class DigitalTwinStateOut(BaseModel):
    id: str
    region_id: str
    region_name: str
    version: int
    state_timestamp: datetime
    flood_extent_sqkm: Optional[float] = None
    vegetation_health_score: Optional[float] = None
    rainfall_total_mm: Optional[float] = None
    land_use_change_percent: Optional[float] = None
    overall_risk_status: str
    risk_score: Optional[float] = None
    risk_formula_details: Optional[str] = None
    state_summary: Dict[str, Any] = {}
    previous_state_id: Optional[str] = None
    is_current: bool

class AlertOut(BaseModel):
    id: str
    region_id: str
    region_name: Optional[str] = None
    alert_type: str
    severity: str
    message: str
    message_tamil: str
    trigger_condition: str
    data_source: str
    confidence: float
    is_dismissed: bool
    created_at: datetime

class ChatMessageRequest(BaseModel):
    session_id: Optional[str] = None
    region_id: Optional[str] = None
    message: str
    language: str = "auto"  # 'ta', 'en', 'tanglish', 'auto'

class ChatMessageResponse(BaseModel):
    session_id: str
    role: str = "assistant"
    content: str
    language: str
    audio_url: Optional[str] = None
    evidence_sources: List[Dict[str, Any]] = []
    is_evidence_complete: bool
    missing_data_explanation: Optional[str] = None
    created_at: datetime

class ReportCreateRequest(BaseModel):
    region_id: str
    analysis_run_id: Optional[str] = None
    report_type: str = "PDF"  # PDF, CSV, JSON
    title: Optional[str] = None

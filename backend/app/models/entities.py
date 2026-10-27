from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from backend.app.database.session import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# -------------------------------------------------------------
# USER ACCOUNTS & WORKSPACES
# -------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    email = Column(String(128), unique=True, index=True, nullable=False)
    username = Column(String(64), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    full_name = Column(String(128), nullable=False)
    role = Column(String(32), default="analyst")  # 'analyst', 'admin', 'viewer'
    is_active = Column(Boolean, default=True)
    organization = Column(String(128), nullable=True)
    preferences = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    analyses = relationship("AnalysisRun", back_populates="user")
    images = relationship("UploadedImage", back_populates="user")
    reports = relationship("Report", back_populates="user")
    chat_sessions = relationship("ChatbotSession", back_populates="user")
    digital_twin_states = relationship("DigitalTwinState", back_populates="user")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    session_token = Column(String(512), index=True, nullable=False)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(256), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    state = Column(String(64), nullable=True)
    district = Column(String(64), nullable=True)
    region_id = Column(String(64), ForeignKey("regions.id"), nullable=True)
    is_archived = Column(Boolean, default=False)
    settings_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="projects")
    analyses = relationship("AnalysisRun", back_populates="project")
    images = relationship("UploadedImage", back_populates="project")
    reports = relationship("Report", back_populates="project")
    digital_twin_states = relationship("DigitalTwinState", back_populates="project")


# -------------------------------------------------------------
# GEOGRAPHIC HIERARCHY & ADMINISTRATIVE BOUNDARIES
# -------------------------------------------------------------

class AdministrativeBoundary(Base):
    __tablename__ = "administrative_boundaries"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    country = Column(String(32), default="India")
    state_name = Column(String(64), index=True, nullable=False)
    state_code = Column(String(16), index=True, nullable=False)  # TN, KL, MH, DL, etc.
    district_name = Column(String(64), nullable=True, index=True)
    district_code = Column(String(16), nullable=True, index=True)
    subdistrict_name = Column(String(64), nullable=True)
    admin_level = Column(String(32), default="district")  # 'country', 'state', 'district', 'subdistrict', 'village', 'custom'
    lgd_code = Column(String(32), nullable=True, index=True)  # Local Government Directory code
    centroid_lat = Column(Float, nullable=False)
    centroid_lon = Column(Float, nullable=False)
    bbox = Column(JSON, nullable=True)  # [min_lat, min_lon, max_lat, max_lon]
    boundary_geojson = Column(JSON, nullable=True)  # GeoJSON Geometry Polygon / MultiPolygon
    area_sqkm = Column(Float, nullable=True)
    source_provenance = Column(String(128), default="Local Government Directory (LGD) / Survey of India")
    license = Column(String(64), default="ODbL / Open Data India")
    data_resolution = Column(String(64), default="1:50,000 Administrative Vector")
    has_observation_data = Column(Boolean, default=False)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class Region(Base):
    __tablename__ = "regions"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    slug = Column(String(64), unique=True, index=True)
    name = Column(String(128), nullable=False)
    state = Column(String(64), default="Tamil Nadu")
    state_code = Column(String(16), nullable=True)
    country = Column(String(64), default="India")
    district = Column(String(64), nullable=True)
    subdistrict = Column(String(64), nullable=True)
    admin_level = Column(String(32), default="basin")
    lgd_code = Column(String(32), nullable=True)
    area_sqkm = Column(Float, nullable=True)
    parent_id = Column(String(64), nullable=True)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    bbox = Column(JSON, nullable=True)  # [min_lat, min_lon, max_lat, max_lon]
    boundary_geojson = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    images = relationship("UploadedImage", back_populates="region", cascade="all, delete-orphan")
    analyses = relationship("AnalysisRun", back_populates="region", cascade="all, delete-orphan")
    digital_twin_states = relationship("DigitalTwinState", back_populates="region", cascade="all, delete-orphan")
    rainfall_records = relationship("RainfallObservation", back_populates="region", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="region", cascade="all, delete-orphan")


# -------------------------------------------------------------
# SATELLITE DATA PRODUCTS & HISTORICAL OBSERVATION CATALOG
# -------------------------------------------------------------

class DataProduct(Base):
    __tablename__ = "data_products"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    product_id = Column(String(256), unique=True, index=True, nullable=False)  # Sentinel/Landsat official ID
    provider = Column(String(64), default="Copernicus_CDSE")  # Copernicus_CDSE, USGS, NASA
    mission = Column(String(32), nullable=False)  # Sentinel-1, Sentinel-2, Landsat-8, Landsat-9
    acquisition_timestamp = Column(DateTime, index=True, nullable=False)
    processing_level = Column(String(32), default="L2A")  # L2A (BOA), L1C (TOA), GRD_IW (SAR)
    geographic_footprint = Column(JSON, nullable=True)  # GeoJSON Polygon
    spatial_resolution = Column(String(64), default="10m Optical")
    cloud_cover_percent = Column(Float, nullable=True)
    polarizations = Column(String(32), nullable=True)  # VV, VH, VV+VH
    orbit_direction = Column(String(16), nullable=True)  # ASCENDING, DESCENDING
    relative_orbit = Column(Integer, nullable=True)
    download_url = Column(String(512), nullable=True)
    access_url = Column(String(512), nullable=True)
    local_path = Column(String(512), nullable=True)
    retrieval_timestamp = Column(DateTime, default=datetime.utcnow)
    processing_status = Column(String(32), default="available")  # cataloged, downloading, available, processed, failed, unavailable
    license_attribution = Column(String(128), default="Copernicus Sentinel data / ESA CC-BY-SA 3.0 IGO")
    file_size_mb = Column(Float, nullable=True)
    is_demo = Column(Boolean, default=False)
    checksum = Column(String(64), nullable=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


# -------------------------------------------------------------
# HISTORICAL FLOOD & DISASTER EVENT REGISTRY
# -------------------------------------------------------------

class HistoricalEvent(Base):
    __tablename__ = "historical_events"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    event_id = Column(String(64), unique=True, index=True, nullable=False)
    event_type = Column(String(64), default="flood")  # flood, cyclone, landslide, drought, wildfire
    event_name = Column(String(128), nullable=False)
    state = Column(String(64), index=True, nullable=False)
    district = Column(String(64), nullable=True, index=True)
    geographic_footprint = Column(JSON, nullable=True)
    start_date = Column(DateTime, index=True, nullable=False)
    end_date = Column(DateTime, index=True, nullable=False)
    source_agency = Column(String(128), default="NDMA / CWC / IMD")
    source_record_identifier = Column(String(128), nullable=True)
    supporting_documents = Column(JSON, default=list)
    event_status = Column(String(32), default="concluded")
    verification_level = Column(String(32), default="OFFICIALLY_DOCUMENTED")  # OFFICIALLY_DOCUMENTED, USER_SUBMITTED, ALGORITHMICALLY_DETECTED
    estimated_inundation_sqkm = Column(Float, nullable=True)
    impact_summary = Column(Text, nullable=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


# -------------------------------------------------------------
# UPLOADED IMAGES & MULTI-TEMPORAL RASTER ARTIFACTS
# -------------------------------------------------------------

class UploadedImage(Base):
    __tablename__ = "uploaded_images"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    region_id = Column(String(64), ForeignKey("regions.id"), nullable=False)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=True)
    filename = Column(String(256), nullable=False)
    original_filename = Column(String(256), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(64), nullable=False)
    
    # Metadata
    image_role = Column(String(32), nullable=False)  # 'before', 'after', 'standalone'
    disaster_type = Column(String(64), default="flood")
    acquisition_date = Column(DateTime, nullable=False)
    image_source = Column(String(128), default="Sentinel-2 Optical / UAV")
    
    # Geospatial Metadata
    is_georeferenced = Column(Boolean, default=False)
    crs = Column(String(64), nullable=True)
    bounds = Column(JSON, nullable=True)  # [min_x, min_y, max_x, max_y]
    resolution_meters = Column(Float, nullable=True)
    
    # Raster Dimensions
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    bands = Column(Integer, default=3)
    metadata_json = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    region = relationship("Region", back_populates="images")
    user = relationship("User", back_populates="images")
    project = relationship("Project", back_populates="images")


# -------------------------------------------------------------
# ANALYSIS RUNS & ALGORITHMIC RESULTS
# -------------------------------------------------------------

class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    region_id = Column(String(64), ForeignKey("regions.id"), nullable=False)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=True)
    before_image_id = Column(String(64), ForeignKey("uploaded_images.id"), nullable=True)
    after_image_id = Column(String(64), ForeignKey("uploaded_images.id"), nullable=True)
    
    analysis_type = Column(String(64), default="comprehensive")  # change_detection, flood, ndvi, land_cover, comprehensive, multi_year
    parameters_json = Column(JSON, default=dict)
    model_version = Column(String(64), default="v1.0-cv-spectral")
    status = Column(String(32), default="pending")  # pending, running, completed, failed
    progress = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    quality_warnings = Column(JSON, default=list)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    region = relationship("Region", back_populates="analyses")
    user = relationship("User", back_populates="analyses")
    project = relationship("Project", back_populates="analyses")
    before_image = relationship("UploadedImage", foreign_keys=[before_image_id])
    after_image = relationship("UploadedImage", foreign_keys=[after_image_id])
    
    change_result = relationship("ChangeDetectionResult", back_populates="analysis_run", uselist=False, cascade="all, delete-orphan")
    flood_result = relationship("FloodAnalysisResult", back_populates="analysis_run", uselist=False, cascade="all, delete-orphan")
    vegetation_result = relationship("VegetationResult", back_populates="analysis_run", uselist=False, cascade="all, delete-orphan")
    land_cover_result = relationship("LandCoverResult", back_populates="analysis_run", uselist=False, cascade="all, delete-orphan")


class ChangeDetectionResult(Base):
    __tablename__ = "change_detection_results"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    analysis_run_id = Column(String(64), ForeignKey("analysis_runs.id"), nullable=False)
    
    difference_map_path = Column(String(512), nullable=False)
    change_mask_path = Column(String(512), nullable=False)
    heatmap_overlay_path = Column(String(512), nullable=True)
    
    visual_change_percent = Column(Float, nullable=False)
    georeferenced_changed_area_sqkm = Column(Float, nullable=True)
    alignment_method = Column(String(64), default="feature_matching")
    alignment_quality_score = Column(Float, default=1.0)
    metrics_json = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    analysis_run = relationship("AnalysisRun", back_populates="change_result")


class FloodAnalysisResult(Base):
    __tablename__ = "flood_analysis_results"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    analysis_run_id = Column(String(64), ForeignKey("analysis_runs.id"), nullable=False)
    
    flood_overlay_path = Column(String(512), nullable=False)
    baseline_water_extent_sqkm = Column(Float, nullable=True)
    current_water_extent_sqkm = Column(Float, nullable=True)
    newly_detected_water_sqkm = Column(Float, nullable=True)
    water_change_percent = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.85)
    method_used = Column(String(64), default="ndwi_and_adaptive_threshold")
    limitations = Column(JSON, default=list)
    is_potential_flood = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    analysis_run = relationship("AnalysisRun", back_populates="flood_result")


class VegetationResult(Base):
    __tablename__ = "vegetation_results"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    analysis_run_id = Column(String(64), ForeignKey("analysis_runs.id"), nullable=False)
    
    pre_ndvi_mean = Column(Float, nullable=True)
    post_ndvi_mean = Column(Float, nullable=True)
    ndvi_change_delta = Column(Float, nullable=True)
    vegetation_loss_percent = Column(Float, nullable=True)
    ndvi_map_path = Column(String(512), nullable=True)
    trend_data = Column(JSON, default=list)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    analysis_run = relationship("AnalysisRun", back_populates="vegetation_result")


class LandCoverResult(Base):
    __tablename__ = "land_cover_results"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    analysis_run_id = Column(String(64), ForeignKey("analysis_runs.id"), nullable=False)
    
    class_proportions_before = Column(JSON, default=dict)
    class_proportions_after = Column(JSON, default=dict)
    transition_matrix = Column(JSON, default=dict)
    model_version = Column(String(64), default="rf_v1.0")
    classification_raster_path = Column(String(512), nullable=True)
    overall_accuracy = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    analysis_run = relationship("AnalysisRun", back_populates="land_cover_result")


# -------------------------------------------------------------
# HISTORICAL RAINFALL & CLIMATE OBSERVATIONS
# -------------------------------------------------------------

class RainfallObservation(Base):
    __tablename__ = "rainfall_observations"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    region_id = Column(String(64), ForeignKey("regions.id"), nullable=False)
    provider = Column(String(64), default="NASA_GPM_IMERG")
    product_identifier = Column(String(128), default="3B-HHR.MS.MRG.3IMERG")
    observation_date = Column(DateTime, nullable=False, index=True)
    accumulation_period_hours = Column(Integer, default=24)
    measurement_type = Column(String(32), default="ACCUMULATION_24H")  # ACCUMULATION_24H, ACCUMULATION_MONTHLY, RATE_HOURLY
    rainfall_mm = Column(Float, nullable=False)
    temperature_c = Column(Float, nullable=True)
    baseline_normal_mm = Column(Float, nullable=True)
    anomaly_percent = Column(Float, nullable=True)
    spatial_resolution = Column(String(64), default="0.1 deg (~10km)")
    units = Column(String(16), default="mm")
    quality_flag = Column(String(32), default="MEASURED")  # MEASURED, CALCULATED_SUM, INTERPOLATED_FALLBACK, MISSING_RECORD
    is_missing = Column(Boolean, default=False)
    is_demo = Column(Boolean, default=False)
    raw_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    region = relationship("Region", back_populates="rainfall_records")


# -------------------------------------------------------------
# DIGITAL TWIN STATES & RISK ASSESSMENT
# -------------------------------------------------------------

class DigitalTwinState(Base):
    __tablename__ = "digital_twin_states"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    region_id = Column(String(64), ForeignKey("regions.id"), nullable=False)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=True)
    version = Column(Integer, default=1)
    state_timestamp = Column(DateTime, default=datetime.utcnow)
    
    before_image_id = Column(String(64), nullable=True)
    after_image_id = Column(String(64), nullable=True)
    
    # State Indicators
    flood_extent_sqkm = Column(Float, nullable=True)
    vegetation_health_score = Column(Float, nullable=True)
    rainfall_total_mm = Column(Float, nullable=True)
    land_use_change_percent = Column(Float, nullable=True)
    
    # Risk Assessment
    overall_risk_status = Column(String(32), default="Not analysed yet")  # Low, Moderate, High, Critical, Not analysed yet
    risk_score = Column(Float, nullable=True)  # 0 to 100
    risk_formula_details = Column(Text, nullable=True)
    
    state_summary = Column(JSON, default=dict)
    previous_state_id = Column(String(64), nullable=True)
    is_current = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    region = relationship("Region", back_populates="digital_twin_states")
    user = relationship("User", back_populates="digital_twin_states")
    project = relationship("Project", back_populates="digital_twin_states")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    region_id = Column(String(64), ForeignKey("regions.id"), nullable=False)
    alert_type = Column(String(64), nullable=False)  # water_surge, extreme_rainfall, vegetation_loss, data_warning
    severity = Column(String(16), default="warning")  # info, warning, critical
    message = Column(String(256), nullable=False)
    message_tamil = Column(String(512), nullable=False)
    trigger_condition = Column(String(256), nullable=False)
    data_source = Column(String(128), default="Sentinel Satellite & GPM")
    confidence = Column(Float, default=0.90)
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    region = relationship("Region", back_populates="alerts")


# -------------------------------------------------------------
# CHATBOT SESSIONS & MESSAGES (WITH USER ISOLATION)
# -------------------------------------------------------------

class ChatbotSession(Base):
    __tablename__ = "chatbot_sessions"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=True)
    region_id = Column(String(64), ForeignKey("regions.id"), nullable=True)
    title = Column(String(128), default="New Chat Session")
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatbotMessage", back_populates="session", cascade="all, delete-orphan")


class ChatbotMessage(Base):
    __tablename__ = "chatbot_messages"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    session_id = Column(String(64), ForeignKey("chatbot_sessions.id"), nullable=False)
    role = Column(String(16), nullable=False)  # 'user', 'assistant', 'system'
    content = Column(Text, nullable=False)
    language = Column(String(16), default="ta")  # 'ta', 'en', 'tanglish'
    audio_path = Column(String(512), nullable=True)
    evidence_sources = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatbotSession", back_populates="messages")


# -------------------------------------------------------------
# REPORTS & EXPORTS
# -------------------------------------------------------------

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    region_id = Column(String(64), ForeignKey("regions.id"), nullable=False)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=True)
    event_id = Column(String(64), ForeignKey("historical_events.id"), nullable=True)
    analysis_run_id = Column(String(64), ForeignKey("analysis_runs.id"), nullable=True)
    title = Column(String(256), nullable=False)
    report_type = Column(String(16), default="PDF")  # PDF, CSV, JSON, GeoJSON
    file_path = Column(String(512), nullable=False)
    summary = Column(Text, nullable=True)
    methodology = Column(Text, nullable=True)
    parameters_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reports")
    project = relationship("Project", back_populates="reports")


# -------------------------------------------------------------
# AUDIT LOGGING & BACKGROUND INGESTION JOBS
# -------------------------------------------------------------

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), nullable=True, index=True)
    action = Column(String(64), nullable=False)
    resource_type = Column(String(64), nullable=True)
    resource_id = Column(String(64), nullable=True)
    ip_address = Column(String(64), nullable=True)
    details_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    job_name = Column(String(128), nullable=False)
    provider = Column(String(64), nullable=False)
    dataset_type = Column(String(64), nullable=False)  # satellite_search, rainfall_backfill, boundary_sync
    geographic_scope = Column(JSON, default=dict)
    date_range_start = Column(DateTime, nullable=True)
    date_range_end = Column(DateTime, nullable=True)
    status = Column(String(32), default="queued")  # queued, running, completed, failed, cancelled
    progress_percent = Column(Float, default=0.0)
    records_ingested = Column(Integer, default=0)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    error_summary = Column(Text, nullable=True)
    log_messages = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    model_name = Column(String(128), nullable=False)
    version = Column(String(32), nullable=False)
    model_type = Column(String(64), nullable=False)
    file_path = Column(String(512), nullable=False)
    training_dataset_info = Column(JSON, default=dict)
    metrics_json = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

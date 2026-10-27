export interface Region {
  id: string;
  slug: string;
  name: string;
  state: string;
  country: string;
  description?: string;
  latitude: number;
  longitude: number;
  bbox?: [number, number, number, number];
  is_active: boolean;
}

export interface UploadedImageInfo {
  id: string;
  region_id: string;
  filename: string;
  original_filename: string;
  image_role: 'before' | 'after' | 'standalone';
  disaster_type: string;
  acquisition_date: string;
  is_georeferenced: boolean;
  crs?: string;
  bounds?: [number, number, number, number];
  resolution_meters?: number;
  width: number;
  height: number;
  file_size: number;
  file_url: string;
  warnings?: string[];
}

export interface PairValidationResult {
  is_valid: boolean;
  can_proceed: boolean;
  before_acquisition_date: string;
  after_acquisition_date: string;
  date_order_valid: boolean;
  dimension_compatibility: string;
  spatial_reference_status: string;
  resolution_ratio: number;
  warnings: string[];
  recommendations: string[];
}

export interface ChangeDetectionResult {
  id: string;
  difference_map_url: string;
  change_mask_url: string;
  heatmap_overlay_url?: string;
  visual_change_percent: number;
  georeferenced_changed_area_sqkm?: number;
  alignment_method: string;
  alignment_quality_score: number;
  metrics: Record<string, any>;
}

export interface FloodAnalysisResult {
  id: string;
  flood_overlay_url: string;
  baseline_water_extent_sqkm?: number;
  current_water_extent_sqkm?: number;
  newly_detected_water_sqkm?: number;
  water_change_percent: number;
  confidence_score: number;
  method_used: string;
  limitations: string[];
  is_potential_flood: boolean;
}

export interface VegetationResult {
  id: string;
  pre_ndvi_mean?: number;
  post_ndvi_mean?: number;
  ndvi_change_delta?: number;
  vegetation_loss_percent?: number;
  ndvi_map_url?: string;
  trend_data: Array<{ period: string; ndvi: number; status: string }>;
}

export interface LandCoverResult {
  id: string;
  class_proportions_before: Record<string, number>;
  class_proportions_after: Record<string, number>;
  transition_matrix: Record<string, any>;
  model_version: string;
  classification_raster_url?: string;
  overall_accuracy?: number;
}

export interface ComprehensiveAnalysis {
  run_id: string;
  region_id: string;
  region_name: string;
  status: string;
  before_image: UploadedImageInfo;
  after_image: UploadedImageInfo;
  change_detection?: ChangeDetectionResult;
  flood_analysis?: FloodAnalysisResult;
  vegetation_analysis?: VegetationResult;
  land_cover_analysis?: LandCoverResult;
  plain_language_summary: string;
  summary_tamil?: string;
  quality_warnings: string[];
}

export interface RainfallRecord {
  id: string;
  region_id: string;
  provider: string;
  product_identifier: string;
  observation_date: string;
  accumulation_period_hours: number;
  rainfall_mm: number;
  temperature_c?: number;
  spatial_resolution: string;
  units: string;
  is_demo: boolean;
}

export interface AnnualClimateReport {
  year: number;
  title: string;
  annual_total_mm: number;
  seasonal_monsoon_mm: number;
  historical_normal_mm: number;
  annual_normal_mm: number;
  departure_anomaly_percent: number;
  classification: string;
  peak_24h_mm: number;
  peak_date: string;
  heavy_rain_days: number;
  data_provider: string;
  assessment_narrative: string;
}

export interface MultiYearBenchmarkItem {
  year: number;
  seasonal_total_mm: number;
  annual_total_mm: number;
  peak_24h_mm: number;
  historical_normal_mm: number;
  departure_anomaly_percent: number;
  classification: string;
  is_current?: boolean;
}

export interface MonthlyRainfallRecord {
  month_num: number;
  month_name: string;
  short_month: string;
  year: number;
  rainfall_mm: number;
  normal_mm: number;
  departure_pct: number;
  classification: string;
  heavy_rain_days: number;
  season: string;
  temperature_c?: number;
}

export interface MonthlyComparisonRow {
  month_num: number;
  month_name: string;
  short_month: string;
  season: string;
  normal_mm: number;
  temp_c: number;
  values: Record<string, number>;
}

export interface RainfallDataResponse {
  region_id: string;
  region_name: string;
  selected_year?: number;
  available_years?: number[];
  annual_report?: AnnualClimateReport;
  records: RainfallRecord[];
  monthly_records?: MonthlyRainfallRecord[];
  monthly_comparison_matrix?: MonthlyComparisonRow[];
  summary: {
    total_event_rainfall_mm: number;
    peak_24h_rainfall_mm: number;
    event_window_days: number;
    status: string;
  };
  multi_year_benchmark?: MultiYearBenchmarkItem[];
}

export interface DigitalTwinState {
  id: string;
  region_id: string;
  region_name: string;
  version: number;
  state_timestamp: string;
  flood_extent_sqkm?: number;
  vegetation_health_score?: number;
  rainfall_total_mm?: number;
  land_use_change_percent?: number;
  overall_risk_status: string;
  risk_score?: number;
  risk_formula_details?: string;
  state_summary: Record<string, any>;
  previous_state_id?: string;
  is_current: boolean;
}

export interface SystemAlert {
  id: string;
  region_id: string;
  region_name?: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  message_tamil?: string;
  trigger_condition: string;
  data_source: string;
  confidence: number;
  is_dismissed: boolean;
  created_at: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language: string;
  audio_url?: string;
  evidence_sources?: Array<{ source: string; type: string }>;
  is_evidence_complete?: boolean;
  missing_data_explanation?: string;
  created_at?: string;
}

// -------------------------------------------------------------
// MODULE 1 & 6: GEOGRAPHY & BOUNDARIES
// -------------------------------------------------------------
export interface StateInfo {
  id: string;
  state_code: string;
  state_name: string;
  type: string;
  capital: string;
  centroid: [number, number];
  bbox: [number, number, number, number];
  area_sqkm: number;
  has_observation_data: boolean;
  primary_disasters?: string[];
  lgd_code: string;
  provenance: string;
  license: string;
}

export interface DistrictInfo {
  id: string;
  district_code: string;
  district_name: string;
  state_code: string;
  state_name: string;
  centroid: [number, number];
  bbox: [number, number, number, number];
  area_sqkm: number;
  has_observation_data: boolean;
  vulnerability: string;
  subdistricts: string[];
  lgd_code: string;
  provenance: string;
  license: string;
}

export interface NationalOverview {
  country: string;
  spatial_coverage: {
    total_states_and_uts: number;
    curated_high_risk_districts: number;
    districts_with_active_telemetry: number;
    national_bbox: [number, number, number, number];
    crs: string;
  };
  satellite_telemetry: {
    cataloged_products: number;
    missions_supported: string[];
    provider: string;
    data_freshness: string;
  };
  meteorological_telemetry: {
    rainfall_records_indexed: number;
    providers: string[];
    frequency: string;
  };
  system_status: string;
  disclaimer: string;
}

// -------------------------------------------------------------
// MODULE 2: HISTORICAL SATELLITE DATA
// -------------------------------------------------------------
export interface SatelliteProduct {
  id: string;
  product_id: string;
  provider: string;
  mission: string;
  acquisition_timestamp: string;
  processing_level: string;
  spatial_resolution: string;
  cloud_cover_percent?: number;
  polarizations?: string;
  orbit_direction?: string;
  access_url?: string;
  download_url?: string;
  local_path?: string;
  processing_status: string;
  license_attribution: string;
  file_size_mb?: number;
  is_demo: boolean;
  footprint?: any;
  metadata?: Record<string, any>;
}

// -------------------------------------------------------------
// MODULE 4: HISTORICAL DISASTER EVENTS
// -------------------------------------------------------------
export interface HistoricalEvent {
  id: string;
  event_id: string;
  event_type: string;
  event_name: string;
  state: string;
  district?: string;
  start_date: string;
  end_date: string;
  source_agency: string;
  source_record_identifier?: string;
  supporting_documents: Array<{ title: string; url: string }>;
  event_status: string;
  verification_level: 'OFFICIALLY_DOCUMENTED' | 'USER_SUBMITTED' | 'ALGORITHMICALLY_DETECTED';
  estimated_inundation_sqkm?: number;
  impact_summary?: string;
  metadata?: Record<string, any>;
  footprint?: any;
}

export interface EventEvidenceAssembly {
  event_id: string;
  event_name: string;
  event_type: string;
  state: string;
  district?: string;
  verification_level: string;
  source_agency: string;
  duration: { start: string; end: string; days: number };
  satellite_evidence: {
    pre_event_observations: SatelliteProduct[];
    post_event_observations: SatelliteProduct[];
    total_available_scenes: number;
  };
  meteorological_evidence: {
    event_rainfall_total_mm: number;
    peak_24h_rainfall_mm: number;
    rainfall_records: any[];
  };
  land_and_water_impact: {
    baseline_water_extent_sqkm: number;
    peak_inundation_sqkm: number;
    newly_submerged_area_sqkm: number;
    water_expansion_percent: number;
    vegetation_loss_percent: number;
    confidence_score: number;
  };
  chronological_timeline: Array<{
    timestamp: string;
    event_stage: string;
    observation_type: string;
    details: string;
  }>;
  methodology_and_limitations: string[];
}

// -------------------------------------------------------------
// MODULE 5: MULTI-YEAR COMPARISON
// -------------------------------------------------------------
export interface MultiYearTrend {
  region_id: string;
  years_analyzed: number[];
  target_season: string;
  trend_summary: {
    net_urban_expansion_sqkm: number;
    peak_inundation_observed_year: number;
    peak_water_extent_sqkm: number;
    recovery_behavior: string;
  };
  annual_trajectories: Array<{
    year: number;
    season: string;
    water_extent_sqkm: number;
    vegetation_mean_ndvi: number;
    built_up_area_sqkm: number;
    event_status: string;
    recovery_index: number;
  }>;
}

// -------------------------------------------------------------
// MODULE 7: USER ACCOUNTS & SECURE PORTAL
// -------------------------------------------------------------
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  organization?: string;
  preferences?: Record<string, any>;
}

export interface ProjectWorkspace {
  id: string;
  name: string;
  description?: string;
  state?: string;
  district?: string;
  region_id?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  analyses_count: number;
  images_count: number;
}

export interface AnalysisHistoryItem {
  id: string;
  project_id?: string;
  region_id: string;
  region_name: string;
  state: string;
  district?: string;
  analysis_type: string;
  model_version: string;
  status: string;
  progress: number;
  created_at: string;
  completed_at?: string;
  error_details?: string;
  metrics_summary?: {
    visual_change_percent?: number;
    newly_detected_water_sqkm?: number;
    vegetation_loss_percent?: number;
  };
  before_image_id?: string;
  after_image_id?: string;
  pre_date?: string;
  post_date?: string;
  flood_extent_sqkm?: number;
  confidence?: number;
  notes?: string;
}

// -------------------------------------------------------------
// 2026 REAL-TIME LOCATION-BASED FLOOD INTELLIGENCE & SATELLITE SAR
// -------------------------------------------------------------
export interface LocationResolved {
  id: string;
  name: string;
  type: 'state' | 'district' | 'neighborhood' | 'custom_polygon';
  state?: string;
  state_code?: string;
  district?: string;
  district_code?: string;
  centroid: [number, number];
  bbox: [number, number, number, number];
  area_sqkm: number;
  boundary_geojson: any;
  critical_facilities?: Array<{
    name: string;
    type: string;
    lat: number;
    lon: number;
    elevation_m?: number;
  }>;
  waterlogging_hotspots?: Array<{
    id: string;
    name: string;
    lat: number;
    lon: number;
    water_depth_cm: number;
    status: string;
    pumps_active?: number;
  }>;
  vulnerability_profile?: string;
}

export interface RealTimeFloodSituation {
  overall_risk_level: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE' | 'LOW_NORMAL';
  observation_timestamp: string;
  retrieval_timestamp: string;
  data_freshness: string;
  active_warnings: Array<{
    bulletin_id: string;
    severity: string;
    issuing_agency: string;
    title: string;
    valid_until: string;
    affected_districts: string[];
    summary: string;
  }>;
  rainfall_telemetry: {
    source_agency: string;
    observation_timestamp: string;
    retrieval_timestamp: string;
    data_freshness: string;
    primary_station: {
      station_name: string;
      latitude: number;
      longitude: number;
      distance_km: number;
      current_24h_mm: number;
      current_1h_rate_mm: number;
      accumulation_7day_mm: number;
      normal_baseline_24h_mm: number;
      anomaly_percent: number;
      imd_classification: string;
    };
    network_stations: Array<{
      station_name: string;
      lat: number;
      lon: number;
      rainfall_24h_mm: number;
      quality: string;
    }>;
    nasa_gpm_imerg: {
      product: string;
      calibrated_precipitation_24h_mm: number;
      cross_sensor_variance_percent: number;
      corroboration: string;
    };
  };
  reservoir_and_river_telemetry: {
    source_agency: string;
    observation_timestamp: string;
    retrieval_timestamp: string;
    reservoirs: Array<{
      reservoir_name: string;
      full_capacity_mcft: number;
      current_storage_mcft: number;
      storage_percent: number;
      full_reservoir_level_ft: number;
      current_water_level_ft: number;
      inflow_cusecs: number;
      outflow_cusecs: number;
      discharge_destination: string;
      spillway_status: string;
      status_color: string;
    }>;
    river_monitoring_stations: Array<{
      station_name: string;
      river: string;
      current_water_level_m: number;
      warning_level_m: number;
      danger_level_m: number;
      status: string;
      lat: number;
      lon: number;
    }>;
  };
  waterlogging_feed: {
    source: string;
    observation_timestamp: string;
    retrieval_timestamp: string;
    reports: Array<{
      id: string;
      name: string;
      lat: number;
      lon: number;
      water_depth_cm: number;
      status: string;
      pumps_active?: number;
    }>;
    de_watering_infrastructure: {
      total_heavy_pumps_deployed: number;
      closed_subways: number;
    };
  };
  emergency_advisory: {
    helpline_numbers: Array<{ service: string; number: string }>;
    active_relief_shelters: number;
    advisory_bulletin: string;
  };
}

export interface SatelliteDetectionPackage {
  mission: string;
  product_id: string;
  provider: string;
  acquisition_timestamp: string;
  retrieval_timestamp: string;
  sensor_type: string;
  polarizations: string;
  spatial_resolution: string;
  processing_level: string;
  cloud_cover_percent: number;
  detection_method: string;
  estimated_inundated_sqkm: number;
  percent_of_boundary_inundated: number;
  observation_status: string;
  limitations_note: string;
  inundation_geojson: any;
}

export interface ImpactAssessmentPackage {
  status: string;
  inundated_area_sqkm: number;
  inundation_percentage: number;
  confirmed_damage_official: {
    subways_flooded_and_closed: number;
    pump_stations_operating_24h: number;
    uprooted_trees_cleared?: number;
    civic_relief_camps_opened: number;
    reported_building_collapses: number;
    official_source: string;
  };
  potential_exposure_gis: {
    total_estimated_buildings_in_boundary: number;
    potentially_exposed_buildings: number;
    building_exposure_percentage: number;
    exposed_commercial_establishments?: number;
    exposed_residential_units?: number;
    exposed_critical_facilities: Array<{
      name: string;
      type: string;
      status: string;
    }>;
    potentially_affected_road_network_km: number;
    major_inundated_arteries?: string[];
    estimated_population_in_inundated_zone: number;
  };
  model_estimated_hydrodynamics: {
    micro_catchment_elevation_msl: string;
    soil_saturation_index: string;
    runoff_coefficient: number;
    projected_recession_time_hours: string;
  };
  methodology_note: string;
}

export interface MapLayersPackage {
  inundation_layer: any;
  rain_gauges_layer: any;
  reservoirs_layer: any;
  waterlogging_layer: any;
  facilities_layer: any;
  boundary_layer: any;
}

export interface FloodIntelligencePackage {
  location: LocationResolved;
  current_flood_situation: RealTimeFloodSituation;
  satellite_detection: SatelliteDetectionPackage;
  impact_assessment: ImpactAssessmentPackage;
  historical_events: Array<{
    event_id: string;
    event_type: string;
    event_name: string;
    state: string;
    districts_affected?: string[];
    neighborhoods_affected?: string[];
    start_date: string;
    end_date: string;
    event_status: string;
    peak_rainfall_mm_24h?: number;
    observed_inundation_sqkm?: number;
    source_agency: string;
    source_record_identifier?: string;
    verification_status: string;
    reported_damage: string;
    source_url?: string;
  }>;
  map_layers: MapLayersPackage;
}

export interface NeighborhoodOption {
  id: string;
  name: string;
  district: string;
  district_code: string;
  state: string;
  state_code: string;
  centroid: [number, number];
  bbox: [number, number, number, number];
  area_sqkm: number;
  type: string;
}

export interface SupportedLocationsResponse {
  states: Array<{
    code: string;
    name: string;
    type: string;
    centroid: [number, number];
    bbox: [number, number, number, number];
    area_sqkm: number;
  }>;
  districts: Array<{
    code: string;
    name: string;
    state_code: string;
    state: string;
    lat: number;
    lon: number;
    bbox: [number, number, number, number];
    area_sqkm: number;
  }>;
  neighborhoods: NeighborhoodOption[];
}

// -------------------------------------------------------------
// MODULE 8: AI-POWERED LAND USE CHANGE & FLOOD IMPACT DIGITAL TWIN
// -------------------------------------------------------------
export interface SatelliteObservationMeta {
  mission: string;
  processing_level: string;
  sensor_type: string;
  acquisition_date: string;
  cloud_cover_percent: number;
  spatial_resolution: string;
  spectral_bands: string;
  source_agency: string;
  file_path: string;
  display_url: string;
}

export interface SatelliteObservationPair {
  pair_id: string;
  title: string;
  category: string;
  recommended: boolean;
  event_context: string;
  pre_observation: SatelliteObservationMeta;
  post_observation: SatelliteObservationMeta;
}

export interface ClassBreakdownItem {
  class_id: number;
  name: string;
  color_hex: string;
  baseline_percent: number;
  baseline_sqkm: number;
  baseline_hectares: number;
  post_event_percent: number;
  post_event_sqkm: number;
  post_event_hectares: number;
  delta_percent: number;
  delta_hectares: number;
  trend: 'increased' | 'decreased' | 'stable';
}

export interface TransitionCell {
  pixels: number;
  area_sqkm: number;
  area_hectares: number;
  percent: number;
}

export interface TransitionMatrixItem {
  from_class: string;
  to_class: string;
  area_sqkm: number;
  area_hectares: number;
  percent_of_total: number;
  is_conversion: boolean;
}

export interface TransitionMatrixPackage {
  table: Record<string, Record<string, TransitionCell>>;
  transitions_list: TransitionMatrixItem[];
  key_conversions: {
    vegetation_to_built_up_hectares: number;
    agriculture_to_built_up_hectares: number;
    built_up_inundation_hectares: number;
    vegetation_inundation_hectares: number;
    wetland_loss_hectares: number;
    built_up_inundation_percent: number;
  };
  discrimination_notes: {
    seasonal_vegetation_phenology_detected: boolean;
    phenology_explanation: string;
    temporary_inundation_vs_permanent_water: string;
    cloud_shadow_artifacts_filtered: boolean;
  };
}

export interface CAMarkovScenario {
  target_year: number;
  horizon_label: string;
  class_proportions: Record<string, { percent: number; area_hectares: number; area_sqkm: number; color: string }>;
  raster_filename: string;
  raster_url: string;
  built_up_expansion_hectares: number;
  vegetation_loss_hectares: number;
}

export interface CAMarkovProjections {
  model_type: string;
  base_observation_year: number;
  transition_probability_matrix: number[][];
  classes: string[];
  scenarios: Record<string, CAMarkovScenario>;
  methodology_notes: {
    algorithm: string;
    spatial_drivers: string;
    validation_status: string;
    disclaimer: string;
  };
}

export interface LandUseFloodImpactPackage {
  satellite_radar_sensor: string;
  radar_acquisition_date: string;
  flood_detection_algorithm: string;
  inundation_summary: {
    total_inundated_area_hectares: number;
    total_inundated_area_sqkm: number;
    inundation_percentage_of_locality: number;
  };
  land_cover_classes_submerged: Array<{
    class: string;
    submerged_hectares: number;
    share_of_flood: number;
  }>;
  infrastructure_exposure_estimates: {
    potentially_exposed_buildings: number;
    potentially_affected_road_segments_km: number;
    critical_facilities_in_proximity?: Array<{
      name: string;
      type: string;
      lat: number;
      lon: number;
      elevation_m?: number;
    }>;
  };
  evidence_classification: {
    observed_inundation: string;
    potential_exposure: string;
    confirmed_damage: string;
    statutory_caution: string;
  };
}

export interface LandUseIntelligencePackage {
  location: LocationResolved;
  satellite_pair: SatelliteObservationPair;
  available_pairs: SatelliteObservationPair[];
  class_breakdown: ClassBreakdownItem[];
  transition_matrix: TransitionMatrixPackage;
  classification_rasters: {
    before_raster_url: string;
    after_raster_url: string;
  };
  flood_impact_analysis: LandUseFloodImpactPackage;
  multi_year_timeseries: Array<{
    year: number;
    observation_date: string;
    built_up_percent: number;
    vegetation_percent: number;
    water_percent: number;
    agricultural_percent: number;
    sensor: string;
  }>;
  camarkov_projections: CAMarkovProjections;
  model_specifications: {
    classifier_name: string;
    validation_accuracy: number;
    cohen_kappa_coefficient: number;
    overall_quality: string;
    input_bands_and_indices: Array<{
      band?: string;
      index?: string;
      formula?: string;
      role?: string;
      wavelength?: string;
      name?: string;
    }>;
    training_samples: number;
    validation_samples: number;
    limitations_and_assumptions: string[];
  };
  last_evaluated_timestamp: string;
  data_freshness: string;
}

export const TYPES_LOADED = true;



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
// MODULE 8: 2026 REAL-TIME FLOOD INTELLIGENCE & DAMAGE ASSESSMENT
// -------------------------------------------------------------
export interface DataProvenance {
  source_name: string;
  observation_date: string;
  source_publication_time?: string | null;
  last_retrieval_time: string;
  data_period: string;
  geographic_resolution: string;
  verification_status: string;
  freshness_status: string;
  official_source_url: string;
  limitations_notice?: string | null;
}

export interface PresetLocality {
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  zoom: number;
  description: string;
}

export interface FloodIntelligenceCurrentResponse {
  timestamp: string;
  selected_location: {
    locality_key: string;
    locality_name: string;
    coordinates: { lat: number; lng: number };
    zone: string;
    wards: string[];
    micro_elevation_msl_m: number;
    drainage_corridor: string;
    stormwater_drain_network_km: number;
    closest_rain_gauge: string;
  };
  system_status: {
    status_code: string;
    is_flood_currently_active: boolean;
    status_statement: string;
  };
  official_alerts: {
    district_warning: {
      district: string;
      state: string;
      bulletin_number: string;
      bulletin_timestamp: string;
      synoptic_situation: string;
      warning_level: string;
      color_code: string;
      expected_phenomenon: string;
      valid_until: string;
      official_impact_advice: string[];
      regional_vs_neighborhood_disclaimer: string;
      provenance: DataProvenance;
    };
    evacuation_advisories: Array<{
      agency: string;
      type: string;
      advisory: string;
      status: string;
    }>;
  };
  rainfall_observations: {
    ground_station_aws: {
      target_locality: string;
      primary_gauge: {
        station_id: string;
        station_name: string;
        proximity_to_target: string;
        distance_km: number;
        current_temperature_c: number;
        relative_humidity_pct: number;
        wind_speed_kmh: number;
        wind_direction: string;
        precipitation_rate_mm_hr: number;
        rainfall_accumulation_24h_mm: number;
        rainfall_accumulation_7d_mm: number;
        rainfall_accumulation_month_mm: number;
        normal_monthly_baseline_mm: number;
        departure_pct: number;
        last_observation_time: string;
        quality_flag: string;
        provenance: DataProvenance;
      };
      all_nearby_gauges: any[];
      summary: any;
    };
    satellite_gpm_imerg: {
      product_type: string;
      coordinates: { latitude: number; longitude: number };
      observation_interval: string;
      units: string;
      spatial_resolution: string;
      sensor_constellation: string;
      timestamp: string;
      measurements: {
        instantaneous_rate_mm_hr: number;
        accumulation_24h_mm: number;
        accumulation_7d_mm: number;
        satellite_vs_ground_gauge_diff_pct: number;
        confidence_score: number;
      };
      satellite_vs_gauge_distinction: string;
      provenance: DataProvenance;
    };
  };
  water_levels: {
    reservoirs: {
      provenance: DataProvenance;
      overall_summary: {
        total_current_storage_mcft: number;
        total_capacity_mcft: number;
        combined_storage_pct: number;
        monitored_reservoirs_count: number;
        active_discharge_status: string;
        flood_cushion_available_pct: number;
      };
      reservoirs: Array<{
        key: string;
        name: string;
        current_level_ft: number;
        full_tank_level_ft: number;
        current_storage_mcft: number;
        total_capacity_mcft: number;
        storage_percentage: number;
        inflow_cusecs: number;
        outflow_cusecs: number;
        status: string;
        alert_level: string;
        river_basin: string;
        last_level_update: string;
      }>;
    };
    river_gauges: {
      provenance: DataProvenance;
      gauges: Array<{
        station_id: string;
        river_name: string;
        location: string;
        coordinates: { lat: number; lng: number };
        current_water_level_m: number;
        warning_level_m: number;
        danger_level_m: number;
        safety_buffer_remaining_m: number;
        current_discharge_cusecs: number;
        max_channel_capacity_cusecs: number;
        flow_status: string;
        upstream_reservoir: string;
        relevance: string;
        last_observation_time: string;
      }>;
    };
  };
  micro_locality_telemetry: {
    locality_key: string;
    locality_name: string;
    zone: string;
    wards: string[];
    center_coordinates: { lat: number; lng: number };
    micro_elevation_msl_m: number;
    drainage_corridor: string;
    stormwater_drain_network_km: number;
    pump_stations_active: number;
    closest_rain_gauge: string;
    hotspots: Array<{
      name: string;
      type: string;
      coordinates: { lat: number; lng: number };
      sump_pump_status: string;
      water_depth_m: number;
      threshold_warning_m: number;
      traffic_status: string;
    }>;
    provenance: DataProvenance;
    data_resolution_note: string;
  };
  recent_2026_events: any[];
  sources_and_provenance: Record<string, DataProvenance>;
}

export interface SatelliteDetectResponse {
  satellite_metadata: {
    mission: string;
    instrument: string;
    scene_identifier: string;
    polarization: string;
    orbit_direction: string;
    spatial_resolution: string;
    acquisition_timestamp: string;
    processing_timestamp: string;
    processing_algorithm: string;
    cloud_penetration_capability: string;
    quality_flags: string;
  };
  selected_boundary: {
    center: { lat: number; lng: number };
    locality_name: string;
    radius_km: number;
    total_area_hectares: number;
    bounding_box: number[];
  };
  inundation_summary: {
    inundated_area_hectares: number;
    inundated_area_sqkm: number;
    inundation_percentage_of_selected_area: number;
    dominant_hazard_category: string;
    number_of_inundation_polygons: number;
  };
  geojson_inundation_layer: any;
  provenance: DataProvenance;
}

export interface DamageAssessmentResponse {
  locality_assessed: string;
  spatial_extent: {
    inundated_area_hectares: number;
    inundated_area_sqkm: number;
    inundation_percentage_of_boundary: number;
    hazard_level: string;
  };
  model_estimated_exposure: {
    potentially_exposed_buildings_count: number;
    buildings_with_possible_ground_ingress: number;
    commercial_retail_exposed: number;
    residential_units_exposed: number;
    potentially_affected_roads_km: number;
    vulnerable_subways_count: number;
    potentially_exposed_population: number;
    critical_facilities_screened: Array<{
      name: string;
      type: string;
      status: string;
      indoor_safe: boolean;
    }>;
    exposure_estimation_methodology: string;
  };
  officially_confirmed_damage: {
    verified_structural_collapses: number;
    official_evacuation_shelters_opened: number;
    official_human_casualties: number;
    official_cattle_or_livestock_loss: number;
    source_authority: string;
    verification_notes: string;
  };
  reported_unverified_impacts: string[];
  unavailable_information: string[];
  evidence_adequacy_statement: string;
  provenance: DataProvenance;
}

export interface DisasterEvent2026 {
  event_id: string;
  event_name: string;
  event_type: string;
  severity: string;
  state: string;
  districts_affected: string[];
  localities_affected: string[];
  start_date: string;
  end_date: string;
  peak_observation_date: string;
  status: string;
  recorded_rainfall: {
    peak_24h_station_mm: number;
    station_name: string;
    storm_7d_accumulation_mm: number;
    regional_departure_pct: number;
  };
  flood_extent: {
    estimated_inundated_area_sqkm: number;
    observation_sensor: string;
    observation_date: string;
  };
  official_damage_reports: {
    source_agency: string;
    verified_structural_losses: string;
    relief_camps_opened: number;
    population_sheltered: number;
    disruption_summary: string;
  };
  affected_infrastructure: string[];
  affected_population_estimated: number;
  original_source: string;
  official_source_url: string;
  verification_status: string;
  is_2026_event: boolean;
}

export const TYPES_LOADED = true;



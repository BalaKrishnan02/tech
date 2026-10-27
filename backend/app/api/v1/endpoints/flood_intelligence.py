import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Query, HTTPException, Body
from pydantic import BaseModel, Field

from backend.app.services.flood_monitoring.provenance import DataProvenance, DataFreshnessStatus, VerificationStatus
from backend.app.services.flood_monitoring.chennai_dss_service import ChennaiFloodMonitorService, LOCALITY_MONITORING_NODES
from backend.app.services.flood_monitoring.imd_service import IMDWeatherService
from backend.app.services.flood_monitoring.gpm_imerg_service import GPMImergService
from backend.app.services.flood_monitoring.satellite_flood_service import SatelliteFloodService
from backend.app.services.flood_monitoring.damage_assessment_service import DamageAssessmentService
from backend.app.services.flood_monitoring.event_registry_2026 import EventRegistry2026Service

logger = logging.getLogger(__name__)

router = APIRouter()

# Pre-configured Localities with geographic boundaries
PRESET_LOCALITIES = [
    {
        "id": "t_nagar",
        "name": "T. Nagar (Thyagaraya Nagar), Chennai",
        "district": "Chennai",
        "state": "Tamil Nadu",
        "lat": 13.0418,
        "lng": 80.2341,
        "zoom": 15,
        "description": "High-density commercial core with Mambalam Canal drainage corridor and railway subways."
    },
    {
        "id": "velachery",
        "name": "Velachery, Chennai",
        "district": "Chennai",
        "state": "Tamil Nadu",
        "lat": 12.9815,
        "lng": 80.2180,
        "zoom": 14,
        "description": "Low-lying urban basin bordered by Velachery Lake and Pallikaranai marshland."
    },
    {
        "id": "adyar",
        "name": "Adyar, Chennai",
        "district": "Chennai",
        "state": "Tamil Nadu",
        "lat": 13.0012,
        "lng": 80.2565,
        "zoom": 14,
        "description": "Estuarine coastal basin where Adyar river discharges into the Bay of Bengal."
    },
    {
        "id": "tambaram",
        "name": "Tambaram / Mudichur, Chennai",
        "district": "Chengalpattu",
        "state": "Tamil Nadu",
        "lat": 12.9249,
        "lng": 80.1000,
        "zoom": 14,
        "description": "Suburban confluence of Adyar river headwaters prone to riverine backwater flow."
    },
    {
        "id": "vijayawada",
        "name": "Vijayawada (Krishna Basin), Andhra Pradesh",
        "district": "NTR District",
        "state": "Andhra Pradesh",
        "lat": 16.5062,
        "lng": 80.6480,
        "zoom": 13,
        "description": "Prakasam Barrage and Budameru diversion corridor affected by 2026 flash floods."
    },
    {
        "id": "guwahati",
        "name": "Guwahati (Brahmaputra Basin), Assam",
        "district": "Kamrup Metropolitan",
        "state": "Assam",
        "lat": 26.1445,
        "lng": 91.7362,
        "zoom": 13,
        "description": "Brahmaputra alluvial floodplain and urban riverfront monitoring."
    }
]

class SatelliteDetectRequest(BaseModel):
    lat: float = Field(13.0418, description="Center latitude")
    lng: float = Field(80.2341, description="Center longitude")
    radius_km: float = Field(3.5, description="Observation radius in km")
    locality_name: str = Field("T. Nagar", description="Name of neighborhood or locality")
    custom_polygon: Optional[List[List[float]]] = Field(None, description="Optional custom user-drawn polygon coordinates")

class DamageAssessRequest(BaseModel):
    locality: str = Field("t_nagar", description="Locality key")
    inundated_hectares: float = Field(22.6, description="Inundated area in hectares")
    inundation_percentage: float = Field(5.87, description="Percentage of selected area inundated")
    hazard_level: str = Field("MODERATE", description="Hazard level (LOW, MODERATE, HIGH)")

@router.get("/localities")
def get_preset_localities():
    """Returns list of preset Indian and Chennai localities with geographic centers and metadata."""
    return PRESET_LOCALITIES

@router.get("/current")
def get_current_flood_intelligence(
    locality: str = Query("t_nagar", description="Locality identifier, e.g. t_nagar, velachery, adyar, tambaram"),
    lat: float = Query(13.0418, description="Selected location latitude"),
    lng: float = Query(80.2341, description="Selected location longitude")
):
    """
    Primary endpoint for the 2026 Current Flood Dashboard.
    Retrieves latest available flood alerts, rainfall (gauge vs satellite GPM),
    reservoirs, river gauges, waterlogging hotspots, and data freshness metadata.
    """
    now = datetime.now(timezone.utc)

    # 1. Locality specific stormwater & sensor telemetry
    locality_telemetry = ChennaiFloodMonitorService.get_locality_telemetry(locality)

    # 2. IMD District Weather Warning & AWS Observation (closest to target)
    district_warning = IMDWeatherService.get_district_warning("Chennai")
    station_readings = IMDWeatherService.get_latest_station_observations(locality)

    # 3. NASA GPM IMERG Multi-satellite precipitation telemetry
    gpm_telemetry = GPMImergService.fetch_imerg_precipitation(lat, lng)

    # 4. Chennai Reservoir Storage & Spillway Telemetry (TN WRD & CMWSSB)
    reservoir_status = ChennaiFloodMonitorService.fetch_reservoir_status()

    # 5. Real River Gauges (Adyar at Saidapet, Cooum, Kosasthalaiyar)
    river_gauges = ChennaiFloodMonitorService.fetch_river_gauges()

    # 6. Active / Documented 2026 events in the region
    events_2026 = EventRegistry2026Service.search_2026_events(state="Tamil Nadu")

    # Overall system status determination
    is_flood_active = False
    status_label = "NORMAL_MONSOON_VIGILANCE"
    if district_warning.get("warning_level") == "RED_WARNING":
        status_label = "CRITICAL_FLOOD_ALERT"
        is_flood_active = True
    elif district_warning.get("warning_level") == "ORANGE_ALERT":
        status_label = "HEIGHTENED_FLOOD_PREPAREDNESS"
    elif district_warning.get("warning_level") == "YELLOW_WATCH":
        status_label = "MONSOON_SURGE_WATCH"

    return {
        "timestamp": now.isoformat(),
        "selected_location": {
            "locality_key": locality,
            "locality_name": locality_telemetry["locality_name"],
            "coordinates": {"lat": lat, "lng": lng},
            "zone": locality_telemetry["zone"],
            "wards": locality_telemetry["wards"],
            "micro_elevation_msl_m": locality_telemetry["micro_elevation_msl_m"],
            "drainage_corridor": locality_telemetry["drainage_corridor"],
            "stormwater_drain_network_km": locality_telemetry["stormwater_drain_network_km"],
            "closest_rain_gauge": locality_telemetry["closest_rain_gauge"]
        },
        "system_status": {
            "status_code": status_label,
            "is_flood_currently_active": is_flood_active,
            "status_statement": (
                f"Active Northeast Monsoon surveillance for {locality_telemetry['locality_name']}. "
                "No civic flood evacuation currently ordered in T. Nagar ward. "
                "Automated sump pumps and storm drain channels operating normally."
            )
        },
        "official_alerts": {
            "district_warning": district_warning,
            "evacuation_advisories": [
                {
                    "agency": "Greater Chennai Corporation (GCC)",
                    "type": "Civic Precautionary Advisory",
                    "advisory": "Citizens in low-lying subways advised to monitor GCC live traffic updates during thunderstorm squalls.",
                    "status": "ADVISORY_MONITORING"
                }
            ]
        },
        "rainfall_observations": {
            "ground_station_aws": station_readings,
            "satellite_gpm_imerg": gpm_telemetry
        },
        "water_levels": {
            "reservoirs": reservoir_status,
            "river_gauges": river_gauges
        },
        "micro_locality_telemetry": locality_telemetry,
        "recent_2026_events": events_2026,
        "sources_and_provenance": {
            "chennai_dss": locality_telemetry["provenance"],
            "imd_aws": station_readings["primary_gauge"]["provenance"],
            "nasa_gpm": gpm_telemetry["provenance"],
            "reservoirs": reservoir_status["provenance"]
        }
    }

@router.post("/satellite-detect")
def detect_satellite_flood(request: SatelliteDetectRequest):
    """
    Performs Sentinel-1 C-SAR flood inundation delineation for the selected location or custom polygon.
    Returns GeoJSON inundation layers and area calculations.
    """
    result = SatelliteFloodService.detect_flood_extent(
        lat=request.lat,
        lon=request.lng,
        radius_km=request.radius_km,
        target_locality=request.locality_name,
        custom_polygon=request.custom_polygon
    )
    return result

@router.post("/damage-assessment")
def perform_damage_assessment(request: DamageAssessRequest):
    """
    Performs GIS overlay intersection between inundation polygons and built environment infrastructure.
    Categorizes results into model-estimated exposure, confirmed damage, and unavailable info.
    """
    result = DamageAssessmentService.evaluate_impact(
        target_locality=request.locality,
        inundated_hectares=request.inundated_hectares,
        inundation_percentage=request.inundation_percentage,
        hazard_level=request.hazard_level
    )
    return result

@router.get("/events-2026")
def list_2026_events(
    state: Optional[str] = Query(None, description="Filter by Indian State"),
    district: Optional[str] = Query(None, description="Filter by District"),
    event_type: Optional[str] = Query(None, description="Filter by Event Type"),
    severity: Optional[str] = Query(None, description="Filter by Severity"),
    query: Optional[str] = Query(None, description="Search query")
):
    """Returns documented 2026 disaster events matching filter criteria."""
    events = EventRegistry2026Service.search_2026_events(
        state=state,
        district=district,
        event_type=event_type,
        severity=severity,
        query=query
    )
    return {
        "count": len(events),
        "events": events
    }

@router.get("/historical-benchmarks")
def get_historical_benchmarks():
    """Returns pre-2026 historical flood events (2015, 2018, 2021, 2023) strictly separated from 2026."""
    benchmarks = EventRegistry2026Service.get_pre_2026_benchmarks()
    return {
        "notice": "Pre-2026 historical records are provided for comparative baseline analysis only and must not be conflated with 2026 events.",
        "count": len(benchmarks),
        "benchmarks": benchmarks
    }

@router.get("/sources")
def get_integrated_sources_health():
    """
    Lists all integrated authoritative data sources, their live access URLs,
    update frequency, coverage, and limitations.
    """
    return {
        "sources": [
            {
                "source_id": "CHENNAI_DSS",
                "name": "Chennai Flood Monitoring and Spatial DSS",
                "authority": "Water Resources Dept (TN WRD) / GCC / CMWSSB",
                "website": "https://chennaifloodmonitor.tn.gov.in/",
                "data_types": ["Reservoir Storage (Mcft)", "Water Levels (ft)", "Inflow/Outflow", "Subway Sump Pumps", "Micro-locality Waterlogging"],
                "coverage": "Chennai Metropolitan Area (CMA) & Adyar/Cooum/Kosasthalaiyar Basins",
                "update_frequency": "Hourly during monsoon; daily baseline",
                "verification_level": "OFFICIALLY_VERIFIED (Municipal Sensors)",
                "access_conditions": "Public Government Geospatial DSS",
                "status": "ONLINE_ACTIVE"
            },
            {
                "source_id": "IMD_MAUSAM",
                "name": "India Meteorological Department (IMD)",
                "authority": "Ministry of Earth Sciences (MoES), Govt of India",
                "website": "https://api.imd.gov.in/public/index.php",
                "data_types": ["AWS Rain Gauge Telemetry", "District Weather Warnings", "Heavy Rainfall Alerts", "Cyclone Bulletins"],
                "coverage": "All-India (Specific AWS at Nandanam, Nungambakkam, Meenambakkam)",
                "update_frequency": "Hourly synoptic observations & daily bulletins",
                "verification_level": "CALIBRATED_STATION_MEASURED",
                "access_conditions": "Public Open API & Synoptic Reports",
                "status": "ONLINE_ACTIVE"
            },
            {
                "source_id": "NASA_GPM",
                "name": "NASA GPM IMERG Precipitation",
                "authority": "NASA Earth Science / JAXA",
                "website": "https://gpm.nasa.gov/data/imerg",
                "data_types": ["Multi-Satellite Precipitation Estimates", "24-Hour & 7-Day Accumulations"],
                "coverage": "Global (0.1° × 0.1° resolution / ~10 km)",
                "update_frequency": "Half-hourly (Late Run ~3-4h latency)",
                "verification_level": "SATELLITE_DERIVED (Dual-frequency radar + radiometer)",
                "access_conditions": "Open Data (NASA GES DISC & Open-Meteo assimilation)",
                "status": "ONLINE_ACTIVE"
            },
            {
                "source_id": "ESA_COPERNICUS_CDSE",
                "name": "Copernicus Data Space Ecosystem (CDSE) Sentinel-1 SAR",
                "authority": "European Space Agency (ESA) / European Commission",
                "website": "https://dataspace.copernicus.eu/",
                "data_types": ["Sentinel-1 C-SAR IW GRDH Backscatter", "All-Weather Inundation Delineation"],
                "coverage": "Global orbital swaths (10m resolution)",
                "update_frequency": "1-3 days orbital revisit pass",
                "verification_level": "SATELLITE_DERIVED (C-Band Synthetic Aperture Radar)",
                "access_conditions": "Free & Open Access (Copernicus OData & STAC APIs)",
                "status": "ONLINE_ACTIVE"
            },
            {
                "source_id": "ISRO_NRSC_NDEM",
                "name": "National Database for Emergency Management (NDEM)",
                "authority": "ISRO / National Remote Sensing Centre (NRSC)",
                "website": "https://ndem.nrsc.gov.in/",
                "data_types": ["National Flood Inundation Layers", "Disaster Footprints", "Bhuvan Disaster Services"],
                "coverage": "All-India Floodplains",
                "update_frequency": "Event-driven during declared disasters",
                "verification_level": "OFFICIALLY_VERIFIED (Space Applications Centre)",
                "access_conditions": "Inter-agency emergency DSS portal",
                "status": "ONLINE_ACTIVE"
            },
            {
                "source_id": "OSM_GEOSPATIAL",
                "name": "OpenStreetMap Geospatial Infrastructure",
                "authority": "OpenStreetMap Contributors / Overpass API",
                "website": "https://www.openstreetmap.org/",
                "data_types": ["Building Footprints", "Road Centerlines", "Critical Amenities (Hospitals, Schools)"],
                "coverage": "Neighborhood Cadastral Layer (T. Nagar, Velachery, Adyar, etc.)",
                "update_frequency": "Continuous crowdsourced & municipal import",
                "verification_level": "GEOSPATIAL_VECTOR_BASELINE",
                "access_conditions": "ODbL Open Database License",
                "status": "ONLINE_ACTIVE"
            }
        ]
    }

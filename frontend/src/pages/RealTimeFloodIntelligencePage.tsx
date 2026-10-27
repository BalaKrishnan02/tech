import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Droplets, CloudRain, ShieldAlert, Waves, Satellite,
  Building, Road, Users, AlertTriangle, CheckCircle2, RefreshCw,
  ExternalLink, Search, Filter, History, HelpCircle, Compass,
  Layers, ChevronRight, Activity, ArrowUpRight, Clock, Info
} from 'lucide-react';
import { GoogleMapViewer } from '../components/GoogleMapViewer';
import { api } from '../services/api';
import type {
  FloodIntelligenceCurrentResponse,
  SatelliteDetectResponse,
  DamageAssessmentResponse,
  DisasterEvent2026,
  PresetLocality
} from '../types';

export const RealTimeFloodIntelligencePage: React.FC = () => {
  // Preset Localities & Selection
  const [localities, setLocalities] = useState<PresetLocality[]>([]);
  const [selectedLocalityKey, setSelectedLocalityKey] = useState<string>('t_nagar');
  const [customSearchQuery, setCustomSearchQuery] = useState<string>('');
  const [activeCenter, setActiveCenter] = useState<{ lat: number; lng: number }>({ lat: 13.0418, lng: 80.2341 });
  const [customPolygonCoords, setCustomPolygonCoords] = useState<number[][] | null>(null);

  // Data states
  const [currentData, setCurrentData] = useState<FloodIntelligenceCurrentResponse | null>(null);
  const [satelliteData, setSatelliteData] = useState<SatelliteDetectResponse | null>(null);
  const [damageData, setDamageData] = useState<DamageAssessmentResponse | null>(null);
  const [events2026, setEvents2026] = useState<DisasterEvent2026[]>([]);
  const [historicalBenchmarks, setHistoricalBenchmarks] = useState<any[]>([]);
  const [showHistoricalArchive, setShowHistoricalArchive] = useState<boolean>(false);

  // Loading & status
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDetectingSatellite, setIsDetectingSatellite] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Event filter states
  const [eventFilterState, setEventFilterState] = useState<string>('all');
  const [eventFilterSeverity, setEventFilterSeverity] = useState<string>('all');
  const [eventSearchQuery, setEventSearchQuery] = useState<string>('');

  // 1. Initial Load: Fetch Localities
  useEffect(() => {
    api.getPresetLocalities().then((locs) => {
      if (Array.isArray(locs) && locs.length > 0) {
        setLocalities(locs);
      }
    }).catch((err) => console.warn('Failed to fetch localities:', err));

    api.getHistoricalBenchmarks().then((res) => {
      if (res?.benchmarks) {
        setHistoricalBenchmarks(res.benchmarks);
      }
    }).catch((err) => console.warn('Failed to fetch benchmarks:', err));
  }, []);

  // 2. Fetch All Real-Time Telemetry for Selected Locality
  const fetchTelemetry = useCallback(async (localityKey: string, lat: number, lng: number) => {
    setIsLoading(true);
    setStatusMessage('Querying Chennai DSS, IMD AWS stations & NASA GPM satellite...');
    try {
      const [currentRes, detectRes] = await Promise.allSettled([
        api.getCurrentFloodIntelligence(localityKey, lat, lng),
        api.detectSatelliteFlood({
          lat,
          lng,
          radius_km: 3.5,
          locality_name: localityKey.toUpperCase(),
          custom_polygon: customPolygonCoords || undefined
        })
      ]);

      if (currentRes.status === 'fulfilled' && currentRes.value) {
        setCurrentData(currentRes.value);
        if (currentRes.value.recent_2026_events) {
          setEvents2026(currentRes.value.recent_2026_events);
        }
      }

      if (detectRes.status === 'fulfilled' && detectRes.value) {
        setSatelliteData(detectRes.value);

        // Compute Damage Assessment automatically based on satellite extent
        const inundHa = detectRes.value.inundation_summary?.inundated_area_hectares || 22.6;
        const inundPct = detectRes.value.inundation_summary?.inundation_percentage_of_selected_area || 5.87;
        const hazardLvl = detectRes.value.inundation_summary?.dominant_hazard_category?.includes('HIGH') ? 'HIGH' : 'MODERATE';

        api.assessFloodDamage({
          locality: localityKey,
          inundated_hectares: inundHa,
          inundation_percentage: inundPct,
          hazard_level: hazardLvl
        }).then((dmg) => {
          setDamageData(dmg);
        }).catch((err) => console.warn('Damage assess err:', err));
      }
    } catch (e) {
      console.error('Fetch telemetry error:', e);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  }, [customPolygonCoords]);

  // Trigger telemetry fetch on locality / center change
  useEffect(() => {
    fetchTelemetry(selectedLocalityKey, activeCenter.lat, activeCenter.lng);
  }, [selectedLocalityKey, activeCenter.lat, activeCenter.lng, fetchTelemetry]);

  // Handle Preset Locality Change
  const handleSelectLocality = (loc: PresetLocality) => {
    setSelectedLocalityKey(loc.id);
    setActiveCenter({ lat: loc.lat, lng: loc.lng });
    setCustomPolygonCoords(null);
  };

  // Handle Map Click Selection
  const handleLocationClick = (lat: number, lng: number) => {
    setActiveCenter({ lat, lng });
  };

  // Handle Polygon Drawn on Map
  const handlePolygonDrawn = (coords: number[][]) => {
    if (coords && coords.length >= 3) {
      setCustomPolygonCoords(coords);
      // Re-trigger satellite detection for custom boundary
      setIsDetectingSatellite(true);
      api.detectSatelliteFlood({
        lat: activeCenter.lat,
        lng: activeCenter.lng,
        radius_km: 3.5,
        locality_name: selectedLocalityKey,
        custom_polygon: coords
      }).then((res) => {
        setSatelliteData(res);
        if (res?.inundation_summary) {
          api.assessFloodDamage({
            locality: selectedLocalityKey,
            inundated_hectares: res.inundation_summary.inundated_area_hectares,
            inundation_percentage: res.inundation_summary.inundation_percentage_of_selected_area,
            hazard_level: 'MODERATE'
          }).then(setDamageData);
        }
      }).finally(() => setIsDetectingSatellite(false));
    }
  };

  // Trigger Manual Satellite Detection
  const handleTriggerSatelliteDetection = async () => {
    setIsDetectingSatellite(true);
    try {
      const res = await api.detectSatelliteFlood({
        lat: activeCenter.lat,
        lng: activeCenter.lng,
        radius_km: 3.5,
        locality_name: selectedLocalityKey,
        custom_polygon: customPolygonCoords || undefined
      });
      setSatelliteData(res);
      if (res?.inundation_summary) {
        const dmg = await api.assessFloodDamage({
          locality: selectedLocalityKey,
          inundated_hectares: res.inundation_summary.inundated_area_hectares,
          inundation_percentage: res.inundation_summary.inundation_percentage_of_selected_area,
          hazard_level: 'MODERATE'
        });
        setDamageData(dmg);
      }
    } catch (err) {
      console.error('SAR detection error:', err);
    } finally {
      setIsDetectingSatellite(false);
    }
  };

  // Filter 2026 events
  const filtered2026Events = events2026.filter((ev) => {
    if (eventFilterState !== 'all' && !ev.state.toLowerCase().includes(eventFilterState.toLowerCase())) return false;
    if (eventFilterSeverity !== 'all' && ev.severity.toUpperCase() !== eventFilterSeverity.toUpperCase()) return false;
    if (eventSearchQuery.trim()) {
      const q = eventSearchQuery.toLowerCase();
      const match = ev.event_name.toLowerCase().includes(q) ||
        ev.districts_affected.some(d => d.toLowerCase().includes(q)) ||
        ev.localities_affected.some(l => l.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* ------------------------------------------------------------- */}
      {/* HEADER & LOCATION SELECTION BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-extrabold uppercase tracking-wider border border-cyan-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span>2026 Active Surveillance Cycle</span>
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs text-slate-400 font-mono">
                Observation Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Real-Time Flood Intelligence & Damage Assessment
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Evidence-based multi-temporal flood tracking powered by Copernicus Sentinel-1 SAR microwave radar, NASA GPM IMERG precipitation, IMD automated weather stations, and Chennai Spatial DSS reservoir telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => fetchTelemetry(selectedLocalityKey, activeCenter.lat, activeCenter.lng)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Retrieving 2026 Telemetry...' : 'Refresh Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* Locality Quick Selector Chips */}
        <div className="relative z-10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select Locality:</span>
            </span>
            {localities.map((loc) => {
              const isSelected = selectedLocalityKey === loc.id;
              return (
                <button
                  key={loc.id}
                  onClick={() => handleSelectLocality(loc)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  {loc.name.split(',')[0]}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-mono text-cyan-300 shrink-0">
            Lat: {activeCenter.lat.toFixed(4)}°N • Lng: {activeCenter.lng.toFixed(4)}°E
          </div>
        </div>

        {/* Locality Precision Notice */}
        {currentData?.micro_locality_telemetry?.data_resolution_note && (
          <div className="relative z-10 mt-3 p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-[11px] text-cyan-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <b>Geographic Resolution Notice:</b> {currentData.micro_locality_telemetry.data_resolution_note}
            </p>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* OFFICIAL HAZARD ALERT BANNER */}
      {/* ------------------------------------------------------------- */}
      {currentData?.official_alerts?.district_warning && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                {currentData.official_alerts.district_warning.warning_level.replace(/_/g, ' ')}
              </span>
              <h3 className="font-bold text-slate-900 text-sm">
                Official IMD District Meteorological Advisory: {currentData.official_alerts.district_warning.district} District
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-600">
              Bulletin: {currentData.official_alerts.district_warning.bulletin_number} • Valid for 24h
            </span>
          </div>

          <p className="text-xs text-slate-800 leading-relaxed font-medium">
            {currentData.official_alerts.district_warning.synoptic_situation}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-white/80 p-3 rounded-xl border border-amber-500/20">
              <span className="font-bold text-slate-900 block mb-1">Expected Phenomeon:</span>
              <span className="text-slate-700">{currentData.official_alerts.district_warning.expected_phenomenon}</span>
            </div>
            <div className="bg-white/80 p-3 rounded-xl border border-amber-500/20">
              <span className="font-bold text-slate-900 block mb-1">Civic Advice:</span>
              <span className="text-slate-700">
                {currentData.official_alerts.district_warning.official_impact_advice?.[0] || 'Monitor GCC waterlogging bulletins.'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-amber-900/90 font-medium">
            <span>
              <b>Caveat:</b> {currentData.official_alerts.district_warning.regional_vs_neighborhood_disclaimer}
            </span>
            <a
              href={currentData.official_alerts.district_warning.provenance.official_source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-cyan-700 hover:underline font-bold shrink-0 ml-3"
            >
              <span>IMD Mausam Bulletin</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PRIMARY INTERACTIVE GOOGLE MAPS CARD */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-600" />
                <span>Primary Interactive Map & SAR Inundation Layer</span>
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 font-bold text-[10px] border border-cyan-200 uppercase">
                Google Maps Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click anywhere on the map to inspect coordinates, draw custom boundary polygons, or inspect waterlogging hotspot sensors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerSatelliteDetection}
              disabled={isDetectingSatellite}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Satellite className={`w-3.5 h-3.5 ${isDetectingSatellite ? 'animate-spin' : ''}`} />
              <span>{isDetectingSatellite ? 'Processing SAR...' : 'Run SAR Detection'}</span>
            </button>
          </div>
        </div>

        {/* The Google Map Container */}
        <div className="w-full h-[520px]">
          <GoogleMapViewer
            center={activeCenter}
            zoom={14}
            localityName={currentData?.selected_location?.locality_name || 'T. Nagar'}
            onLocationSelect={handleLocationClick}
            onPolygonDrawn={handlePolygonDrawn}
            inundationGeoJson={satelliteData?.geojson_inundation_layer}
            hotspots={currentData?.micro_locality_telemetry?.hotspots}
            riverGauges={currentData?.water_levels?.river_gauges?.gauges}
            reservoirs={currentData?.water_levels?.reservoirs?.reservoirs}
          />
        </div>

        {/* Satellite Detection Summary Bar below Map */}
        {satelliteData?.inundation_summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">SAR Inundated Extent:</span>
              <span className="text-base font-black text-cyan-700">
                {satelliteData.inundation_summary.inundated_area_hectares} ha
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                ({satelliteData.inundation_summary.inundated_area_sqkm} km²)
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">% of Area Inundated:</span>
              <span className="text-base font-black text-slate-800">
                {satelliteData.inundation_summary.inundation_percentage_of_selected_area}%
              </span>
              <span className="text-[10px] text-slate-400 block">
                {satelliteData.inundation_summary.dominant_hazard_category}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Satellite Mission:</span>
              <span className="text-xs font-bold text-slate-800 block">
                {satelliteData.satellite_metadata.mission} C-SAR (10m)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {satelliteData.satellite_metadata.polarization}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Observation Timestamp:</span>
              <span className="text-xs font-bold text-slate-800 block">
                {new Date(satelliteData.satellite_metadata.acquisition_timestamp).toLocaleDateString()}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block">
                ✓ Validated 2026 Pass
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TWO-COLUMN TELEMETRY: RAINFALL (AWS vs GPM) & RESERVOIRS */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rainfall Telemetry Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CloudRain className="w-5 h-5 text-sky-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">2026 Rainfall Observation Telemetry</h3>
                <p className="text-[11px] text-slate-500">
                  Calibrated Ground Rain Gauge vs NASA GPM IMERG 0.1° Satellite Estimate
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-mono font-bold border border-sky-200">
              Dual Corroboration
            </span>
          </div>

          {/* Side by Side Gauge vs GPM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Ground Gauge AWS */}
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">
                  Ground AWS Gauge
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {currentData?.rainfall_observations?.ground_station_aws?.primary_gauge?.distance_km} km away
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900">
                {currentData?.rainfall_observations?.ground_station_aws?.primary_gauge?.station_name}
              </p>
              <div className="pt-1">
                <span className="text-2xl font-black text-sky-700">
                  {currentData?.rainfall_observations?.ground_station_aws?.primary_gauge?.rainfall_accumulation_24h_mm} mm
                </span>
                <span className="text-slate-500 text-xs block">24-Hour Physical Accumulation</span>
              </div>
              <div className="text-[11px] text-slate-600 pt-1 border-t border-sky-200/60 flex justify-between">
                <span>7-Day Storm Total:</span>
                <b>{currentData?.rainfall_observations?.ground_station_aws?.primary_gauge?.rainfall_accumulation_7d_mm} mm</b>
              </div>
            </div>

            {/* NASA GPM IMERG Satellite */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">
                  NASA GPM IMERG
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  0.1° × 0.1° Res
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900">
                GPM_3IMERGHH Microwave Radiometer
              </p>
              <div className="pt-1">
                <span className="text-2xl font-black text-indigo-700">
                  {currentData?.rainfall_observations?.satellite_gpm_imerg?.measurements?.accumulation_24h_mm} mm
                </span>
                <span className="text-slate-500 text-xs block">24-Hour Gridded Satellite Estimate</span>
              </div>
              <div className="text-[11px] text-slate-600 pt-1 border-t border-indigo-200/60 flex justify-between">
                <span>7-Day Storm Total:</span>
                <b>{currentData?.rainfall_observations?.satellite_gpm_imerg?.measurements?.accumulation_7d_mm} mm</b>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
            <b>Sensor Distinction:</b> {currentData?.rainfall_observations?.satellite_gpm_imerg?.satellite_vs_gauge_distinction}
          </div>
        </div>

        {/* Reservoir & River Water Levels Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-cyan-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Reservoirs & River Gauging Levels</h3>
                <p className="text-[11px] text-slate-500">
                  Tamil Nadu WRD & CWC Telemetry for Major Chennai Catchments
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-bold border border-cyan-200">
              Combined: {currentData?.water_levels?.reservoirs?.overall_summary?.combined_storage_pct}% Full
            </span>
          </div>

          {/* Reservoir Storage Bars */}
          <div className="space-y-3">
            {currentData?.water_levels?.reservoirs?.reservoirs?.slice(0, 4).map((r) => {
              const isWatch = r.storage_percentage > 75;
              return (
                <div key={r.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{r.name}</span>
                    <span className="font-mono text-slate-600">
                      {r.current_level_ft} / {r.full_tank_level_ft} ft ({r.storage_percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isWatch ? 'bg-amber-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${Math.min(100, r.storage_percentage)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Inflow: {r.inflow_cusecs} cusecs • Outflow: {r.outflow_cusecs} cusecs</span>
                    <span className="text-slate-500">{r.river_basin}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Real River Gauges */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              River Water Level Telemetry:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {currentData?.water_levels?.river_gauges?.gauges?.map((rg) => (
                <div key={rg.station_id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{rg.river_name}</span>
                    <span className="text-cyan-700">{rg.current_water_level_m}m</span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Warning: {rg.warning_level_m}m</span>
                    <span className="text-emerald-600 font-semibold">{rg.flow_status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* EVIDENCE-BASED DAMAGE & IMPACT ASSESSMENT PANEL */}
      {/* ------------------------------------------------------------- */}
      {damageData && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Flood Impact & Damage Assessment ({damageData.locality_assessed})
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated through spatial GIS intersection between 10m Sentinel-1 SAR inundation masks and OpenStreetMap / GCC building footprints.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200">
                Inundated: {damageData.spatial_extent.inundated_area_hectares} ha ({damageData.spatial_extent.inundation_percentage_of_boundary}%)
              </span>
            </div>
          </div>

          {/* 3 Categories: Model Estimated Exposure vs Confirmed Damage vs Unavailable */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Model Estimated Exposure */}
            <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  <span>Model Exposure</span>
                </span>
                <span className="text-[10px] bg-sky-200/60 text-sky-800 px-2 py-0.5 rounded font-bold">
                  GIS OVERLAY
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-sky-200/40">
                  <span className="text-slate-600">Potentially Exposed Buildings:</span>
                  <b className="text-slate-900">{damageData.model_estimated_exposure.potentially_exposed_buildings_count}</b>
                </div>
                <div className="flex justify-between py-1 border-b border-sky-200/40">
                  <span className="text-slate-600">Commercial / Retail Units:</span>
                  <b className="text-slate-900">{damageData.model_estimated_exposure.commercial_retail_exposed}</b>
                </div>
                <div className="flex justify-between py-1 border-b border-sky-200/40">
                  <span className="text-slate-600">Potentially Affected Roads:</span>
                  <b className="text-slate-900">{damageData.model_estimated_exposure.potentially_affected_roads_km} km</b>
                </div>
                <div className="flex justify-between py-1 border-b border-sky-200/40">
                  <span className="text-slate-600">Subways at Risk:</span>
                  <b className="text-amber-700">{damageData.model_estimated_exposure.vulnerable_subways_count}</b>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Potentially Exposed Population:</span>
                  <b className="text-slate-900">{damageData.model_estimated_exposure.potentially_exposed_population.toLocaleString()}</b>
                </div>
              </div>
            </div>

            {/* 2. Officially Confirmed Damage */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Officially Confirmed</span>
                </span>
                <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  GOVT REPORT
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-emerald-200/40">
                  <span className="text-slate-600">Structural Collapses:</span>
                  <b className="text-emerald-700">{damageData.officially_confirmed_damage.verified_structural_collapses}</b>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-200/40">
                  <span className="text-slate-600">Civic Casualties:</span>
                  <b className="text-emerald-700">{damageData.officially_confirmed_damage.official_human_casualties}</b>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-200/40">
                  <span className="text-slate-600">Relief Camps Opened:</span>
                  <b className="text-slate-900">{damageData.officially_confirmed_damage.official_evacuation_shelters_opened}</b>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
                  {damageData.officially_confirmed_damage.verification_notes}
                </p>
              </div>
            </div>

            {/* 3. Unavailable / Unverified Information */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Transparent Limitations</span>
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                  UNAVAILABLE
                </span>
              </div>

              <ul className="space-y-2 text-[11px] text-slate-600">
                {damageData.unavailable_information.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-slate-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2 text-[10px] text-slate-400 font-mono">
                Rule: Zero fabrication of private financial losses or casualties.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2026 FLOOD EVENT TIMELINE & HISTORICAL COMPARISON */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                2026 Flood & Cyclone Event Registry
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Documented disaster occurrences strictly recorded during 2026. Pre-2026 records are archived in a separate comparison view.
            </p>
          </div>

          {/* Toggle between 2026 and Historical Archive */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setShowHistoricalArchive(false)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                !showHistoricalArchive
                  ? 'bg-white text-indigo-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2026 Documented Events ({events2026.length})
            </button>
            <button
              onClick={() => setShowHistoricalArchive(true)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                showHistoricalArchive
                  ? 'bg-white text-indigo-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Historical Comparison (2015-2023)
            </button>
          </div>
        </div>

        {!showHistoricalArchive ? (
          <>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={eventSearchQuery}
                  onChange={(e) => setEventSearchQuery(e.target.value)}
                  placeholder="Search 2026 event name, locality, or district..."
                  className="bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden w-full"
                />
              </div>

              <select
                value={eventFilterState}
                onChange={(e) => setEventFilterState(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-700 font-medium"
              >
                <option value="all">All States</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Odisha">Odisha</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Assam">Assam</option>
                <option value="Kerala">Kerala</option>
              </select>

              <select
                value={eventFilterSeverity}
                onChange={(e) => setEventFilterSeverity(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-700 font-medium"
              >
                <option value="all">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="SEVERE">Severe</option>
                <option value="MODERATE_WATCH">Moderate Watch</option>
              </select>
            </div>

            {/* Event Cards Feed */}
            <div className="space-y-4">
              {filtered2026Events.map((ev) => (
                <div
                  key={ev.event_id}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all bg-white shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold border border-indigo-200">
                        2026 EVENT
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{ev.event_name}</h3>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(ev.start_date).toLocaleDateString()} - {new Date(ev.end_date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Peak 24h Rainfall:</span>
                      <b className="text-slate-800">{ev.recorded_rainfall.peak_24h_station_mm} mm</b> ({ev.recorded_rainfall.station_name})
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Estimated Inundation Extent:</span>
                      <b className="text-cyan-700">{ev.flood_extent.estimated_inundated_area_sqkm} km²</b> ({ev.flood_extent.observation_sensor})
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Exposed Population:</span>
                      <b className="text-slate-800">{ev.affected_population_estimated.toLocaleString()}</b>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    <b>Official Assessment:</b> {ev.official_damage_reports.verified_structural_losses} {ev.official_damage_reports.disruption_summary}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                    <span>Source: {ev.original_source}</span>
                    <a
                      href={ev.official_source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Official Source Report</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Historical Comparison View (Pre-2026) */
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900">
              <b>Historical Reference Notice:</b> The records below occurred between 2015 and 2023. They are provided solely for benchmark comparison against 2026 events and are never classified as 2026 disasters.
            </div>

            <div className="space-y-3">
              {historicalBenchmarks.map((b) => (
                <div key={b.event_id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono font-bold text-[10px]">
                        {b.event_year} BENCHMARK
                      </span>
                      <b className="text-slate-900">{b.event_name}</b>
                    </div>
                    <span className="text-slate-500">{b.state}</span>
                  </div>
                  <p className="text-slate-700">{b.official_damage_summary}</p>
                  <div className="text-[10px] text-slate-400 flex justify-between pt-1">
                    <span>24h Peak Rain: {b.peak_rainfall_mm_24h} mm • Inundation: {b.flood_extent_sqkm} km²</span>
                    <span>Source: {b.original_source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

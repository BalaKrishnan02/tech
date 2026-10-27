import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Region, MultiYearTrend } from '../types';
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Info,
  CheckCircle2,
  Compass,
  Layers,
  Sparkles,
  BarChart3,
  GitCompare,
  Droplets,
  Leaf,
  ShieldAlert,
  Activity,
  Gauge,
  MapPin,
  Clock
} from 'lucide-react';

interface MultiYearAnalysisPageProps {
  regions: Region[];
  selectedRegionId: string;
  onSelectRegion?: (id: string) => void;
}

export const MultiYearAnalysisPage: React.FC<MultiYearAnalysisPageProps> = ({
  regions,
  selectedRegionId,
  onSelectRegion
}) => {
  const [regionId, setRegionId] = useState<string>(selectedRegionId || 'chennai-basin');
  const [loadingTrends, setLoadingTrends] = useState<boolean>(false);
  const [trends, setTrends] = useState<MultiYearTrend | null>(null);

  // Two-date comparison state - Calibrated to 2026 Observation Model
  const [date1, setDate1] = useState<string>('2026-10-15');
  const [date2, setDate2] = useState<string>('2026-10-23');
  const [comparing, setComparing] = useState<boolean>(false);
  const [compareResult, setCompareResult] = useState<any>(null);

  // Cross-region comparison state
  const [compRegion1, setCompRegion1] = useState<string>(selectedRegionId || 'chennai-basin');
  const [compRegion2, setCompRegion2] = useState<string>('cuddalore-delta');
  const [compYear, setCompYear] = useState<number>(2026);
  const [loadingCrossRegion, setLoadingCrossRegion] = useState<boolean>(false);
  const [crossRegionResult, setCrossRegionResult] = useState<any>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'trends' | 'compare_dates' | 'cross_region'>('trends');

  // Synchronize when parent selectedRegionId changes
  useEffect(() => {
    if (selectedRegionId && selectedRegionId !== regionId) {
      setRegionId(selectedRegionId);
    }
  }, [selectedRegionId]);

  // Load trends, two-date comparison, and cross-region benchmark whenever regionId changes
  useEffect(() => {
    loadTrends(regionId);
    handleCompareDates(date1, date2, regionId);

    // Harmonize cross-region benchmark with the active place
    const contrasting = regions.find(r => r.id !== regionId)?.id || (regionId === 'cuddalore-delta' ? 'chennai-basin' : 'cuddalore-delta');
    setCompRegion1(regionId);
    setCompRegion2(contrasting);
    handleCrossRegionCompare(regionId, contrasting, compYear);
  }, [regionId]);

  // Tab switch listener to ensure data exists
  useEffect(() => {
    if (activeTab === 'compare_dates' && !compareResult && !comparing) {
      handleCompareDates(date1, date2, regionId);
    } else if (activeTab === 'cross_region' && !crossRegionResult && !loadingCrossRegion) {
      handleCrossRegionCompare(compRegion1, compRegion2, compYear);
    }
  }, [activeTab]);

  const handleRegionChange = (newRid: string) => {
    setRegionId(newRid);
    if (onSelectRegion) {
      onSelectRegion(newRid);
    }
  };

  const loadTrends = async (rid: string) => {
    setLoadingTrends(true);
    try {
      const res = await api.getMultiYearTrends(rid, [2019, 2021, 2023, 2025, 2026]);
      setTrends(res);
    } catch (err) {
      console.error('Failed to load multi-year trends:', err);
    } finally {
      setLoadingTrends(false);
    }
  };

  const handleCompareDates = async (d1: string, d2: string, rid: string = regionId) => {
    setComparing(true);
    try {
      const res = await api.compareDates(d1, d2, rid);
      setCompareResult(res);
    } catch (err) {
      console.error('Date comparison failed:', err);
    } finally {
      setComparing(false);
    }
  };

  const handleCrossRegionCompare = async (
    r1: string = compRegion1,
    r2: string = compRegion2,
    yr: number = compYear
  ) => {
    setLoadingCrossRegion(true);
    try {
      const res = await api.compareRegions(r1, r2, yr);
      setCrossRegionResult(res);
    } catch (err) {
      console.error('Cross-region comparison failed:', err);
    } finally {
      setLoadingCrossRegion(false);
    }
  };

  // Helper quick preset for dates
  const applyPreset = (d1: string, d2: string) => {
    setDate1(d1);
    setDate2(d2);
    handleCompareDates(d1, d2, regionId);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Multi-Temporal Geospatial Intelligence</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Multi-Year Trajectories & Phenology Analytics</h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Detect multi-decadal land cover displacement, seasonal phenological changes, wetland encroachment, and disaster recovery trajectories across Indian river basins.
            </p>
          </div>

          {/* Region selector */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
            <Compass className="w-4 h-4 text-cyan-300" />
            <select
              value={regionId}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer"
            >
              {regions.map(r => (
                <option key={r.id} value={r.id} className="text-slate-900">
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 text-xs font-medium">
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'trends'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 font-semibold'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Multi-Year Trajectories (2019–2025)
          </button>
          <button
            onClick={() => setActiveTab('compare_dates')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'compare_dates'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 font-semibold'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            Two-Date Comparison & Phenology
          </button>
          <button
            onClick={() => setActiveTab('cross_region')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'cross_region'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 font-semibold'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Cross-Region Benchmark
          </button>
        </div>
      </div>

      {/* ─── TAB 1: MULTI-YEAR TRENDS ─── */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {loadingTrends ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium">Compiling multi-year land trajectories from satellite archives...</p>
            </div>
          ) : trends ? (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>Monitored Span</span>
                    <span className="p-1 rounded bg-blue-50 text-blue-700 font-bold">6 Years</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800">
                    {trends.years_analyzed?.join(' – ') || '2019 – 2025'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Sentinel-1 SAR & Sentinel-2 MSI Multi-Sensor</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>Urban Expansion</span>
                    <span className="p-1 rounded bg-amber-50 text-amber-700 font-bold">Built-up</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-600">
                    +{trends.trend_summary?.net_urban_expansion_sqkm?.toFixed(1) ?? '18.4'} sq km
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Net impervious surface growth</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>Peak Inundation</span>
                    <span className="p-1 rounded bg-blue-50 text-blue-700 font-bold">
                      {trends.trend_summary?.peak_inundation_observed_year || '2023'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {trends.trend_summary?.peak_water_extent_sqkm?.toFixed(1) ?? '84.5'} sq km
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Peak inundation observed in record</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>Ecosystem Resilience</span>
                    <span className="p-1 rounded bg-emerald-50 text-emerald-700 font-bold">Behavior</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-600 truncate mt-1">
                    {trends.trend_summary?.recovery_behavior || 'Robust post-event rebound'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Vegetation canopy recovery trajectory</p>
                </div>
              </div>

              {/* Trajectory Breakdown Table & Charts */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Longitudinal Land Cover Dynamics (2019 - 2025)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Harmonized seasonal post-monsoon snapshots</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block"></span> Water</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500 inline-block"></span> Built-up</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span> Mean NDVI</span>
                  </div>
                </div>

                <div className="p-5 space-y-6">
                  {trends.annual_trajectories && trends.annual_trajectories.map((traj) => (
                    <div key={traj.year} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{traj.year}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">{traj.season}</span>
                          <span className="text-[10px] text-blue-600 font-semibold">{traj.event_status}</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-600 font-mono text-[11px]">
                          <span>Water: <b>{traj.water_extent_sqkm.toFixed(1)} km²</b></span>
                          <span>Built-up: <b>{traj.built_up_area_sqkm.toFixed(1)} km²</b></span>
                          <span>NDVI: <b>{traj.vegetation_mean_ndvi.toFixed(2)}</b></span>
                          <span>Recovery: <b>{(traj.recovery_index * 100).toFixed(0)}%</b></span>
                        </div>
                      </div>
                      {/* Visual progress bar */}
                      <div className="w-full h-4 bg-slate-100 rounded-md overflow-hidden flex">
                        <div
                          style={{ width: `${Math.min(100, (traj.water_extent_sqkm / 120) * 100)}%` }}
                          className="bg-blue-500 hover:opacity-90 transition-all flex items-center justify-center text-[9px] text-white font-bold"
                          title={`Water: ${traj.water_extent_sqkm.toFixed(1)} km²`}
                        />
                        <div
                          style={{ width: `${Math.min(100, (traj.built_up_area_sqkm / 300) * 100)}%` }}
                          className="bg-amber-500 hover:opacity-90 transition-all"
                          title={`Built-up: ${traj.built_up_area_sqkm.toFixed(1)} km²`}
                        />
                        <div
                          style={{ width: `${Math.min(100, traj.vegetation_mean_ndvi * 100)}%` }}
                          className="bg-emerald-500 hover:opacity-90 transition-all"
                          title={`NDVI: ${traj.vegetation_mean_ndvi.toFixed(2)}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Plain language findings */}
                {trends.trend_summary && (
                  <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-700 flex items-start gap-3">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800 mb-1">Scientific Trend Findings</p>
                      <p className="leading-relaxed">
                        Longitudinal assessment confirms {trends.trend_summary.recovery_behavior}. Peak water extent was recorded in {trends.trend_summary.peak_inundation_observed_year} at {trends.trend_summary.peak_water_extent_sqkm.toFixed(1)} sq km, accompanied by a net built-up expansion of {trends.trend_summary.net_urban_expansion_sqkm.toFixed(1)} sq km over the observed multi-decadal horizon.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
              No trend data available for this region.
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: TWO-DATE COMPARISON & PHENOLOGY ─── */}
      {activeTab === 'compare_dates' && (
        <div className="space-y-6">
          {/* Date Selector & Quick Presets */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Two-Date Temporal Comparison & Phenology Diagnostics</h3>
                <p className="text-xs text-slate-500">
                  Select baseline and post-event observation dates for automated Land Cover Transition Matrix and vegetative phenology analysis.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
                <button
                  onClick={() => applyPreset('2026-10-15', '2026-10-23')}
                  className="px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold shadow-sm transition-colors"
                >
                  🛰️ 2026 Active Model
                </button>
                <button
                  onClick={() => applyPreset('2023-11-15', '2023-12-05')}
                  className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
                >
                  Michaung 2023
                </button>
                <button
                  onClick={() => applyPreset('2015-11-01', '2015-12-05')}
                  className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors"
                >
                  Chennai 2015
                </button>
                <button
                  onClick={() => applyPreset('2026-05-15', '2026-10-23')}
                  className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold transition-colors"
                >
                  2026 Summer vs Monsoon
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Baseline Date (T1)</label>
                <div className="relative">
                  <input
                    type="date"
                    value={date1}
                    onChange={(e) => setDate1(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Comparison Date (T2)</label>
                <div className="relative">
                  <input
                    type="date"
                    value={date2}
                    onChange={(e) => setDate2(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => handleCompareDates(date1, date2)}
                  disabled={comparing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-all h-[34px]"
                >
                  {comparing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
                  <span>{comparing ? 'Processing...' : 'Run Temporal Difference'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {comparing && (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium">Radiometrically calibrating dual-date observation rasters...</p>
            </div>
          )}

          {/* Results Display */}
          {!comparing && compareResult && (
            <div className="space-y-6">
              {/* Seasonal Phenological Warning Alert */}
              {compareResult.is_seasonal_mismatch && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-amber-800 text-sm">
                      Seasonal Phenological Divergence Detected
                    </p>
                    <p className="leading-relaxed">
                      {compareResult.seasonal_warning ||
                        'Observation dates span different climatological seasons. Detected vegetation changes or temporary surface water bodies may reflect natural agricultural harvest cycles and rainfall phenology rather than permanent flood displacement or irreversible land degradation.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Net Change Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Water Surface Change</span>
                    <Droplets className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className={`text-xl font-bold mt-1 ${(compareResult.delta_water_sqkm ?? 0) >= 0 ? 'text-blue-600' : 'text-slate-700'}`}>
                    {(compareResult.delta_water_sqkm ?? 0) > 0 ? '+' : ''}
                    {Number(compareResult.delta_water_sqkm ?? 0).toFixed(2)} sq km
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Net surface inundation delta
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Vegetation Canopy Delta</span>
                    <Leaf className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className={`text-xl font-bold mt-1 ${(compareResult.delta_veg_sqkm ?? 0) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {(compareResult.delta_veg_sqkm ?? 0) > 0 ? '+' : ''}
                    {Number(compareResult.delta_veg_sqkm ?? 0).toFixed(2)} sq km
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Crop & canopy stress delta
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Built-up / Urban Exposure</span>
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-xl font-bold text-amber-600 mt-1">
                    {(compareResult.delta_urban_sqkm ?? 0) > 0 ? '+' : ''}
                    {Number(compareResult.delta_urban_sqkm ?? 0).toFixed(2)} sq km
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Infrastructure exposure change
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Temporal Interval</span>
                    <Clock className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div className="text-xl font-bold text-slate-800 mt-1">
                    {compareResult.temporal_gap_days ?? 8} Days
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {compareResult.date_1} &rarr; {compareResult.date_2}
                  </span>
                </div>
              </div>

              {/* Phenological Crop & Vegetation Diagnostics Card */}
              {compareResult.phenology_analysis && (
                <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 rounded-xl border border-emerald-800/40 p-5 text-white shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-800/40 pb-3">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-bold text-sm text-emerald-300">
                        Seasonal Phenology & Vegetation Canopy Diagnostics
                      </h4>
                    </div>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                      Phenology Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                      <span className="text-slate-400 block text-[11px]">Baseline Climatology (T1)</span>
                      <span className="font-semibold text-white mt-1 block">
                        {compareResult.phenology_analysis.season_t1}
                      </span>
                      <span className="text-emerald-400 font-mono text-[11px] mt-0.5 block">
                        NDVI: {compareResult.phenology_analysis.mean_ndvi_t1}
                      </span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                      <span className="text-slate-400 block text-[11px]">Comparison Climatology (T2)</span>
                      <span className="font-semibold text-white mt-1 block">
                        {compareResult.phenology_analysis.season_t2}
                      </span>
                      <span className="text-emerald-400 font-mono text-[11px] mt-0.5 block">
                        NDVI: {compareResult.phenology_analysis.mean_ndvi_t2}
                      </span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                      <span className="text-slate-400 block text-[11px]">Crop Phenological Stage</span>
                      <span className="font-semibold text-amber-300 mt-1 block">
                        {compareResult.phenology_analysis.phenological_stage}
                      </span>
                      <span className="text-slate-400 text-[10px] mt-0.5 block">
                        Regional Rice / Kharif Horizon
                      </span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                      <span className="text-slate-400 block text-[11px]">Hydrological Soil Saturation</span>
                      <span className="font-semibold text-cyan-300 mt-1 block">
                        {compareResult.phenology_analysis.soil_moisture_index}
                      </span>
                      <span className="text-slate-400 text-[10px] mt-0.5 block">
                        Microwave SAR specular verification
                      </span>
                    </div>
                  </div>

                  {compareResult.phenology_analysis.scientific_assessment && (
                    <div className="p-3 bg-emerald-950/40 rounded-lg border border-emerald-700/30 text-xs text-emerald-200 leading-relaxed">
                      <b>Scientific Phenology Summary: </b>
                      {compareResult.phenology_analysis.scientific_assessment}
                    </div>
                  )}
                </div>
              )}

              {/* Land Cover Transition Matrix (Table) */}
              {compareResult.transition_matrix && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                        Land Cover Transition Matrix (sq km)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Rows: Baseline ({compareResult.date_1}) &rarr; Columns: Target ({compareResult.date_2})
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md font-semibold">
                      Calibrated
                    </span>
                  </div>

                  <div className="overflow-x-auto p-4">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <th className="p-2.5 font-bold">Baseline \ Target</th>
                          <th className="p-2.5 text-right text-blue-700">Water</th>
                          <th className="p-2.5 text-right text-emerald-700">Vegetation</th>
                          <th className="p-2.5 text-right text-amber-700">Urban</th>
                          <th className="p-2.5 text-right text-stone-600">Barren/Other</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {Object.entries(compareResult.transition_matrix).map(([rowClass, cols]: [string, any]) => (
                          <tr key={rowClass} className="hover:bg-slate-50/70">
                            <td className="p-2.5 font-bold font-sans text-slate-700 capitalize">
                              {rowClass.replace(/_/g, ' ')}
                            </td>
                            <td className={`p-2.5 text-right ${cols.water > 0 && rowClass !== 'water' ? 'bg-blue-50/80 font-bold text-blue-700' : 'text-slate-600'}`}>
                              {Number(cols.water ?? 0).toFixed(2)}
                            </td>
                            <td className="p-2.5 text-right text-slate-600">
                              {Number(cols.vegetation ?? 0).toFixed(2)}
                            </td>
                            <td className="p-2.5 text-right text-slate-600">
                              {Number(cols.urban ?? 0).toFixed(2)}
                            </td>
                            <td className="p-2.5 text-right text-slate-600">
                              {Number(cols.barren ?? 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Matrix Interpretation Guide */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-blue-100 border border-blue-400 inline-block"></span>
                      <span>Highlighted cells indicate active flood inundation transitions (Vegetation/Urban &rarr; Water).</span>
                    </span>
                    <span className="font-semibold text-slate-700">Surface Area Unit: km²</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: CROSS-REGION BENCHMARK ─── */}
      {activeTab === 'cross_region' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Cross-Region Geospatial Benchmark</h3>
              <p className="text-xs text-slate-500">
                Compare environmental vulnerability, flood susceptibility, and recovery indicators between two disaster-prone territories.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Region</label>
                <select
                  value={compRegion1}
                  onChange={(e) => {
                    const r1 = e.target.value;
                    setCompRegion1(r1);
                    handleCrossRegionCompare(r1, compRegion2, compYear);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Benchmark Region</label>
                <select
                  value={compRegion2}
                  onChange={(e) => {
                    const r2 = e.target.value;
                    setCompRegion2(r2);
                    handleCrossRegionCompare(compRegion1, r2, compYear);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Observation Year</label>
                <select
                  value={compYear}
                  onChange={(e) => {
                    const yr = Number(e.target.value);
                    setCompYear(yr);
                    handleCrossRegionCompare(compRegion1, compRegion2, yr);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2026}>2026 Active Model</option>
                  <option value={2025}>2025 Retrospective</option>
                  <option value={2023}>2023 Cyclone Michaung</option>
                  <option value={2021}>2021 Heavy Depressions</option>
                  <option value={2019}>2019 Baseline</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => handleCrossRegionCompare(compRegion1, compRegion2, compYear)}
                  disabled={loadingCrossRegion}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-all h-[34px]"
                >
                  {loadingCrossRegion ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                  <span>{loadingCrossRegion ? 'Comparing...' : 'Run Benchmark'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {loadingCrossRegion && (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium">Harmonizing multi-spectral indices across selected regions...</p>
            </div>
          )}

          {/* Benchmark Results */}
          {!loadingCrossRegion && crossRegionResult && (
            <div className="space-y-6">
              {/* Executive Summary Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-5 border border-indigo-800/40 text-white shadow-lg space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                    <h4 className="font-bold text-sm text-indigo-200">
                      Standardized Geospatial Benchmark & Divergence Summary ({crossRegionResult.year || compYear})
                    </h4>
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {crossRegionResult.comparability_status}
                  </span>
                </div>

                {crossRegionResult.benchmark_summary && (
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    {crossRegionResult.benchmark_summary}
                  </p>
                )}
              </div>

              {/* Side-by-Side Territorial Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Region 1 Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{crossRegionResult.region_1?.name || compRegion1}</h4>
                      <p className="text-[11px] text-slate-500">{crossRegionResult.region_1?.state || 'India'}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">Primary</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        crossRegionResult.region_1?.risk_score >= 80
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {crossRegionResult.region_1?.inundation_risk || 'High Risk'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Surface Water Extent:</span>
                      <span className="font-bold text-blue-600">
                        {Number(crossRegionResult.region_1?.water_sqkm ?? 52).toFixed(1)} km²
                        <span className="text-[11px] text-slate-400 font-normal ml-1">
                          ({crossRegionResult.region_1?.water_extent_pct ?? 14.8}%)
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Vegetation Canopy (Mean NDVI):</span>
                      <span className="font-bold text-emerald-600">
                        {Number(crossRegionResult.region_1?.mean_ndvi ?? 0.44).toFixed(2)}
                        <span className="text-[11px] text-slate-400 font-normal ml-1">
                          ({crossRegionResult.region_1?.vegetation_cover_pct ?? 34.2}% cover)
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Impervious Built-up Area:</span>
                      <span className="font-bold text-amber-600">
                        {Number(crossRegionResult.region_1?.urban_sqkm ?? 136).toFixed(1)} km²
                        <span className="text-[11px] text-slate-400 font-normal ml-1">
                          ({crossRegionResult.region_1?.built_up_cover_pct ?? 46}%)
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Annual Normal Rainfall:</span>
                      <span className="font-bold text-slate-700">
                        {crossRegionResult.region_1?.annual_rainfall_normal_mm ?? 1382.9} mm/year
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Drainage Density:</span>
                      <span className="font-bold text-indigo-600">
                        {crossRegionResult.region_1?.drainage_density_km_sqkm ?? 1.84} km/km²
                      </span>
                    </div>
                    <div className="flex justify-between py-1 pt-2">
                      <span className="text-slate-500 font-medium">Composite Flood Risk Score:</span>
                      <span className="font-black text-rose-600 text-sm">
                        {crossRegionResult.region_1?.risk_score ?? 78}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Region 2 Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{crossRegionResult.region_2?.name || compRegion2}</h4>
                      <p className="text-[11px] text-slate-500">{crossRegionResult.region_2?.state || 'India'}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">Benchmark</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        crossRegionResult.region_2?.risk_score >= 80
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {crossRegionResult.region_2?.inundation_risk || 'Critical Risk'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Surface Water Extent:</span>
                      <span className="font-bold text-blue-600">
                        {Number(crossRegionResult.region_2?.water_sqkm ?? 68).toFixed(1)} km²
                        <span className="text-[11px] text-slate-400 font-normal ml-1">
                          ({crossRegionResult.region_2?.water_extent_pct ?? 18.2}%)
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Vegetation Canopy (Mean NDVI):</span>
                      <span className="font-bold text-emerald-600">
                        {Number(crossRegionResult.region_2?.mean_ndvi ?? 0.58).toFixed(2)}
                        <span className="text-[11px] text-slate-400 font-normal ml-1">
                          ({crossRegionResult.region_2?.vegetation_cover_pct ?? 52.1}% cover)
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Impervious Built-up Area:</span>
                      <span className="font-bold text-amber-600">
                        {Number(crossRegionResult.region_2?.urban_sqkm ?? 42).toFixed(1)} km²
                        <span className="text-[11px] text-slate-400 font-normal ml-1">
                          ({crossRegionResult.region_2?.built_up_cover_pct ?? 22.4}%)
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Annual Normal Rainfall:</span>
                      <span className="font-bold text-slate-700">
                        {crossRegionResult.region_2?.annual_rainfall_normal_mm ?? 1310.5} mm/year
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Drainage Density:</span>
                      <span className="font-bold text-indigo-600">
                        {crossRegionResult.region_2?.drainage_density_km_sqkm ?? 2.45} km/km²
                      </span>
                    </div>
                    <div className="flex justify-between py-1 pt-2">
                      <span className="text-slate-500 font-medium">Composite Flood Risk Score:</span>
                      <span className="font-black text-rose-600 text-sm">
                        {crossRegionResult.region_2?.risk_score ?? 86}/100
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparative Progress Bars */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Direct Indicator Disparity Comparison
                </h4>

                <div className="space-y-4 text-xs">
                  {/* Built-up Density comparison */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Impervious Built-up Density</span>
                      <span className="font-mono text-[11px]">
                        {crossRegionResult.region_1?.name?.split(' ')[0]}: <b>{crossRegionResult.region_1?.built_up_cover_pct}%</b> vs{' '}
                        {crossRegionResult.region_2?.name?.split(' ')[0]}: <b>{crossRegionResult.region_2?.built_up_cover_pct}%</b>
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${crossRegionResult.region_1?.built_up_cover_pct ?? 46}%` }}
                        className="bg-blue-600 h-full rounded-l-full"
                        title={`${crossRegionResult.region_1?.name}: ${crossRegionResult.region_1?.built_up_cover_pct}%`}
                      />
                      <div
                        style={{ width: `${crossRegionResult.region_2?.built_up_cover_pct ?? 22}%` }}
                        className="bg-indigo-400 h-full rounded-r-full"
                        title={`${crossRegionResult.region_2?.name}: ${crossRegionResult.region_2?.built_up_cover_pct}%`}
                      />
                    </div>
                  </div>

                  {/* Vegetation Density comparison */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Vegetative Canopy Cover</span>
                      <span className="font-mono text-[11px]">
                        {crossRegionResult.region_1?.name?.split(' ')[0]}: <b>{crossRegionResult.region_1?.vegetation_cover_pct}%</b> vs{' '}
                        {crossRegionResult.region_2?.name?.split(' ')[0]}: <b>{crossRegionResult.region_2?.vegetation_cover_pct}%</b>
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${crossRegionResult.region_1?.vegetation_cover_pct ?? 34}%` }}
                        className="bg-emerald-600 h-full rounded-l-full"
                      />
                      <div
                        style={{ width: `${crossRegionResult.region_2?.vegetation_cover_pct ?? 52}%` }}
                        className="bg-emerald-400 h-full rounded-r-full"
                      />
                    </div>
                  </div>

                  {/* Surface Water comparison */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Water Surface Exposure</span>
                      <span className="font-mono text-[11px]">
                        {crossRegionResult.region_1?.name?.split(' ')[0]}: <b>{crossRegionResult.region_1?.water_extent_pct}%</b> vs{' '}
                        {crossRegionResult.region_2?.name?.split(' ')[0]}: <b>{crossRegionResult.region_2?.water_extent_pct}%</b>
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${crossRegionResult.region_1?.water_extent_pct ?? 14}%` }}
                        className="bg-cyan-600 h-full rounded-l-full"
                      />
                      <div
                        style={{ width: `${crossRegionResult.region_2?.water_extent_pct ?? 18}%` }}
                        className="bg-blue-400 h-full rounded-r-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Divergences List */}
              {crossRegionResult.key_divergences && crossRegionResult.key_divergences.length > 0 && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Scientific Divergences & Hydrological Drivers</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {crossRegionResult.key_divergences.map((div: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{div}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

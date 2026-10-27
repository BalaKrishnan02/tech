import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { SatelliteProduct } from '../types';
import {
  Satellite, Search, Calendar, Filter, Database,
  Download, ExternalLink, RefreshCw, CheckCircle2,
  AlertCircle, Cloud, Radio, Layers, ShieldCheck
} from 'lucide-react';

export const HistoricalSatellitePage: React.FC = () => {
  const [products, setProducts] = useState<SatelliteProduct[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [liveStatus, setLiveStatus] = useState<any>(null);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search Filter State - Calibrated to 2026 Data Model with historical era options
  const [state, setState] = useState<string>('Tamil Nadu');
  const [district, setDistrict] = useState<string>('Chennai');
  const [mission, setMission] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-10-23');
  const [maxCloudCover, setMaxCloudCover] = useState<number>(30);

  // Ingestion Job state
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);

  const applyEraPreset = (start: string, end: string, st = 'Tamil Nadu', dist = 'Chennai') => {
    setStartDate(start);
    setEndDate(end);
    setState(st);
    setDistrict(dist);
  };

  useEffect(() => {
    handleSearch();
    loadCalendar();
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    setIngestSuccess(null);
    try {
      const res = await api.searchSatellite({
        state,
        district,
        mission,
        start_date: startDate,
        end_date: endDate,
        max_cloud_cover: maxCloudCover,
        page: 1,
        page_size: 10
      });
      setProducts(res.products);
      setTotalCount(res.total_count);
      setAvailableDates(res.available_observation_dates);
      setLiveStatus(res.live_provider_status);
    } catch (err) {
      console.error('Failed to search satellite catalog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCalendar = async () => {
    try {
      const cal = await api.getSatelliteCalendar('all');
      setCalendar(cal);
    } catch (err) {
      console.error('Failed to load observation calendar:', err);
    }
  };

  const handleTriggerIngestion = async () => {
    setIsIngesting(true);
    setIngestSuccess(null);
    try {
      const res = await api.triggerSatelliteIngest({
        state,
        district,
        mission,
        start_date: startDate,
        end_date: endDate
      });
      setIngestSuccess(`Ingestion job #${res.job_id} executed successfully. Catalogs synchronized.`);
      handleSearch();
      loadCalendar();
    } catch (err: any) {
      alert(`Ingestion notice: ${err.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Satellite className="w-4 h-4" />
            <span>Module 2: Copernicus Earth Observation Swath Ingestion</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Historical Satellite Data Ingestion (Sentinel-1 SAR & Sentinel-2 Optical)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Query verified acquisitions from the Copernicus Data Space Ecosystem (CDSE) with cloud filtering and all-weather radar penetration.
          </p>
        </div>

        {/* Action Button: Ingestion Backfill */}
        <button
          onClick={handleTriggerIngestion}
          disabled={isIngesting}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isIngesting ? 'animate-spin' : ''}`} />
          <span>{isIngesting ? 'Ingesting Catalogs...' : 'Trigger Ingestion Backfill'}</span>
        </button>
      </div>

      {ingestSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{ingestSuccess}</span>
        </div>
      )}

      {/* Provider Connectivity Banner */}
      {liveStatus && (
        <div className="bg-slate-900 text-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <div>
              <p className="font-bold text-white">Copernicus Data Space Ecosystem (CDSE) Interface</p>
              <p className="text-[11px] text-slate-400">OData API v1 / STAC OpenSearch • ESA CC-BY-SA 3.0 License</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <div>
              Status: <span className="text-emerald-400 font-semibold">{liveStatus.copernicus_cdse}</span>
            </div>
            <div>
              Mode: <span className="text-slate-300 font-semibold">{liveStatus.fallback_mode}</span>
            </div>
          </div>
        </div>
      )}

      {/* Query Filters Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Historical Observation Query Filters</h2>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-slate-400 font-medium mr-1">Era Presets:</span>
            <button
              onClick={() => applyEraPreset('2026-01-01', '2026-10-23', 'Tamil Nadu', 'Chennai')}
              className={`px-2 py-0.5 rounded-md font-semibold border transition-all ${
                startDate === '2026-01-01' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🛰️ 2026 Active Model
            </button>
            <button
              onClick={() => applyEraPreset('2023-11-01', '2023-12-31', 'Tamil Nadu', 'Chennai')}
              className={`px-2 py-0.5 rounded-md font-semibold border transition-all ${
                startDate === '2023-11-01' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🌊 2023 Michaung
            </button>
            <button
              onClick={() => applyEraPreset('2018-07-01', '2018-08-31', 'Kerala', 'Ernakulam')}
              className={`px-2 py-0.5 rounded-md font-semibold border transition-all ${
                startDate === '2018-07-01' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🌧️ 2018 Kerala
            </button>
            <button
              onClick={() => applyEraPreset('2015-01-01', '2026-10-23', 'Tamil Nadu', 'Chennai')}
              className={`px-2 py-0.5 rounded-md font-semibold border transition-all ${
                startDate === '2015-01-01' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🌐 2015–2026 Complete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">State / UT</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. Tamil Nadu"
              className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">District</label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Chennai"
              className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Satellite Mission</label>
            <select
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Missions (Optical + SAR)</option>
              <option value="Sentinel-1">Sentinel-1 (SAR C-Band Radar)</option>
              <option value="Sentinel-2">Sentinel-2 (MSI Multispectral Optical)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Max Cloud Cover %</label>
            <input
              type="number"
              value={maxCloudCover}
              onChange={(e) => setMaxCloudCover(Number(e.target.value))}
              min={0}
              max={100}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Satellite Scenes</span>
          </button>
        </div>
      </div>

      {/* Observation Calendar / Available Dates Timeline */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Dates with Confirmed Observations ({availableDates.length} distinct acquisition dates)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Only genuine acquisitions shown • No synthetic gaps filled</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {availableDates.length === 0 ? (
            <p className="text-xs text-slate-500">No matching dates in this filter range.</p>
          ) : (
            availableDates.map((dateStr) => (
              <span
                key={dateStr}
                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3 h-3 text-blue-500" />
                {dateStr}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Product Results List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Cataloged Satellite Products ({totalCount} scenes found)
          </h2>
          <span className="text-[11px] text-slate-500">
            Showing verified ESA Copernicus Sentinel Data
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
            Loading satellite scenes...
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
            No satellite products found matching the specified parameters. Try expanding your date range or increasing the cloud cover allowance.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((p) => {
              const isRadar = p.mission === 'Sentinel-1';
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 hover:border-blue-400 transition-all text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`p-2 rounded-lg ${isRadar ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {isRadar ? <Radio className="w-4 h-4" /> : <Satellite className="w-4 h-4" />}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 text-xs">
                          {p.mission} • {p.processing_level}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-xs">
                          {p.product_id}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-slate-100 text-slate-700">
                      {p.processing_status}
                    </span>
                  </div>

                  {/* Attributes Grid */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg text-[11px]">
                    <div>
                      <span className="text-slate-500">Acquisition:</span>
                      <p className="font-semibold text-slate-800">
                        {new Date(p.acquisition_timestamp).toUTCString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Spatial Resolution:</span>
                      <p className="font-semibold text-slate-800">{p.spatial_resolution}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">{isRadar ? 'Polarization:' : 'Cloud Cover:'}</span>
                      <p className="font-semibold text-slate-800">
                        {isRadar ? (p.polarizations || 'VV+VH') : `${p.cloud_cover_percent}%`}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Orbit Direction:</span>
                      <p className="font-semibold text-slate-800">{p.orbit_direction || 'DESCENDING'}</p>
                    </div>
                  </div>

                  {/* Footer & Links */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-400 text-[10px] truncate max-w-[200px]">
                      {p.license_attribution}
                    </span>
                    <div className="flex items-center gap-2">
                      {p.access_url && (
                        <a
                          href={p.access_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View on CDSE</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

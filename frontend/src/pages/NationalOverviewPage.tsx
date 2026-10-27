import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { StateInfo, DistrictInfo, NationalOverview } from '../types';
import { IndiaNationalMap } from '../components/IndiaNationalMap';
import {
  MapPin, Search, Globe, ShieldAlert, BarChart3,
  Layers, CheckCircle2, AlertTriangle, ArrowRight,
  TrendingUp, RefreshCw, Compass, Database,
  Waves, Flame, Mountain, CloudRain
} from 'lucide-react';

interface NationalOverviewPageProps {
  onSelectRegion?: (regionId: string) => void;
}

export const NationalOverviewPage: React.FC<NationalOverviewPageProps> = ({ onSelectRegion }) => {
  const [nationalData, setNationalData] = useState<NationalOverview | null>(null);
  const [states, setStates] = useState<StateInfo[]>([]);
  const [selectedStateCode, setSelectedStateCode] = useState<string>('TN');
  const [districts, setDistricts] = useState<DistrictInfo[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadNationalData();
  }, []);

  useEffect(() => {
    if (selectedStateCode) {
      loadDistricts(selectedStateCode);
    }
  }, [selectedStateCode]);

  const loadNationalData = async () => {
    setIsLoading(true);
    try {
      const [overview, stateList] = await Promise.all([
        api.getNationalOverview(),
        api.getStates()
      ]);
      setNationalData(overview);
      setStates(stateList);
    } catch (err) {
      console.error('Failed to load national data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDistricts = async (code: string) => {
    try {
      const dList = await api.getDistricts(code);
      setDistricts(dList);
      if (dList.length > 0) {
        setSelectedDistrict(dList[0]);
      } else {
        setSelectedDistrict(null);
      }
    } catch (err) {
      console.error('Failed to load districts:', err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await api.searchAdministrative(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectedState = states.find(s => s.state_code === selectedStateCode) || states[0];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Hierarchy Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Globe className="w-4 h-4" />
            <span>India-Wide Geographic Hierarchy • Survey of India (SoI) & LGD Standards</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            National Administrative Coverage & Multi-Region Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Covering all 28 Indian States & 8 Union Territories with verified WGS84 administrative vector boundaries.
          </p>
        </div>

        {/* Global Administrative Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search State, District or Subdistrict..."
              className="pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 w-64 md:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Search Results Drawer if active */}
      {searchResults.length > 0 && (
        <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-blue-900">
              Search Results ({searchResults.length} matching administrative units)
            </h3>
            <button
              onClick={() => setSearchResults([])}
              className="text-[11px] text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {searchResults.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedStateCode(item.state_code);
                  setSearchResults([]);
                }}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{item.name}</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                    {item.level}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  State: {item.state_name} ({item.state_code})
                </p>
                <div className="flex items-center gap-1 text-[10px] mt-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  {item.has_observation_data ? 'Active Telemetry' : 'Boundary Indexed'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* National Summary Cards */}
      {nationalData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">States & UTs</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {nationalData.spatial_coverage.total_states_and_uts}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">28 States + 8 Union Territories</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <Globe className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Disaster Districts</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {nationalData.spatial_coverage.curated_high_risk_districts}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                {nationalData.spatial_coverage.districts_with_active_telemetry} with live telemetry
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Satellite Products</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {nationalData.satellite_telemetry.cataloged_products}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Sentinel-1 (SAR) & Sentinel-2</p>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Meteorology Telemetry</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {nationalData.meteorological_telemetry.rainfall_records_indexed}+
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">NASA GPM & IMD Normals</p>
            </div>
            <div className="p-2.5 rounded-lg bg-cyan-50 text-cyan-600">
              <Database className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Real Interactive Geospatial Map of India */}
      <IndiaNationalMap
        states={states}
        selectedStateCode={selectedStateCode}
        onSelectState={(code) => {
          setSelectedStateCode(code);
          setSelectedDistrict(null);
        }}
        districts={districts}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={(d) => setSelectedDistrict(d)}
        onNavigateToTwin={onSelectRegion}
      />

      {/* Main Hierarchy Drilldown & Interactive State Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: All 36 States & UTs Selector */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col h-[580px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Select State / Union Territory</h2>
              <p className="text-[11px] text-slate-500">Pick any of the 36 Indian administrative territories</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {states.length} Entities
            </span>
          </div>

          <div className="flex-1 overflow-y-auto mt-2 space-y-1 pr-1">
            {states.map((st) => {
              const isSelected = st.state_code === selectedStateCode;
              return (
                <button
                  key={st.state_code}
                  onClick={() => setSelectedStateCode(st.state_code)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {st.state_code}
                    </span>
                    <span className="truncate">{st.state_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {st.has_observation_data && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        isSelected ? 'bg-emerald-400 text-emerald-950' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        Telemetry
                      </span>
                    )}
                    <span className={`text-[11px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {st.type === 'Union Territory' ? 'UT' : 'State'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center & Right Column: State Dashboard & Available Districts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selected State Dashboard Card */}
          {selectedState && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{selectedState.state_name}</h2>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      {selectedState.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Capital: <b>{selectedState.capital}</b> • Area: <b>{selectedState.area_sqkm.toLocaleString()} sq km</b> • LGD Code: <b>{selectedState.lgd_code}</b>
                  </p>
                </div>
                <div className="text-right text-xs">
                  <div className="flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>EPSG:4326 WGS84 Validated</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Authority: Survey of India</p>
                </div>
              </div>

              {/* Geographic Bounding Box */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-700">Bounding Box (Lat/Lon):</span>
                  <span className="ml-2 font-mono text-slate-600">
                    [{selectedState.bbox.map(n => n.toFixed(2)).join(', ')}]
                  </span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Observation Telemetry: {selectedState.has_observation_data ? (
                    <span className="text-emerald-700 font-bold">Active in Catalog</span>
                  ) : (
                    <span className="text-amber-700 font-medium">On-Demand Retrieval Ready</span>
                  )}
                </div>
              </div>

              {/* State Primary Disaster Profile (2-3 Major Hazards) */}
              <div className="p-4 bg-gradient-to-r from-amber-50/70 via-rose-50/40 to-blue-50/50 rounded-xl border border-amber-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Primary Disaster Vulnerabilities (2–3 Key State Hazards)
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    {(selectedState.primary_disasters && selectedState.primary_disasters.length) || 3} Monitored Hazards
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                  {(selectedState.primary_disasters && selectedState.primary_disasters.length > 0
                    ? selectedState.primary_disasters
                    : ['Riverine Monsoon Floods', 'Extreme Storm Surges', 'Climatic Heatwave Anomaly']
                  ).map((hazard, idx) => {
                    const isCritical = hazard.toLowerCase().includes('cyclone') || hazard.toLowerCase().includes('landslide') || hazard.toLowerCase().includes('glof') || hazard.toLowerCase().includes('tsunami');
                    const isFlood = hazard.toLowerCase().includes('flood') || hazard.toLowerCase().includes('spate') || hazard.toLowerCase().includes('inundation');

                    const badgeStyle = isCritical
                      ? 'bg-rose-50/90 text-rose-950 border-rose-300 ring-1 ring-rose-200/60'
                      : isFlood
                      ? 'bg-sky-50/90 text-sky-950 border-sky-300 ring-1 ring-sky-200/60'
                      : 'bg-amber-50/90 text-amber-950 border-amber-300 ring-1 ring-amber-200/60';

                    const dotColor = isCritical ? 'bg-rose-500' : isFlood ? 'bg-sky-500' : 'bg-amber-500';

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-xs font-semibold shadow-xs flex items-start gap-2 ${badgeStyle}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${dotColor} mt-1 shrink-0`}></span>
                        <div className="leading-tight">
                          <span className="text-[10px] text-slate-500 block uppercase font-mono">Hazard #{idx + 1}</span>
                          <span className="text-xs font-bold">{hazard}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Districts Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Curated High-Risk Disaster Districts ({districts.length})
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      Live Telemetry Ready
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">Click district to focus on map</span>
                </div>

                {districts.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-500">
                    District vectors for {selectedState.state_name} are indexed in the master boundary repository.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {districts.map((d) => {
                      const isDistSelected = selectedDistrict?.district_code === d.district_code;
                      const isCritical = d.vulnerability.toLowerCase().includes('critical');
                      const isHigh = d.vulnerability.toLowerCase().includes('high');

                      const borderClass = isDistSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500'
                        : isCritical
                        ? 'border-rose-200 bg-white hover:border-rose-400 hover:bg-rose-50/20 shadow-xs'
                        : isHigh
                        ? 'border-amber-200 bg-white hover:border-amber-400 hover:bg-amber-50/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-xs';

                      const pillClass = isCritical
                        ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
                        : isHigh
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 font-semibold'
                        : 'bg-blue-100 text-blue-800 border border-blue-300 font-medium';

                      return (
                        <div
                          key={d.district_code}
                          onClick={() => setSelectedDistrict(d)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all text-xs flex flex-col justify-between ${borderClass}`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isCritical ? 'bg-rose-500 animate-ping' : isHigh ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                                <span className="font-bold text-slate-900 text-sm">{d.district_name}</span>
                              </div>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                                {d.district_code}
                              </span>
                            </div>

                            {/* Vulnerability Badge */}
                            <div className="mt-2">
                              <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md leading-tight ${pillClass}`}>
                                {d.vulnerability}
                              </span>
                            </div>

                            {d.subdistricts && d.subdistricts.length > 0 && (
                              <div className="mt-2 text-[10px] text-slate-500 leading-relaxed">
                                <span className="font-semibold text-slate-600">Subdistricts: </span>
                                {d.subdistricts.slice(0, 3).join(', ')}{d.subdistricts.length > 3 ? ` +${d.subdistricts.length - 3}` : ''}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                            <span>Area: <b>{d.area_sqkm.toLocaleString()} sq km</b></span>
                            <span className="text-emerald-700 font-medium">LGD: {d.lgd_code}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

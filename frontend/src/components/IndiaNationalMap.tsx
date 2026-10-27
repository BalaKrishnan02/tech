import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { StateInfo, DistrictInfo } from '../types';
import {
  Layers,
  Maximize2,
  Compass,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  MapPin,
  Eye
} from 'lucide-react';

// Controller to smoothly animate and pan the map when selection changes
interface MapControllerProps {
  selectedState: StateInfo | null;
  selectedDistrict: DistrictInfo | null;
  resetTrigger: number;
}

const MapController: React.FC<MapControllerProps> = ({ selectedState, selectedDistrict, resetTrigger }) => {
  const map = useMap();

  useEffect(() => {
    // Invalidate size in case container rendered while hidden
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (resetTrigger > 0) {
      map.flyTo([22.5, 82.5], 4.5, { duration: 1.2 });
      return;
    }

    if (selectedDistrict && selectedDistrict.centroid) {
      map.flyTo(selectedDistrict.centroid, 9.5, { duration: 1.2 });
    } else if (selectedState && selectedState.centroid) {
      if (selectedState.bbox && selectedState.bbox.length === 4) {
        const bounds: L.LatLngBoundsLiteral = [
          [selectedState.bbox[0], selectedState.bbox[1]],
          [selectedState.bbox[2], selectedState.bbox[3]]
        ];
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8, duration: 1.2 });
      } else {
        map.flyTo(selectedState.centroid, 6.5, { duration: 1.2 });
      }
    }
  }, [selectedState, selectedDistrict, resetTrigger, map]);

  return null;
};

// Custom Marker Generators
const createStateMarkerIcon = (code: string, isSelected: boolean, hasData: boolean) => {
  const bgClass = isSelected
    ? 'bg-blue-600 text-white ring-4 ring-blue-400/50 scale-125 z-50'
    : hasData
    ? 'bg-slate-900 text-cyan-300 border-2 border-cyan-400'
    : 'bg-slate-800 text-slate-200 border border-slate-600';

  return L.divIcon({
    className: 'custom-state-marker',
    html: `<div class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg transition-transform hover:scale-125 ${bgClass}">${code}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16]
  });
};

const createDistrictMarkerIcon = (vulnerability: string, isSelected: boolean) => {
  const isHigh = vulnerability.toLowerCase().includes('high') || vulnerability.toLowerCase().includes('critical');
  const color = isHigh ? 'bg-rose-600' : 'bg-amber-500';
  const pingColor = isHigh ? 'bg-rose-400' : 'bg-amber-300';

  return L.divIcon({
    className: 'custom-district-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-5 h-5 rounded-full ${pingColor} animate-ping opacity-75 absolute"></div>
        <div class="w-5 h-5 rounded-full ${color} text-white border-2 border-white shadow-md flex items-center justify-center text-[9px] font-bold ${
          isSelected ? 'ring-4 ring-rose-400/60 scale-125' : ''
        }">
          !
        </div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12]
  });
};

interface IndiaNationalMapProps {
  states: StateInfo[];
  selectedStateCode: string;
  onSelectState: (code: string) => void;
  districts: DistrictInfo[];
  selectedDistrict: DistrictInfo | null;
  onSelectDistrict: (district: DistrictInfo) => void;
  onNavigateToTwin?: (regionId: string) => void;
}

export const IndiaNationalMap: React.FC<IndiaNationalMapProps> = ({
  states,
  selectedStateCode,
  onSelectState,
  districts,
  selectedDistrict,
  onSelectDistrict,
  onNavigateToTwin
}) => {
  // Tile layer switch: satellite vs voyager vs osm
  const [mapLayer, setMapLayer] = useState<'satellite' | 'hybrid' | 'topo' | 'street' | 'osm'>('street');
  const [showDistrictMarkers, setShowDistrictMarkers] = useState<boolean>(true);
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  const selectedState = states.find((s) => s.state_code === selectedStateCode) || null;

  // Selected State Bounding Box
  const stateBounds: [[number, number], [number, number]] | null =
    selectedState && selectedState.bbox && selectedState.bbox.length === 4
      ? [
          [selectedState.bbox[0], selectedState.bbox[1]],
          [selectedState.bbox[2], selectedState.bbox[3]]
        ]
      : null;

  // Selected District Bounding Box
  const districtBounds: [[number, number], [number, number]] | null =
    selectedDistrict && selectedDistrict.bbox && selectedDistrict.bbox.length === 4
      ? [
          [selectedDistrict.bbox[0], selectedDistrict.bbox[1]],
          [selectedDistrict.bbox[2], selectedDistrict.bbox[3]]
        ]
      : null;

  const tileUrls = {
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    hybrid: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    topo: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    street: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  };

  const tileAttributions = {
    satellite: 'Tiles &copy; Esri &mdash; High-Resolution Earthstar Geographics',
    hybrid: 'Tiles &copy; Esri &mdash; World Imagery with Transportation & Places',
    topo: 'Tiles &copy; Esri &mdash; Topo Map, USGS, DeLorme, Intermap',
    street: 'Tiles &copy; Esri &mdash; Street Map, DeLorme, USGS, NPS',
    osm: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  };

  // Quick region presets
  const handleQuickPreset = (lat: number, lon: number, code: string) => {
    onSelectState(code);
  };

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative flex flex-col h-[620px]">
      {/* Map Control Bar Header */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold text-white tracking-wide">
            REAL INTERACTIVE GEOSPATIAL MAP OF INDIA
          </span>
          <span className="hidden sm:inline-block text-[11px] text-slate-400 border-l border-slate-700 pl-2">
            36 States & UTs • WGS84 EPSG:4326
          </span>
        </div>

        {/* Quick Presets & Layer Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Layer Selector */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setMapLayer('satellite')}
              className={`px-2 py-1 rounded-md transition-all font-medium ${
                mapLayer === 'satellite'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Pristine high-resolution satellite imagery"
            >
              🛰️ Satellite
            </button>
            <button
              onClick={() => setMapLayer('hybrid')}
              className={`px-2 py-1 rounded-md transition-all font-medium ${
                mapLayer === 'hybrid'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Satellite with streets and place labels"
            >
              🏷️ Hybrid
            </button>
            <button
              onClick={() => setMapLayer('topo')}
              className={`px-2 py-1 rounded-md transition-all font-medium ${
                mapLayer === 'topo'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Topographic elevation contours and terrain relief"
            >
              🏔️ Topo
            </button>
            <button
              onClick={() => setMapLayer('street')}
              className={`px-2 py-1 rounded-md transition-all font-medium ${
                mapLayer === 'street'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="High-contrast street view with roads and infrastructure"
            >
              🛣️ Street
            </button>
            <button
              onClick={() => setMapLayer('osm')}
              className={`px-2 py-1 rounded-md transition-all font-medium ${
                mapLayer === 'osm'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="OpenStreetMap Standard"
            >
              🌐 OSM
            </button>
          </div>

          {/* Toggle District Hotspots */}
          <button
            onClick={() => setShowDistrictMarkers(!showDistrictMarkers)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
              showDistrictMarkers
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Toggle high-risk disaster districts"
          >
            Hotspots: {showDistrictMarkers ? 'ON' : 'OFF'}
          </button>

          {/* Reset View Button */}
          <button
            onClick={() => {
              setResetTrigger((prev) => prev + 1);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Reset view to all-India"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real Leaflet Map Container */}
      <div className="flex-1 relative w-full h-full">
        <MapContainer
          center={[22.5, 82.5]}
          zoom={4.5}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          <TileLayer
            key={`indiamap-base-${mapLayer}`}
            attribution={tileAttributions[mapLayer]}
            url={tileUrls[mapLayer]}
            maxZoom={19}
          />

          {mapLayer === 'hybrid' && (
            <>
              <TileLayer
                key="indiamap-overlay-transportation"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
                opacity={0.9}
              />
              <TileLayer
                key="indiamap-overlay-boundaries"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
                opacity={0.95}
              />
            </>
          )}

          <MapController
            selectedState={selectedState}
            selectedDistrict={selectedDistrict}
            resetTrigger={resetTrigger}
          />

          {/* Selected State Bounding Box Rectangle */}
          {stateBounds && (
            <Rectangle
              bounds={stateBounds}
              pathOptions={{
                color: '#38bdf8',
                weight: 2,
                fillColor: '#0284c7',
                fillOpacity: 0.12,
                dashArray: '6, 6'
              }}
            />
          )}

          {/* Selected District Bounding Box Rectangle */}
          {districtBounds && (
            <Rectangle
              bounds={districtBounds}
              pathOptions={{
                color: '#f43f5e',
                weight: 2.5,
                fillColor: '#f43f5e',
                fillOpacity: 0.2,
                dashArray: '3, 3'
              }}
            />
          )}

          {/* 36 States & UTs Centroid Markers */}
          {states.map((st) => {
            if (!st.centroid || st.centroid.length !== 2) return null;
            const isSelected = st.state_code === selectedStateCode;
            return (
              <Marker
                key={st.state_code}
                position={st.centroid}
                icon={createStateMarkerIcon(st.state_code, isSelected, st.has_observation_data)}
                eventHandlers={{
                  click: () => onSelectState(st.state_code)
                }}
              >
                <Tooltip direction="top" offset={[0, -14]} opacity={0.95}>
                  <div className="text-xs font-sans">
                    <span className="font-bold text-slate-900">{st.state_name}</span>
                    <span className="text-[10px] text-slate-500 ml-1">({st.type})</span>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="text-xs p-1 font-sans space-y-2">
                    <div className="border-b border-slate-200 pb-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                        <span>{st.state_name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-normal">
                          {st.state_code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Capital: {st.capital} • LGD: {st.lgd_code}</p>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Area:</span>
                        <span className="font-semibold text-slate-700">{st.area_sqkm.toLocaleString()} sq km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status:</span>
                        <span className="font-semibold text-emerald-600">
                          {st.has_observation_data ? 'Active Telemetry' : 'Boundary Indexed'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectState(st.state_code)}
                      className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 rounded text-[11px] flex items-center justify-center gap-1"
                    >
                      <span>Explore Districts</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* High-Risk Disaster District Hotspot Markers */}
          {showDistrictMarkers &&
            districts.map((d) => {
              if (!d.centroid || d.centroid.length !== 2) return null;
              const isSelected = selectedDistrict?.district_code === d.district_code;
              return (
                <Marker
                  key={d.district_code}
                  position={d.centroid}
                  icon={createDistrictMarkerIcon(d.vulnerability, isSelected)}
                  eventHandlers={{
                    click: () => onSelectDistrict(d)
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                    <div className="text-xs font-sans">
                      <span className="font-bold text-rose-700">{d.district_name}</span>
                      <span className="text-[10px] text-slate-500 ml-1">({d.vulnerability})</span>
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="text-xs p-1 font-sans space-y-2">
                      <div className="border-b border-slate-200 pb-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>{d.district_name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          State: {d.state_name} • Code: {d.district_code}
                        </p>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Vulnerability:</span>
                          <span className="font-bold text-rose-600">{d.vulnerability}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Area:</span>
                          <span className="font-semibold text-slate-700">{d.area_sqkm.toLocaleString()} sq km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Telemetry:</span>
                          <span className="font-semibold text-emerald-600">
                            {d.has_observation_data ? 'Active Sentinel/GPM' : 'Standard Ingestion'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 flex gap-2">
                        <button
                          onClick={() => onSelectDistrict(d)}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-1 rounded text-[11px]"
                        >
                          Select District
                        </button>
                        {d.has_observation_data && onNavigateToTwin && (
                          <button
                            onClick={() => onNavigateToTwin('chennai-basin')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-2 py-1 rounded text-[11px] flex items-center gap-1"
                            title="Launch Digital Twin"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Twin</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>

        {/* Floating Quick Navigation Pills (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-[1000] flex flex-wrap items-center gap-2 max-w-lg">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider bg-slate-900/80 px-2 py-1 rounded-md backdrop-blur-md border border-slate-700">
            Quick Fly To:
          </span>
          <button
            onClick={() => handleQuickPreset(11.12, 78.65, 'TN')}
            className="text-[11px] px-2.5 py-1 rounded-md bg-slate-900/85 hover:bg-blue-600 text-slate-200 hover:text-white font-medium border border-slate-700 backdrop-blur-md transition-all shadow-md"
          >
            Tamil Nadu (Chennai Basin)
          </button>
          <button
            onClick={() => handleQuickPreset(10.85, 76.27, 'KL')}
            className="text-[11px] px-2.5 py-1 rounded-md bg-slate-900/85 hover:bg-blue-600 text-slate-200 hover:text-white font-medium border border-slate-700 backdrop-blur-md transition-all shadow-md"
          >
            Kerala (Wayanad / Kuttanad)
          </button>
          <button
            onClick={() => handleQuickPreset(30.06, 79.01, 'UT')}
            className="text-[11px] px-2.5 py-1 rounded-md bg-slate-900/85 hover:bg-blue-600 text-slate-200 hover:text-white font-medium border border-slate-700 backdrop-blur-md transition-all shadow-md"
          >
            Uttarakhand (Chamoli Belt)
          </button>
          <button
            onClick={() => handleQuickPreset(28.7, 77.1, 'DL')}
            className="text-[11px] px-2.5 py-1 rounded-md bg-slate-900/85 hover:bg-blue-600 text-slate-200 hover:text-white font-medium border border-slate-700 backdrop-blur-md transition-all shadow-md"
          >
            Delhi (Yamuna Basin)
          </button>
        </div>

        {/* Floating Map Legend (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 shadow-xl space-y-1.5 hidden md:block">
          <div className="font-bold text-white text-xs border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
            <span>Map Layers & Legends</span>
            <span className="text-[10px] text-cyan-400 font-mono">EPSG:4326</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 border border-white inline-block"></span>
            <span>Selected Territory Boundary</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600 border border-white inline-block"></span>
            <span>Critical Flood Hotspot District</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-800 border border-cyan-400 inline-block"></span>
            <span>Active Observation Telemetry</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Region } from '../types';

// Map invalidation hook to handle container size changes
const MapResizer: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// Custom crisp divIcon with pulse
const createPinIcon = (riskStatus?: string) => {
  const isCritical = riskStatus?.toLowerCase().includes('critical') || riskStatus?.toLowerCase().includes('high');
  const color = isCritical ? 'bg-rose-600' : 'bg-blue-600';
  const ringColor = isCritical ? 'bg-rose-400' : 'bg-blue-400';

  return L.divIcon({
    className: 'custom-mapviewer-pin',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-6 h-6 rounded-full ${ringColor} animate-ping opacity-60 absolute"></div>
        <div class="w-6 h-6 rounded-full ${color} text-white border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-bold">
          📍
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14]
  });
};

interface MapViewerProps {
  region: Region;
  floodExtentSqkm?: number;
  riskStatus?: string;
}

export const MapViewer: React.FC<MapViewerProps> = ({ region, floodExtentSqkm, riskStatus }) => {
  const [layerType, setLayerType] = useState<'satellite' | 'hybrid' | 'topo' | 'street'>('street');
  const center: [number, number] = [region.latitude, region.longitude];

  // Derive bounding box if provided, or calculate ~15km radius
  const bbox: [[number, number], [number, number]] = region.bbox && region.bbox.length === 4
    ? [[region.bbox[0], region.bbox[1]], [region.bbox[2], region.bbox[3]]]
    : [[region.latitude - 0.08, region.longitude - 0.08], [region.latitude + 0.08, region.longitude + 0.08]];

  const tileUrls = {
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    hybrid: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    topo: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    street: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
  };

  const tileAttributions = {
    satellite: 'Tiles &copy; Esri &mdash; High-Resolution Earthstar Geographics',
    hybrid: 'Tiles &copy; Esri &mdash; World Imagery with Transportation & Places',
    topo: 'Tiles &copy; Esri &mdash; Topo Map, USGS, DeLorme, Intermap',
    street: 'Tiles &copy; Esri &mdash; Street Map, DeLorme, USGS, NPS'
  };

  return (
    <div className="w-full h-full min-h-[340px] rounded-xl overflow-hidden border border-slate-200 shadow-sm relative flex flex-col">
      {/* Top Layer Toggle Overlay */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur-md p-1 rounded-lg border border-slate-200 shadow-md flex items-center gap-1 text-[11px] font-medium">
        <button
          onClick={() => setLayerType('satellite')}
          className={`px-2 py-1 rounded-md transition-all ${
            layerType === 'satellite'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Satellite imagery"
        >
          🛰️ Satellite
        </button>
        <button
          onClick={() => setLayerType('hybrid')}
          className={`px-2 py-1 rounded-md transition-all ${
            layerType === 'hybrid'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Satellite with street names and roads"
        >
          🏷️ Hybrid
        </button>
        <button
          onClick={() => setLayerType('topo')}
          className={`px-2 py-1 rounded-md transition-all ${
            layerType === 'topo'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Topographic elevation contours and terrain relief"
        >
          🏔️ Topo
        </button>
        <button
          onClick={() => setLayerType('street')}
          className={`px-2 py-1 rounded-md transition-all ${
            layerType === 'street'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="High-contrast street view with roads and infrastructure"
        >
          🛣️ Street
        </button>
      </div>

      <MapContainer
        key={`${region.id}-${region.latitude}`}
        center={center}
        zoom={11}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          key={`mapviewer-base-${layerType}`}
          attribution={tileAttributions[layerType]}
          url={tileUrls[layerType]}
          maxZoom={19}
        />

        {layerType === 'hybrid' && (
          <>
            <TileLayer
              key="mapviewer-overlay-transportation"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              opacity={0.9}
            />
            <TileLayer
              key="mapviewer-overlay-boundaries"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              opacity={0.95}
            />
          </>
        )}

        <MapResizer />

        {/* Region Bounding Box Area */}
        <Rectangle
          bounds={bbox}
          pathOptions={{
            color: '#2563eb',
            weight: 2,
            fillColor: '#38bdf8',
            fillOpacity: 0.18,
            dashArray: '5, 5'
          }}
        />

        {/* Center Point Marker */}
        <Marker position={center} icon={createPinIcon(riskStatus)}>
          <Popup>
            <div className="text-xs p-1 font-sans space-y-1">
              <h4 className="font-bold text-slate-900">{region.name}</h4>
              <p className="text-slate-500 text-[11px]">{region.state}, {region.country}</p>
              <div className="mt-1 pt-1 border-t border-slate-200">
                <span className="font-semibold text-blue-700 block">Digital Twin Center Point</span>
                {floodExtentSqkm !== undefined && (
                  <p className="text-[10px] text-slate-700 font-medium">
                    Flooded extent: <span className="text-blue-700 font-bold">~{floodExtentSqkm.toFixed(1)} sq km</span>
                  </p>
                )}
                {riskStatus && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
                    Risk Classification: {riskStatus}
                  </p>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Floating Map Watermark Legend */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] text-white shadow-md z-[1000] pointer-events-none flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold text-slate-100">{region.name}</span>
        <span className="text-slate-400 font-mono text-[10px]">
          ({region.latitude.toFixed(3)}°N, {region.longitude.toFixed(3)}°E)
        </span>
      </div>
    </div>
  );
};

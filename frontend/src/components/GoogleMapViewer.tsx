import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin, Layers, Key, ShieldCheck, AlertCircle, Maximize2,
  Minimize2, Compass, Pencil, Trash2, CheckCircle2, Info
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GoogleMapViewerProps {
  center: { lat: number; lng: number };
  zoom?: number;
  localityName?: string;
  onLocationSelect?: (lat: number, lng: number, address?: string) => void;
  onPolygonDrawn?: (coordinates: number[][]) => void;
  inundationGeoJson?: any;
  hotspots?: Array<{
    name: string;
    type: string;
    coordinates: { lat: number; lng: number };
    water_depth_m: number;
    traffic_status: string;
    sump_pump_status: string;
  }>;
  riverGauges?: Array<{
    river_name: string;
    location: string;
    coordinates: { lat: number; lng: number };
    current_water_level_m: number;
    warning_level_m: number;
    flow_status: string;
  }>;
  reservoirs?: Array<{
    name: string;
    current_level_ft: number;
    full_tank_level_ft: number;
    storage_percentage: number;
    status: string;
  }>;
}

declare global {
  interface Window {
    google?: any;
    initGoogleMapsCallback?: () => void;
  }
}

export const GoogleMapViewer: React.FC<GoogleMapViewerProps> = ({
  center,
  zoom = 14,
  localityName = "T. Nagar",
  onLocationSelect,
  onPolygonDrawn,
  inundationGeoJson,
  hotspots = [],
  riverGauges = [],
  reservoirs = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const googleMapRef = useRef<any>(null);
  const googlePolygonRef = useRef<any>(null);
  const googleInundationLayersRef = useRef<any[]>([]);
  const leafletLayersRef = useRef<L.LayerGroup | null>(null);
  const leafletDrawnPolygonRef = useRef<L.Polygon | null>(null);

  // API Key management
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('GOOGLE_MAPS_API_KEY') || (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [tempKeyInput, setTempKeyInput] = useState<string>('');
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState<boolean>(false);
  const [googleMapsError, setGoogleMapsError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'hybrid' | 'satellite' | 'roadmap' | 'terrain'>('hybrid');

  // Drawing state
  const [isDrawingPolygon, setIsDrawingPolygon] = useState<boolean>(false);
  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>([]);
  const [activeCoords, setActiveCoords] = useState<{ lat: number; lng: number }>(center);

  // Sync coords state with center prop
  useEffect(() => {
    setActiveCoords(center);
  }, [center]);

  // Load Google Maps API Script when apiKey is available
  useEffect(() => {
    if (!apiKey || apiKey.trim() === '') {
      setIsGoogleMapsLoaded(false);
      return;
    }

    if (window.google?.maps) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-js-sdk';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey.trim()}&libraries=places,drawing,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsGoogleMapsLoaded(true);
        setGoogleMapsError(null);
      };
      script.onerror = () => {
        setGoogleMapsError('Failed to load Google Maps JavaScript API (Check API Key restrictions or network).');
        setIsGoogleMapsLoaded(false);
      };
      document.head.appendChild(script);
    } else {
      setIsGoogleMapsLoaded(true);
    }
  }, [apiKey]);

  // Save API Key
  const handleSaveApiKey = (key: string) => {
    const trimmed = key.trim();
    setApiKey(trimmed);
    localStorage.setItem('GOOGLE_MAPS_API_KEY', trimmed);
    setIsKeyModalOpen(false);
    window.location.reload();
  };

  // -------------------------------------------------------------
  // GOOGLE MAPS RENDERING ENGINE
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isGoogleMapsLoaded || !containerRef.current || !window.google?.maps) return;

    // Destroy leaflet instance if switching to Google Maps
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    // Initialize or re-center Google Map
    if (!googleMapRef.current) {
      const gMap = new window.google.maps.Map(containerRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: zoom,
        mapTypeId: mapType,
        tilt: 45,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'on' }] }
        ]
      });

      // Click to select location
      gMap.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setActiveCoords({ lat, lng });
        if (onLocationSelect) {
          onLocationSelect(lat, lng);
        }
      });

      googleMapRef.current = gMap;
    } else {
      googleMapRef.current.setCenter({ lat: center.lat, lng: center.lng });
      googleMapRef.current.setZoom(zoom);
    }
  }, [isGoogleMapsLoaded, center, zoom]);

  // Update Google Map Type
  useEffect(() => {
    if (googleMapRef.current && window.google?.maps) {
      googleMapRef.current.setMapTypeId(mapType);
    }
  }, [mapType]);

  // Overlay Inundation on Google Maps
  useEffect(() => {
    if (!googleMapRef.current || !window.google?.maps) return;

    // Clear previous layers
    googleInundationLayersRef.current.forEach((layer) => layer.setMap(null));
    googleInundationLayersRef.current = [];

    if (inundationGeoJson?.features) {
      inundationGeoJson.features.forEach((feature: any) => {
        if (feature.geometry?.type === 'Polygon') {
          const rawCoords = feature.geometry.coordinates[0];
          const path = rawCoords.map((coord: number[]) => ({
            lat: coord[1],
            lng: coord[0]
          }));

          const isHigh = feature.properties?.hazard_level === 'HIGH';
          const gPoly = new window.google.maps.Polygon({
            paths: path,
            strokeColor: isHigh ? '#e11d48' : '#0284c7',
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor: isHigh ? '#f43f5e' : '#38bdf8',
            fillOpacity: 0.45,
            map: googleMapRef.current
          });

          // Info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; font-family: sans-serif; font-size: 12px;">
                <b style="color: ${isHigh ? '#be123c' : '#0369a1'};">${feature.properties?.zone_name || 'Inundation Zone'}</b>
                <p style="margin: 4px 0 0 0; color: #475569;">Radar Backscatter: ${feature.properties?.radar_backscatter_db || -16} dB</p>
                <p style="margin: 2px 0 0 0; color: #475569;">Area: ${feature.properties?.area_hectares || 10} Hectares</p>
                <span style="display: inline-block; margin-top: 4px; padding: 2px 6px; background: ${isHigh ? '#ffe4e6' : '#e0f2fe'}; color: ${isHigh ? '#9f1239' : '#0369a1'}; border-radius: 4px; font-weight: bold; font-size: 10px;">
                  Sentinel-1 SAR C-Band
                </span>
              </div>
            `
          });

          gPoly.addListener('click', (e: any) => {
            infoWindow.setPosition(e.latLng);
            infoWindow.open(googleMapRef.current);
          });

          googleInundationLayersRef.current.push(gPoly);
        }
      });
    }
  }, [inundationGeoJson, isGoogleMapsLoaded]);

  // -------------------------------------------------------------
  // LEAFLET RESILIENT FALLBACK ENGINE (when Google Maps key isn't set)
  // -------------------------------------------------------------
  useEffect(() => {
    if (isGoogleMapsLoaded) return;
    if (!containerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(containerRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: true,
        attributionControl: false
      });

      // High-resolution Satellite Hybrid Base Layer
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
      }).addTo(map);

      // Cartographic labels & street overlay
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      leafletLayersRef.current = L.layerGroup().addTo(map);

      // Click to select
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setActiveCoords({ lat, lng });

        if (isDrawingPolygon) {
          setDrawnPoints((prev) => {
            const next = [...prev, [lat, lng] as [number, number]];
            return next;
          });
        } else if (onLocationSelect) {
          onLocationSelect(lat, lng);
        }
      });

      leafletMapRef.current = map;
    } else {
      leafletMapRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [isGoogleMapsLoaded, center, zoom, isDrawingPolygon]);

  // Update Leaflet overlays (Markers, Hotspots, Inundation)
  useEffect(() => {
    if (isGoogleMapsLoaded || !leafletMapRef.current || !leafletLayersRef.current) return;

    const group = leafletLayersRef.current;
    group.clearLayers();

    // 1. Center Target Marker
    const targetIcon = L.divIcon({
      className: 'custom-pin',
      html: `
        <div style="position: relative; width: 32px; height: 32px;">
          <div style="position: absolute; inset: 0; background: rgba(56, 189, 248, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; inset: 4px; background: #0284c7; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);">
            <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    L.marker([center.lat, center.lng], { icon: targetIcon })
      .bindPopup(`<b>Target Location: ${localityName}</b><br/>Lat: ${center.lat.toFixed(4)}, Lng: ${center.lng.toFixed(4)}`)
      .addTo(group);

    // 2. Hotspots Markers
    hotspots.forEach((h) => {
      const isWet = h.water_depth_m > 0.05;
      const hotIcon = L.divIcon({
        className: 'hotspot-pin',
        html: `
          <div style="background: ${isWet ? '#f59e0b' : '#10b981'}; color: white; border-radius: 8px; padding: 2px 6px; font-size: 10px; font-weight: bold; border: 1px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4); white-space: nowrap;">
            ${isWet ? '⚠️ ' : '✓ '}${h.name.split(' ')[0]}
          </div>
        `,
        iconSize: [60, 20],
        iconAnchor: [30, 10]
      });

      L.marker([h.coordinates.lat, h.coordinates.lng], { icon: hotIcon })
        .bindPopup(`
          <div style="font-size: 11px;">
            <b>${h.name}</b> (${h.type})<br/>
            Water Level: <b>${h.water_depth_m.toFixed(2)}m</b><br/>
            Pump Status: <b>${h.sump_pump_status}</b><br/>
            Traffic: <b>${h.traffic_status}</b>
          </div>
        `)
        .addTo(group);
    });

    // 3. River Gauges
    riverGauges.forEach((rg) => {
      const isWarn = rg.current_water_level_m >= rg.warning_level_m;
      const gaugeIcon = L.divIcon({
        className: 'gauge-pin',
        html: `
          <div style="background: ${isWarn ? '#e11d48' : '#0284c7'}; color: white; border-radius: 12px; padding: 2px 8px; font-size: 10px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
            🌊 ${rg.river_name.split(' ')[0]} (${rg.current_water_level_m}m)
          </div>
        `,
        iconSize: [80, 22],
        iconAnchor: [40, 11]
      });

      L.marker([rg.coordinates.lat, rg.coordinates.lng], { icon: gaugeIcon })
        .bindPopup(`
          <div style="font-size: 11px;">
            <b>${rg.river_name} - ${rg.location}</b><br/>
            Current Level: <b>${rg.current_water_level_m}m</b> (Warning: ${rg.warning_level_m}m)<br/>
            Status: <b style="color: ${isWarn ? 'red' : 'green'};">${rg.flow_status}</b>
          </div>
        `)
        .addTo(group);
    });

    // 4. Inundation GeoJSON
    if (inundationGeoJson?.features) {
      L.geoJSON(inundationGeoJson, {
        style: (feature) => {
          const isHigh = feature?.properties?.hazard_level === 'HIGH';
          return {
            color: isHigh ? '#e11d48' : '#0284c7',
            weight: 2,
            opacity: 0.9,
            fillColor: isHigh ? '#f43f5e' : '#38bdf8',
            fillOpacity: 0.45
          };
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(`
            <div style="font-size: 12px; font-family: sans-serif;">
              <b style="color: #0369a1;">${feature.properties?.zone_name}</b><br/>
              Depth: <b>${feature.properties?.depth_category}</b><br/>
              Radar Backscatter: <b>${feature.properties?.radar_backscatter_db} dB</b><br/>
              Estimated Inundated Area: <b>${feature.properties?.area_hectares} ha</b><br/>
              <span style="font-size: 10px; color: #64748b;">Source: Sentinel-1 C-SAR (Copernicus 2026)</span>
            </div>
          `);
        }
      }).addTo(group);
    }
  }, [isGoogleMapsLoaded, center, localityName, hotspots, riverGauges, inundationGeoJson]);

  // Update Drawn Polygon
  useEffect(() => {
    if (drawnPoints.length < 3) return;

    if (leafletMapRef.current && !isGoogleMapsLoaded) {
      if (leafletDrawnPolygonRef.current) {
        leafletDrawnPolygonRef.current.remove();
      }
      const poly = L.polygon(drawnPoints, {
        color: '#f59e0b',
        weight: 2,
        dashArray: '4, 4',
        fillColor: '#fbbf24',
        fillOpacity: 0.25
      }).addTo(leafletMapRef.current);
      leafletDrawnPolygonRef.current = poly;
    }

    if (onPolygonDrawn) {
      const geoCoords = drawnPoints.map(([lat, lng]) => [lng, lat]);
      // Close polygon
      geoCoords.push(geoCoords[0]);
      onPolygonDrawn(geoCoords);
    }
  }, [drawnPoints, isGoogleMapsLoaded]);

  const handleFinishPolygon = () => {
    setIsDrawingPolygon(false);
  };

  const handleClearPolygon = () => {
    setDrawnPoints([]);
    setIsDrawingPolygon(false);
    if (leafletDrawnPolygonRef.current) {
      leafletDrawnPolygonRef.current.remove();
      leafletDrawnPolygonRef.current = null;
    }
    if (googlePolygonRef.current) {
      googlePolygonRef.current.setMap(null);
      googlePolygonRef.current = null;
    }
    if (onPolygonDrawn) {
      onPolygonDrawn([]);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-slate-200/80 shadow-md bg-slate-950 flex flex-col">
      {/* Top Map Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Map Type & Provider Badges */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs shadow-lg text-white">
          <span className="flex items-center gap-1.5 font-bold text-cyan-400">
            <Compass className="w-3.5 h-3.5 animate-spin-slow" />
            <span>{isGoogleMapsLoaded ? 'Google Maps (Primary)' : 'Satellite Hybrid GIS'}</span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="font-mono text-[11px] text-slate-300">
            {localityName} ({activeCoords.lat.toFixed(4)}, {activeCoords.lng.toFixed(4)})
          </span>
        </div>

        {/* Right Controls: Polygon Draw + Map Settings */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Drawing Tool Toggle */}
          <div className="flex items-center bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/80 p-0.5 shadow-lg text-xs">
            <button
              onClick={() => setIsDrawingPolygon(!isDrawingPolygon)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                isDrawingPolygon
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{isDrawingPolygon ? 'Drawing Boundary...' : 'Draw Area Polygon'}</span>
            </button>

            {drawnPoints.length > 0 && (
              <>
                <button
                  onClick={handleFinishPolygon}
                  className="px-2.5 py-1.5 text-emerald-400 hover:bg-slate-800 rounded-lg font-bold"
                  title="Finish Boundary"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClearPolygon}
                  className="px-2.5 py-1.5 text-rose-400 hover:bg-slate-800 rounded-lg font-bold"
                  title="Clear Boundary"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Map Type Switcher */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/80 p-0.5 shadow-lg flex items-center text-xs">
            {(['hybrid', 'satellite', 'roadmap'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setMapType(t)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                  mapType === t
                    ? 'bg-cyan-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Google Maps API Key Modal Trigger */}
          <button
            onClick={() => {
              setTempKeyInput(apiKey);
              setIsKeyModalOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-lg backdrop-blur-md transition-all ${
              isGoogleMapsLoaded
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80'
                : 'bg-slate-900/90 border-cyan-500/50 text-cyan-300 hover:bg-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{isGoogleMapsLoaded ? 'Google Maps Connected' : 'Google Maps Key'}</span>
          </button>
        </div>
      </div>

      {/* Drawing Instructions Banner */}
      {isDrawingPolygon && (
        <div className="absolute top-14 left-1/2 transform -translate-x-1/2 z-10 bg-amber-500 text-slate-950 font-bold px-4 py-1.5 rounded-full text-xs shadow-xl flex items-center gap-2 animate-pulse pointer-events-none">
          <span>Click on the map to place polygon vertices around {localityName} ({drawnPoints.length} points placed).</span>
        </div>
      )}

      {/* Main Interactive Map Container */}
      <div ref={containerRef} className="w-full h-full flex-1 z-0" />

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-[11px] text-slate-300 shadow-xl flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sky-500/80 border border-sky-400"></span>
          <span>Sentinel-1 SAR Inundation Layer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span>Subway / Waterlogging Hotspot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span>River Gauge / Dam Spillway</span>
        </div>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400 font-mono text-[10px]">
          2026 Real-Time Inundation Intelligence
        </span>
      </div>

      {/* Google Maps API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Google Maps API Configuration</h3>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Google Maps is the primary interactive map for this application. You can provide your Google Maps JavaScript API key below. The key is stored locally in your browser.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Google Maps JavaScript API Key:
              </label>
              <input
                type="text"
                value={tempKeyInput}
                onChange={(e) => setTempKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Info className="w-3.5 h-3.5" />
                <span>Zero-Configuration Mode:</span>
              </div>
              <p>
                If you don't enter an API key, the platform automatically renders with the high-resolution <b>Satellite Hybrid GIS Engine (Esri World Imagery + OpenStreetMap)</b>, retaining full polygon drawing, coordinates inspection, and SAR inundation overlays.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveApiKey(tempKeyInput)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/30"
              >
                Save & Apply Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { Eye, Layers, ZoomIn, ZoomOut, Download, AlertTriangle, Activity } from 'lucide-react';
import { BACKEND_URL } from '../services/api';

interface ImageComparisonSliderProps {
  beforeUrl: string;
  afterUrl: string;
  diffUrl?: string;
  heatmapOverlayUrl?: string;
  beforeDate?: string;
  afterDate?: string;
  warnings?: string[];
  visualChangePercent?: number;
  changedAreaSqkm?: number;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  beforeUrl,
  afterUrl,
  diffUrl,
  heatmapOverlayUrl,
  beforeDate,
  afterDate,
  warnings = [],
  visualChangePercent,
  changedAreaSqkm
}) => {
  const [overlayMode, setOverlayMode] = useState<'side_by_side' | 'heatmap' | 'diff'>('side_by_side');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  const fullBefore = beforeUrl.startsWith('http') ? beforeUrl : `${BACKEND_URL}${beforeUrl}`;
  const fullAfter = afterUrl.startsWith('http') ? afterUrl : `${BACKEND_URL}${afterUrl}`;
  const fullDiff = diffUrl ? (diffUrl.startsWith('http') ? diffUrl : `${BACKEND_URL}${diffUrl}`) : null;
  const fullHeatmap = heatmapOverlayUrl ? (heatmapOverlayUrl.startsWith('http') ? heatmapOverlayUrl : `${BACKEND_URL}${heatmapOverlayUrl}`) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
      {/* Top Toolbar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <Eye className="w-4 h-4 text-blue-600" />
          <span>Interactive Comparison Viewer</span>
          {visualChangePercent !== undefined && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              Change: {visualChangePercent}%
            </span>
          )}
          {changedAreaSqkm !== undefined && (
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              Inundation: ~{changedAreaSqkm} sq km
            </span>
          )}
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg">
          <button
            onClick={() => setOverlayMode('side_by_side')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              overlayMode === 'side_by_side' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Side by Side
          </button>
          {fullHeatmap && (
            <button
              onClick={() => setOverlayMode('heatmap')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                overlayMode === 'heatmap' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Heatmap Overlay
            </button>
          )}
          {fullDiff && (
            <button
              onClick={() => setOverlayMode('diff')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                overlayMode === 'diff' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Difference Map
            </button>
          )}
        </div>

        {/* Zoom & Download Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded border border-slate-200">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.2))}
              className="text-slate-500 hover:text-slate-800 p-0.5"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-600 w-8 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
              className="text-slate-500 hover:text-slate-800 p-0.5"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {fullDiff && (
            <a
              href={fullDiff}
              download="difference_map.png"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded border border-slate-200 text-[11px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Canvas Viewer */}
      <div className="relative w-full h-[420px] bg-slate-950 overflow-hidden select-none flex items-center justify-center">
        {/* SIDE BY SIDE MODE */}
        {overlayMode === 'side_by_side' && (
          <div
            className="w-full h-full grid grid-cols-2 gap-3 p-3"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-inner flex items-center justify-center">
              <img src={fullBefore} alt="Pre-Disaster Baseline" className="w-full h-full object-contain" />
              <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-sm text-cyan-300 border border-slate-700 text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>BEFORE: {beforeDate || 'Pre-Disaster Baseline'}</span>
              </div>
            </div>
            <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-inner flex items-center justify-center">
              <img src={fullAfter} alt="Post-Disaster Event" className="w-full h-full object-contain" />
              <div className="absolute top-3 left-3 bg-rose-950/90 backdrop-blur-sm text-rose-300 border border-rose-800 text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>AFTER: {afterDate || 'Post-Disaster Inundation'}</span>
              </div>
            </div>
          </div>
        )}

        {/* HEATMAP OVERLAY MODE */}
        {overlayMode === 'heatmap' && fullHeatmap && (
          <div
            className="relative w-full h-full"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            <img src={fullHeatmap} alt="Heatmap Overlay" className="w-full h-full object-contain" />
            <div className="absolute top-3 left-3 bg-red-950/80 text-rose-200 text-[10px] font-semibold px-2.5 py-1 rounded-md shadow">
              Change Heatmap Overlay on Post-Disaster Satellite Raster
            </div>
          </div>
        )}

        {/* DIFFERENCE MAP MODE */}
        {overlayMode === 'diff' && fullDiff && (
          <div
            className="relative w-full h-full"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            <img src={fullDiff} alt="Difference Map" className="w-full h-full object-contain" />
            <div className="absolute top-3 left-3 bg-slate-900/80 text-amber-300 text-[10px] font-semibold px-2.5 py-1 rounded-md shadow">
              Absolute Spectral & Structural Intensity Gradient
            </div>
          </div>
        )}
      </div>

      {/* Mode-Specific 4-Line Analytical Diagnostic Notes & Observations */}
      {overlayMode === 'side_by_side' && (
        <div className="px-4 py-3 bg-amber-50/90 border-t border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed text-[11px]">
            <p>1. Pre-disaster baseline shows well-defined water boundaries, stable embankments, and contiguous green tree/vegetation canopies.</p>
            <p>2. Post-disaster observation reveals extensive surface overtopping, cross-section widening, and uncontrolled sheet inundation.</p>
            <p>3. Surface cover undergoes radiometric attenuation due to turbid floodwater submergence and sediment deposition.</p>
            <p>4. Built-up infrastructure, street corridors, and connecting access bridges exhibit waterlogging and localized transit severance.</p>
            {warnings.length > 0 && (
              <div className="pt-1 border-t border-amber-200/60 mt-1 text-[10px] text-amber-800 space-y-0.5">
                {warnings.map((w, idx) => (
                  <p key={idx}>• {w}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {overlayMode === 'heatmap' && (
        <div className="px-4 py-3 bg-rose-50/90 border-t border-rose-200 text-xs text-rose-950 flex items-start gap-2.5">
          <Activity className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed text-[11px]">
            <p className="font-bold text-rose-900">Change Heatmap Intensity & Inundation Severity Diagnostics:</p>
            <p>1. Red and vermilion hot-spots pinpoint maximum spectral deviation and intense land cover transformation (&gt;70% alteration).</p>
            <p>2. Yellow and amber gradations map moderate vegetation stress, standing water infiltration, and shallow field inundation.</p>
            <p>3. Blue and dark cool tones highlight invariant terrestrial baselines, stable elevated terrain, and unaffected built-up structures.</p>
            <p>4. Kernel density smoothing eliminates transient high-frequency sensor noise to isolate verified hydrological flood expansion envelopes.</p>
          </div>
        </div>
      )}

      {overlayMode === 'diff' && (
        <div className="px-4 py-3 bg-indigo-50/90 border-t border-indigo-200 text-xs text-indigo-950 flex items-start gap-2.5">
          <Layers className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed text-[11px]">
            <p className="font-bold text-indigo-900">Radiometric Difference Map &amp; Edge Gradient Diagnostics:</p>
            <p>1. Direct pixel-by-pixel radiometric subtraction (T2 − T1) isolates absolute structural and luminance gradient shifts across all spectral bands.</p>
            <p>2. Bright white and high-intensity pixels signify severe backscatter surge caused by new specular water boundaries and sediment deposition.</p>
            <p>3. Dark/black pixel regions represent invariant terrain where surface reflectance remained perfectly correlated between acquisition dates.</p>
            <p>4. Thresholded edge delineation highlights structural embankment ruptures, bridge overtopping paths, and active flood runout corridors.</p>
          </div>
        </div>
      )}
    </div>
  );
};

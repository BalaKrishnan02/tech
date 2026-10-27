import React from 'react';
import type { Region } from '../types';
import { RefreshCw, MapPin, Database, CheckCircle2, Bot, Volume2 } from 'lucide-react';

interface HeaderProps {
  regions: Region[];
  selectedRegionId: string;
  onSelectRegion: (id: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenVoiceChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  regions,
  selectedRegionId,
  onSelectRegion,
  onRefresh,
  isRefreshing,
  onOpenVoiceChat
}) => {
  const currentRegion = regions.find(r => r.id === selectedRegionId) || regions[0];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
      {/* Title & Region Selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-cyan-500/30 shadow-md shadow-cyan-500/10 bg-slate-950 flex items-center justify-center">
            <img src="/digital_twin_icon.png" alt="Digital Twin Emblem" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 leading-tight tracking-tight flex items-center gap-2">
              <span className="font-sans">DIGITAL TWIN</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                Land-Cover & Inundation
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Multi-Temporal Satellite & Hydrological Decision-Support Framework
            </p>
          </div>
        </div>

        {/* Region Dropdown */}
        <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors">
          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
          <select
            value={selectedRegionId}
            onChange={(e) => onSelectRegion(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-2"
          >
            {regions.map(r => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Freshness, Telemetry Status & Actions */}
      <div className="flex items-center gap-4 text-xs flex-wrap">
        {/* Source Telemetry Status */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-slate-600">
          <Database className="w-3.5 h-3.5 text-blue-500" />
          <span>Telemetry:</span>
          <span className="flex items-center gap-1 font-medium text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Sentinel-2 & GPM
          </span>
        </div>

        {/* Freshness Timestamps */}
        <div className="hidden sm:flex flex-col text-right text-[11px] text-slate-500">
          <div>Updated: <span className="font-medium text-slate-700">Live (T-0)</span></div>
          <div>Processing: <span className="font-medium text-slate-700">Synchronized</span></div>
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 transition-all disabled:opacity-50"
          title="Refresh database records"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh</span>
        </button>

        {/* Quick Voice Bot Button */}
        <button
          onClick={onOpenVoiceChat}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium shadow-sm shadow-blue-500/25 transition-all"
        >
          <Bot className="w-4 h-4" />
          <span className="font-semibold">AI Assistant</span>
          <Volume2 className="w-3.5 h-3.5 text-cyan-200" />
        </button>
      </div>
    </header>
  );
};

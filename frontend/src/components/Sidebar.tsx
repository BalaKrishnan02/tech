import React from 'react';
import {
  SplitSquareVertical,
  Layers,
  Droplets,
  CloudRain,
  Globe,
  Radio,
  TrendingUp,
  History,
  Bell
} from 'lucide-react';
import { EarthSatellite3D } from './EarthSatellite3D';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  alertCount?: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, alertCount }) => {
  const sections: NavSection[] = [
    {
      title: '2026 Real-Time Surveillance',
      items: [
        { id: 'flood_monitoring', label: 'Flood Intelligence (Live)', icon: Radio, badge: '2026' },
        { id: 'land_use', label: 'Land Use & Change (AI)', icon: Layers, badge: 'CA-Markov' },
      ]
    },
    {
      title: 'Nationwide & Historical',
      items: [
        { id: 'national_map', label: 'All-India Overview (36 UTs)', icon: Globe },
        { id: 'satellite_ingestion', label: 'Satellite Ingestion (S1/S2)', icon: Radio },
        { id: 'disaster_events', label: 'Disaster Registry & Evidence', icon: History },
        { id: 'multi_year', label: 'Multi-Year Trajectories', icon: TrendingUp },
      ]
    },
    {
      title: 'Secondary Analysis Labs',
      items: [
        { id: 'before_after', label: 'Before/After Analysis Lab', icon: SplitSquareVertical },
        { id: 'flood', label: 'Optical Water Indices', icon: Droplets },
        { id: 'rainfall', label: 'Rainfall & IMD Normals', icon: CloudRain },
        { id: 'alerts', label: 'Alerts', icon: Bell, badge: alertCount && alertCount > 0 ? alertCount : undefined },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen select-none shrink-0">
      {/* Brand & Logo (matching reference design) */}
      {/* Brand & Official Digital Twin Logo */}
      <div className="px-4 py-3.5 border-b border-slate-800/80 flex items-center gap-3 bg-slate-950/50">
        <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-cyan-500/40 shadow-lg shadow-cyan-500/20 bg-slate-950 flex items-center justify-center group">
          <img
            src="/digital_twin_icon.png"
            alt="Digital Twin Official Emblem"
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-extrabold text-white text-xs tracking-wider leading-tight uppercase font-sans">
            <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent">
              DIGITAL TWIN
            </span>
          </h1>
          <p className="text-[9.5px] font-bold text-cyan-400 tracking-wide uppercase truncate leading-tight mt-0.5">
            Land-Cover & Inundation
          </p>
          <p className="text-[8.5px] text-slate-400 font-medium tracking-wider uppercase truncate leading-none mt-0.5">
            Analytics Platform
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ─── 3D Orbiting Satellite Earth & Mission Tagline (matching model) ─── */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/70 flex flex-col items-center justify-center shrink-0">
        <EarthSatellite3D />
        <div className="text-center mt-0.5">
          <p className="text-[11px] font-medium text-sky-300 tracking-wide leading-tight">
            Smarter Monitoring
          </p>
          <p className="text-[11px] font-medium text-sky-300 tracking-wide leading-tight">
            for a Safer Tomorrow
          </p>
        </div>
      </div>
    </aside>
  );
};

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { HistoricalEvent, EventEvidenceAssembly } from '../types';
import {
  ShieldAlert, Calendar, MapPin, CheckCircle2,
  AlertTriangle, FileText, ExternalLink, ArrowRight,
  Droplets, Layers, Clock, Info, Sparkles
} from 'lucide-react';

export const DisasterEventsPage: React.FC = () => {
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('IN-FLD-2023-MICHAUNG');
  const [evidence, setEvidence] = useState<EventEvidenceAssembly | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
  const [isAssembling, setIsAssembling] = useState<boolean>(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadEvents();
  }, [eventTypeFilter]);

  useEffect(() => {
    if (selectedEventId) {
      assembleEvidence(selectedEventId);
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const evs = await api.getHistoricalEvents(eventTypeFilter);
      setEvents(evs);
      if (evs.length > 0 && !evs.find(e => e.event_id === selectedEventId)) {
        setSelectedEventId(evs[0].event_id);
      }
    } catch (err) {
      console.error('Failed to load disaster events:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const assembleEvidence = async (eventId: string) => {
    setIsAssembling(true);
    try {
      const data = await api.getEventEvidence(eventId);
      setEvidence(data);
    } catch (err) {
      console.error('Failed to assemble evidence:', err);
    } finally {
      setIsAssembling(false);
    }
  };

  const selectedEvent = events.find(e => e.event_id === selectedEventId) || events[0];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Module 4: Historical Flood & Disaster Event Registry</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Documented Indian Disaster Events & Multi-Source Evidence Assembly
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-assembles pre- and post-disaster satellite imagery, precipitation telemetry, and chronological observation timelines.
          </p>
        </div>

        {/* Disaster Type Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Disaster Filter:</label>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none"
          >
            <option value="all">All Disaster Types</option>
            <option value="flood">Floods & Inundations</option>
            <option value="landslide">Landslides & Debris Flows</option>
            <option value="cyclone">Cyclones & Storm Surges</option>
          </select>
        </div>
      </div>

      {/* Grid Layout: Events List on Left, Evidence Assembly on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Disaster Events Registry List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col h-[650px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Disaster Event Registry</h2>
              <p className="text-[11px] text-slate-500">Official verified historical records</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {events.length} Events
            </span>
          </div>

          <div className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1">
            {events.map((ev) => {
              const isSelected = ev.event_id === selectedEventId;
              return (
                <div
                  key={ev.event_id}
                  onClick={() => setSelectedEventId(ev.event_id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all text-xs ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-bold text-slate-900 leading-snug">{ev.event_name}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 shrink-0">
                      Official
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{ev.district ? `${ev.district}, ` : ''}{ev.state}</span>
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      {ev.start_date}
                    </span>
                    <span className="text-blue-600 font-medium">Agency: {ev.source_agency.split('/')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Auto-Assembled Evidence Dossier */}
        <div className="lg:col-span-2 space-y-6">
          {isAssembling ? (
            <div className="p-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
              Auto-assembling satellite scenes, rainfall telemetry, and timeline for {selectedEvent?.event_name}...
            </div>
          ) : evidence ? (
            <div className="space-y-6">
              {/* Event Overview Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-blue-600 text-white">
                        {evidence.event_type}
                      </span>
                      <h2 className="text-base font-bold text-slate-900">{evidence.event_name}</h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      State: <b>{evidence.state}</b> {evidence.district ? `• District: ${evidence.district}` : ''} • Duration: <b>{evidence.duration.start} to {evidence.duration.end} ({evidence.duration.days} days)</b>
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {evidence.verification_level}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Record: {selectedEvent?.source_record_identifier}</p>
                  </div>
                </div>

                {/* Evidence Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <p className="text-slate-500 text-[11px]">Peak Inundation</p>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                      {evidence.land_and_water_impact.peak_inundation_sqkm} sq km
                    </h3>
                    <p className="text-[10px] text-blue-600 font-medium">
                      +{evidence.land_and_water_impact.newly_submerged_area_sqkm} sq km newly submerged
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <p className="text-slate-500 text-[11px]">Water Surge</p>
                    <h3 className="text-lg font-bold text-blue-600 mt-0.5">
                      +{evidence.land_and_water_impact.water_expansion_percent}%
                    </h3>
                    <p className="text-[10px] text-slate-500">Surface water expansion</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <p className="text-slate-500 text-[11px]">Event Total Rainfall</p>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                      {evidence.meteorological_evidence.event_rainfall_total_mm} mm
                    </h3>
                    <p className="text-[10px] text-slate-500">NASA GPM Calibrated</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <p className="text-slate-500 text-[11px]">Peak 24h Rain</p>
                    <h3 className="text-lg font-bold text-amber-700 mt-0.5">
                      {evidence.meteorological_evidence.peak_24h_rainfall_mm} mm
                    </h3>
                    <p className="text-[10px] text-amber-600 font-medium">Extreme Downpour</p>
                  </div>
                </div>

                {/* Satellite Evidence Badges */}
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-semibold text-blue-900">
                      Assembled Satellite Evidence ({evidence.satellite_evidence.total_available_scenes} scenes):
                    </span>
                    <span className="text-slate-600">
                      {evidence.satellite_evidence.pre_event_observations.length} Pre-Disaster • {evidence.satellite_evidence.post_event_observations.length} Post-Disaster
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-800">
                    Sentinel-1 SAR C-Band + Sentinel-2
                  </span>
                </div>
              </div>

              {/* Chronological Observation Timeline */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Chronological Observation Timeline
                  </h3>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {evidence.chronological_timeline.map((item, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100"></div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.event_stage}</span>
                        <span className="text-[11px] font-mono text-slate-400">({item.timestamp})</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {item.observation_type}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                        {item.details}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Methodology & Limitations Statement */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Info className="w-4 h-4 text-slate-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Evidence Limitations & Scientific Disclaimers
                  </h3>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-600">
                  {evidence.methodology_and_limitations.map((lim, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5"></span>
                      <span>{lim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

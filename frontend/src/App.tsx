import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TamilVoiceChatbot } from './components/TamilVoiceChatbot';
import { DashboardPage } from './pages/DashboardPage';
import { BeforeAfterAnalysisPage } from './pages/BeforeAfterAnalysisPage';
import { LandUsePage } from './pages/LandUsePage';
import { FloodDetectionPage } from './pages/FloodDetectionPage';
import { RainfallClimatePage } from './pages/RainfallClimatePage';
import { NationalOverviewPage } from './pages/NationalOverviewPage';
import { HistoricalSatellitePage } from './pages/HistoricalSatellitePage';
import { DisasterEventsPage } from './pages/DisasterEventsPage';
import { MultiYearAnalysisPage } from './pages/MultiYearAnalysisPage';
import { api, BACKEND_URL, DEFAULT_REGIONS } from './services/api';
import type {
  Region, ComprehensiveAnalysis, RainfallDataResponse,
  DigitalTwinState, SystemAlert
} from './types';
import {
  Clock, ShieldAlert, Download, RefreshCw, CheckCircle2, AlertTriangle,
  Bot, Bell
} from 'lucide-react';
import './index.css';

function App() {
  // Global State: Seeded with DEFAULT_REGIONS so UI renders immediately and never gets locked on blank loading screen
  const [regions, setRegions] = useState<Region[]>(DEFAULT_REGIONS);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('chennai-basin');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);

  // Data State
  const [analysis, setAnalysis] = useState<ComprehensiveAnalysis | null>(null);
  const [rainfall, setRainfall] = useState<RainfallDataResponse | null>(null);
  const [digitalTwinState, setDigitalTwinState] = useState<DigitalTwinState | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [dtHistory, setDtHistory] = useState<DigitalTwinState[]>([]);

  // Report generation
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [reportResult, setReportResult] = useState<{url: string; filename: string} | null>(null);

  const selectedRegion = regions.find(r => r.id === selectedRegionId) || regions[0] || DEFAULT_REGIONS[0];

  // Fetch all data for the selected region
  const fetchAllData = useCallback(async () => {
    if (!selectedRegionId) return;
    setIsRefreshing(true);
    try {
      const [regionsRes, analysisRes, rainfallRes, stateRes, alertsRes, historyRes] = await Promise.allSettled([
        api.getRegions(),
        api.getLatestAnalysis(selectedRegionId),
        api.getRainfallData(selectedRegionId),
        api.getCurrentState(selectedRegionId),
        api.getAlerts(selectedRegionId),
        api.getHistory(selectedRegionId),
      ]);

      if (regionsRes.status === 'fulfilled' && Array.isArray(regionsRes.value) && regionsRes.value.length > 0) {
        setRegions(regionsRes.value);
        setIsBackendConnected(true);
      } else {
        setIsBackendConnected(false);
      }
      if (analysisRes.status === 'fulfilled') setAnalysis(analysisRes.value);
      if (rainfallRes.status === 'fulfilled') setRainfall(rainfallRes.value);
      if (stateRes.status === 'fulfilled') setDigitalTwinState(stateRes.value);
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value);
      if (historyRes.status === 'fulfilled') setDtHistory(historyRes.value);
    } catch (err) {
      console.error('Data fetch error:', err);
      setIsBackendConnected(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedRegionId]);

  // Initial load
  useEffect(() => {
    api.getRegions().then(r => {
      if (Array.isArray(r) && r.length > 0) {
        setRegions(r);
        setIsBackendConnected(true);
        if (!r.find(x => x.id === selectedRegionId)) {
          setSelectedRegionId(r[0].id);
        }
      }
    }).catch(err => {
      console.warn('Initial regions fetch failed, using fallback:', err);
      setIsBackendConnected(false);
    });
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [selectedRegionId, fetchAllData]);

  const handleRegionChange = (id: string) => {
    setSelectedRegionId(id);
    setAnalysis(null);
    setRainfall(null);
    setDigitalTwinState(null);
    setAlerts([]);
  };

  const handleAnalysisComplete = (newAnalysis: ComprehensiveAnalysis) => {
    setAnalysis(newAnalysis);
    fetchAllData();
  };

  const handleGenerateReport = async (type: 'PDF' | 'CSV' | 'JSON' = 'PDF') => {
    setIsGeneratingReport(true);
    setReportResult(null);
    try {
      const res = await api.generateReport(selectedRegionId, type);
      setReportResult({ url: `${BACKEND_URL}${res.download_url}`, filename: res.filename });
    } catch (err) {
      console.error('Report generation failed:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // ── Render Page Content ──
  const renderPageContent = () => {
    if (!selectedRegion) {
      return (
        <div className="flex flex-col items-center justify-center h-80 space-y-4 text-slate-600">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold">Connecting to National Digital Twin...</p>
          <button
            onClick={() => {
              setRegions(DEFAULT_REGIONS);
              setSelectedRegionId(DEFAULT_REGIONS[0].id);
              fetchAllData();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            Load Predefined Study Regions
          </button>
        </div>
      );
    }

    switch (currentTab) {
      case 'national_map':
        return (
          <NationalOverviewPage
            onSelectRegion={(regId) => {
              if (regions.some(r => r.id === regId)) {
                setSelectedRegionId(regId);
                setCurrentTab('dashboard');
              }
            }}
          />
        );

      case 'satellite_ingestion':
        return <HistoricalSatellitePage />;

      case 'disaster_events':
        return <DisasterEventsPage />;

      case 'multi_year':
        return (
          <MultiYearAnalysisPage
            regions={regions}
            selectedRegionId={selectedRegionId}
            onSelectRegion={handleRegionChange}
          />
        );

      case 'dashboard':
        return (
          <DashboardPage
            region={selectedRegion}
            analysis={analysis}
            rainfall={rainfall}
            digitalTwinState={digitalTwinState}
            alerts={alerts}
            onNavigateToTab={setCurrentTab}
            onOpenReportModal={() => handleGenerateReport('PDF')}
          />
        );
      case 'before_after':
        return (
          <BeforeAfterAnalysisPage
            region={selectedRegion}
            onAnalysisComplete={handleAnalysisComplete}
          />
        );
      case 'land_use':
        return <LandUsePage region={selectedRegion} analysis={analysis} />;
      case 'flood':
        return <FloodDetectionPage region={selectedRegion} analysis={analysis} />;
      case 'rainfall':
        return <RainfallClimatePage region={selectedRegion} rainfall={rainfall} />;

      case 'alerts':
        return (
          <div className="space-y-6 pb-12 font-sans">
            {/* Header Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
                  <Bell className="w-4 h-4 animate-bounce" />
                  <span>Real-Time Hazard & Hydrological Warning Feed</span>
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                  Automated Disaster & Early Warning Alerts
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live multi-sensor triggers evaluated from Sentinel-1 SAR water extent, GPM precipitation telemetry, and IMD thresholds for {selectedRegion?.name}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-200 flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  <span>{alerts.length} Active System Alert{alerts.length !== 1 ? 's' : ''}</span>
                </span>
              </div>
            </div>

            {/* Official Guidance Advisory */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <p className="font-bold text-amber-950">Statutory Advisory & Decision-Support Notice:</p>
                <p className="mt-0.5 text-amber-800">
                  This framework operates as an automated <b>scientific monitoring and rapid decision-support tool</b>. It does not replace statutory warning broadcasts. Emergency responders and district administrations must always cross-reference official National Disaster Management Authority (NDMA), State Disaster Management Authority (SDMA), and IMD meteorological advisories before issuing civic evacuation orders.
                </p>
              </div>
            </div>

            {/* Alert Cards Feed */}
            {alerts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">All Clear • No Critical Alerts Active</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Hydrological telemetry, radar surface backscatter, and soil saturation indices for {selectedRegion?.name} are currently within safe baseline limits.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((a) => {
                  const isCrit = a.severity === 'critical';
                  const isWarn = a.severity === 'warning';
                  return (
                    <div
                      key={a.id}
                      className={`p-5 rounded-2xl border shadow-sm transition-all text-xs space-y-3 ${
                        isCrit
                          ? 'bg-rose-50/70 border-rose-200 hover:border-rose-400'
                          : isWarn
                          ? 'bg-amber-50/70 border-amber-200 hover:border-amber-400'
                          : 'bg-blue-50/70 border-blue-200 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider ${
                              isCrit
                                ? 'bg-rose-600 text-white shadow-xs'
                                : isWarn
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-blue-600 text-white shadow-xs'
                            }`}
                          >
                            {a.severity}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">
                            {a.alert_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {new Date(a.created_at).toLocaleString()}
                        </span>
                      </div>

                      {/* Primary Warning Message */}
                      <div className="space-y-1.5">
                        <p className="font-semibold text-slate-900 text-xs leading-relaxed">
                          {a.message}
                        </p>
                      </div>

                      {/* Telemetry Source, Trigger & Confidence Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-white/80 rounded-xl border border-black/5 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Trigger Condition:</span>
                          <span className="font-semibold text-slate-800">{a.trigger_condition}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Data Telemetry Source:</span>
                          <span className="font-semibold text-slate-800">{a.data_source}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Detection Confidence:</span>
                          <span className="font-bold text-emerald-700">{(a.confidence * 100).toFixed(0)}% Verified</span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Sector: {selectedRegion?.name} • Node ID: #{a.id}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              await api.dismissAlert(a.id);
                              setAlerts((prev) => prev.filter((x) => x.id !== a.id));
                            } catch (e) {
                              console.warn('Failed to dismiss alert:', e);
                            }
                          }}
                          className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-semibold transition-all shadow-xs"
                        >
                          Acknowledge & Dismiss
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      default:
        return <DashboardPage region={selectedRegion} analysis={analysis} rainfall={rainfall} digitalTwinState={digitalTwinState} alerts={alerts} onNavigateToTab={setCurrentTab} onOpenReportModal={() => handleGenerateReport('PDF')} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
      {/* Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        alertCount={alerts.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <Header
          regions={regions}
          selectedRegionId={selectedRegionId}
          onSelectRegion={handleRegionChange}
          onRefresh={fetchAllData}
          isRefreshing={isRefreshing}
          onOpenVoiceChat={() => setIsChatOpen(true)}
        />

        {/* Offline / Reconnecting Banner */}
        {!isBackendConnected && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-900 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <b>Engine Reconnecting:</b> Running in offline-resilient mode with local study regions. Telemetry updates will sync automatically once connected.
              </span>
            </div>
            <button
              onClick={() => fetchAllData()}
              className="px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-950 rounded font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              Retry Connection
            </button>
          </div>
        )}

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto px-6 py-5">
          {renderPageContent()}
        </main>
      </div>

      {/* Floating Tamil Voice Chatbot Panel */}
      <TamilVoiceChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        selectedRegionId={selectedRegionId}
        selectedRegionName={selectedRegion?.name}
      />

      {/* Floating Chat Button (when panel is closed) */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-xl shadow-blue-600/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
          title="Open AI Digital Twin Assistant"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

export default App;

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TamilVoiceChatbot } from './components/TamilVoiceChatbot';
import { BeforeAfterAnalysisPage } from './pages/BeforeAfterAnalysisPage';
import { LandUsePage } from './pages/LandUsePage';
import { FloodDetectionPage } from './pages/FloodDetectionPage';
import { RainfallClimatePage } from './pages/RainfallClimatePage';
import { NationalOverviewPage } from './pages/NationalOverviewPage';
import { HistoricalSatellitePage } from './pages/HistoricalSatellitePage';
import { DisasterEventsPage } from './pages/DisasterEventsPage';
import { MultiYearAnalysisPage } from './pages/MultiYearAnalysisPage';
import { RealTimeFloodIntelligencePage } from './pages/RealTimeFloodIntelligencePage';
import { api, BACKEND_URL, DEFAULT_REGIONS } from './services/api';
import type {
  Region, ComprehensiveAnalysis, RainfallDataResponse,
  DigitalTwinState, SystemAlert
} from './types';
import {
  Clock, ShieldAlert, Download, RefreshCw, CheckCircle2, AlertTriangle,
  Bot
} from 'lucide-react';
import './index.css';

function App() {
  // Global State: Seeded with DEFAULT_REGIONS so UI renders immediately and never gets locked on blank loading screen
  const [regions, setRegions] = useState<Region[]>(DEFAULT_REGIONS);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('chennai-basin');
  const [currentTab, setCurrentTab] = useState<string>('flood_monitoring');
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
                setCurrentTab('flood_monitoring');
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

      case 'flood_monitoring':
        return <RealTimeFloodIntelligencePage />;
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

      default:
        return <RealTimeFloodIntelligencePage />;
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

import type {
  Region, UploadedImageInfo, PairValidationResult,
  ComprehensiveAnalysis, RainfallDataResponse,
  DigitalTwinState, SystemAlert, ChatMessage,
  StateInfo, DistrictInfo, NationalOverview,
  SatelliteProduct, HistoricalEvent, EventEvidenceAssembly,
  MultiYearTrend, UserProfile, ProjectWorkspace,
  AnalysisHistoryItem
} from '../types';

const API_BASE = 'http://localhost:8000/api/v1';
export const BACKEND_URL = 'http://localhost:8000';

let authToken: string | null = localStorage.getItem('disaster_twin_auth_token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('disaster_twin_auth_token', token);
  } else {
    localStorage.removeItem('disaster_twin_auth_token');
  }
};

export const getAuthToken = () => authToken;

const getHeaders = (extra: Record<string, string> = {}) => {
  const headers: Record<string, string> = { ...extra };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

export const DEFAULT_REGIONS: Region[] = [
  {
    id: 'chennai-basin',
    slug: 'chennai-basin',
    name: 'Chennai Coastal Basin (Adyar & Cooum Rivers)',
    state: 'Tamil Nadu',
    country: 'India',
    description: 'Metropolitan coastal estuary and riverine flood corridor covering Adyar and Cooum basins with dense urban infrastructure.',
    latitude: 13.0827,
    longitude: 80.2707,
    is_active: true
  },
  {
    id: 'cuddalore-delta',
    slug: 'cuddalore-delta',
    name: 'Cuddalore Delta & Gadilam River Basin',
    state: 'Tamil Nadu',
    country: 'India',
    description: 'Low-lying coastal delta prone to cyclonic storm surges and riverine overtopping.',
    latitude: 11.7480,
    longitude: 79.7714,
    is_active: true
  },
  {
    id: 'madurai-vaigai',
    slug: 'madurai-vaigai',
    name: 'Madurai Vaigai River Basin',
    state: 'Tamil Nadu',
    country: 'India',
    description: 'Inland river basin monitoring Vaigai river course and semi-arid catchment runoff.',
    latitude: 9.9252,
    longitude: 78.1198,
    is_active: true
  },
  {
    id: 'wayanad-landslide',
    slug: 'wayanad-landslide',
    name: 'Wayanad High-Range Catchment',
    state: 'Kerala',
    country: 'India',
    description: 'Western Ghats high-precipitation zone vulnerable to flash flooding, soil saturation, and slope failures.',
    latitude: 11.6854,
    longitude: 76.1320,
    is_active: true
  },
  {
    id: 'assam-brahmaputra',
    slug: 'assam-brahmaputra',
    name: 'Assam Brahmaputra Riverine Basin',
    state: 'Assam',
    country: 'India',
    description: 'Major alluvial floodplain subject to annual monsoon braiding, severe riverbank erosion, and extensive wetland inundation.',
    latitude: 26.2006,
    longitude: 92.9376,
    is_active: true
  },
  {
    id: 'chamoli-glacier',
    slug: 'chamoli-glacier',
    name: 'Chamoli Alaknanda Basin (Joshimath)',
    state: 'Uttarakhand',
    country: 'India',
    description: 'High-altitude Himalayan catchment susceptible to glacial lake outburst floods (GLOF), flash debris flows, and terrain instability.',
    latitude: 30.5574,
    longitude: 79.5670,
    is_active: true
  }
];

export const api = {
  // -------------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------------
  async register(data: { email: string; username: string; password: string; full_name: string; organization?: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Registration failed');
    }
    const json = await res.json();
    if (json.access_token) setAuthToken(json.access_token);
    return json;
  },

  async login(username_or_email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username_or_email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    const json = await res.json();
    if (json.access_token) setAuthToken(json.access_token);
    return json;
  },

  async getMe(): Promise<UserProfile | null> {
    if (!authToken) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders(),
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  logout() {
    setAuthToken(null);
  },

  // -------------------------------------------------------------
  // MODULE 1 & 6: GEOGRAPHY & BOUNDARIES
  // -------------------------------------------------------------
  async getStates(): Promise<StateInfo[]> {
    const res = await fetch(`${API_BASE}/geography/states`);
    if (!res.ok) throw new Error('Failed to fetch states');
    return res.json();
  },

  async getDistricts(stateCode: string): Promise<DistrictInfo[]> {
    const res = await fetch(`${API_BASE}/geography/districts?state_code=${stateCode}`);
    if (!res.ok) throw new Error('Failed to fetch districts');
    return res.json();
  },

  async searchAdministrative(query: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/geography/search?query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to search administrative units');
    return res.json();
  },

  async getNationalOverview(): Promise<NationalOverview> {
    const res = await fetch(`${API_BASE}/geography/national-overview`);
    if (!res.ok) throw new Error('Failed to fetch national overview');
    return res.json();
  },

  async getStateDashboard(stateCode: string): Promise<any> {
    const res = await fetch(`${API_BASE}/geography/state-dashboard/${stateCode}`);
    if (!res.ok) throw new Error('Failed to fetch state dashboard');
    return res.json();
  },

  async getDistrictDashboard(districtCode: string): Promise<any> {
    const res = await fetch(`${API_BASE}/geography/district-dashboard/${districtCode}`);
    if (!res.ok) throw new Error('Failed to fetch district dashboard');
    return res.json();
  },

  // -------------------------------------------------------------
  // MODULE 2: SATELLITE DATA INGESTION
  // -------------------------------------------------------------
  async searchSatellite(params: {
    state?: string;
    district?: string;
    mission?: string;
    start_date?: string;
    end_date?: string;
    max_cloud_cover?: number;
    page?: number;
    page_size?: number;
  }): Promise<{ total_count: number; available_observation_dates: string[]; products: SatelliteProduct[]; live_provider_status: any }> {
    const q = new URLSearchParams();
    if (params.state) q.append('state', params.state);
    if (params.district) q.append('district', params.district);
    if (params.mission) q.append('mission', params.mission);
    if (params.start_date) q.append('start_date', params.start_date);
    if (params.end_date) q.append('end_date', params.end_date);
    if (params.max_cloud_cover !== undefined) q.append('max_cloud_cover', params.max_cloud_cover.toString());
    if (params.page) q.append('page', params.page.toString());
    if (params.page_size) q.append('page_size', params.page_size.toString());

    const res = await fetch(`${API_BASE}/satellite/search?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to search satellite catalog');
    return res.json();
  },

  async getSatelliteCalendar(regionOrDistrict = 'all'): Promise<Array<{ month: string; 'Sentinel-1': number; 'Sentinel-2': number; total: number }>> {
    const res = await fetch(`${API_BASE}/satellite/calendar?region_or_district=${encodeURIComponent(regionOrDistrict)}`);
    if (!res.ok) throw new Error('Failed to fetch observation calendar');
    return res.json();
  },

  async triggerSatelliteIngest(data: { state?: string; district?: string; mission?: string; start_date?: string; end_date?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/satellite/ingest-job`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to queue satellite ingestion');
    return res.json();
  },

  // -------------------------------------------------------------
  // MODULE 4: HISTORICAL DISASTER EVENTS
  // -------------------------------------------------------------
  async getHistoricalEvents(eventType = 'all', state?: string): Promise<HistoricalEvent[]> {
    let url = `${API_BASE}/events/?event_type=${eventType}`;
    if (state) url += `&state=${encodeURIComponent(state)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch disaster events');
    return res.json();
  },

  async getEventEvidence(eventId: string): Promise<EventEvidenceAssembly> {
    const res = await fetch(`${API_BASE}/events/${eventId}/assemble`);
    if (!res.ok) throw new Error('Failed to assemble event evidence');
    return res.json();
  },

  // -------------------------------------------------------------
  // MODULE 5: MULTI-YEAR COMPARISON
  // -------------------------------------------------------------
  async compareDates(date1: string, date2: string, regionId = 'chennai-basin'): Promise<any> {
    const res = await fetch(`${API_BASE}/multi-year/compare-dates?date_1=${date1}&date_2=${date2}&region_id=${regionId}`);
    if (!res.ok) throw new Error('Date comparison failed');
    return res.json();
  },

  async getMultiYearTrends(regionId = 'chennai-basin', years = [2019, 2021, 2023, 2025]): Promise<MultiYearTrend> {
    const q = years.map(y => `years=${y}`).join('&');
    const res = await fetch(`${API_BASE}/multi-year/trends?region_id=${regionId}&${q}`);
    if (!res.ok) throw new Error('Multi-year analysis failed');
    return res.json();
  },

  async compareRegions(region1: string, region2: string, year = 2023): Promise<any> {
    const res = await fetch(`${API_BASE}/multi-year/compare-regions?region_1=${region1}&region_2=${region2}&year=${year}`);
    if (!res.ok) throw new Error('Regional comparison failed');
    return res.json();
  },

  // -------------------------------------------------------------
  // MODULE 7: USER PORTAL & WORKSPACES
  // -------------------------------------------------------------
  async getUserDashboard(): Promise<any> {
    const res = await fetch(`${API_BASE}/portal/dashboard`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load user portal dashboard');
    return res.json();
  },

  async getProjects(): Promise<ProjectWorkspace[]> {
    const res = await fetch(`${API_BASE}/portal/projects`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async createProject(data: { name: string; description?: string; state?: string; district?: string }): Promise<ProjectWorkspace> {
    const res = await fetch(`${API_BASE}/portal/projects`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async updateProject(id: string, data: { name?: string; description?: string; is_archived?: boolean }): Promise<any> {
    const res = await fetch(`${API_BASE}/portal/projects/${id}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  },

  async deleteProject(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/portal/projects/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete project');
    return res.json();
  },

  async getAnalysisHistory(filters?: { state?: string; district?: string; analysis_type?: string; search?: string }): Promise<AnalysisHistoryItem[]> {
    const q = new URLSearchParams();
    if (filters?.state) q.append('state', filters.state);
    if (filters?.district) q.append('district', filters.district);
    if (filters?.analysis_type) q.append('analysis_type', filters.analysis_type);
    if (filters?.search) q.append('search', filters.search);

    const res = await fetch(`${API_BASE}/portal/history?${q.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch analysis history');
    return res.json();
  },

  async reopenAnalysis(runId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/portal/history/${runId}/reopen`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to reopen analysis run');
    return res.json();
  },

  async exportPortalData(): Promise<any> {
    const res = await fetch(`${API_BASE}/portal/export`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to export portal data');
    return res.json();
  },

  // -------------------------------------------------------------
  // EXISTING CORE METHODS (PRESERVED & HARDENED)
  // -------------------------------------------------------------
  async getRegions(): Promise<Region[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${API_BASE}/regions/`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('Failed to fetch regions from backend');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
      return DEFAULT_REGIONS;
    } catch (err) {
      console.warn('Backend unavailable, using default predefined study regions:', err);
      return DEFAULT_REGIONS;
    }
  },

  async getImagesByRegion(regionId: string): Promise<UploadedImageInfo[]> {
    const res = await fetch(`${API_BASE}/images/by-region/${regionId}`);
    if (!res.ok) throw new Error('Failed to fetch images');
    return res.json();
  },

  async uploadImage(formData: FormData): Promise<UploadedImageInfo> {
    const res = await fetch(`${API_BASE}/images/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to upload image');
    }
    return res.json();
  },

  async validateImagePair(beforeId: string, afterId: string): Promise<PairValidationResult> {
    const res = await fetch(`${API_BASE}/images/validate-pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ before_image_id: beforeId, after_image_id: afterId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Pair validation failed');
    }
    return res.json();
  },

  async getLatestAnalysis(regionId: string): Promise<ComprehensiveAnalysis> {
    const res = await fetch(`${API_BASE}/analysis/latest/${regionId}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'No analysis available');
    }
    return res.json();
  },

  async runAnalysis(regionId: string, beforeId: string, afterId: string, projectId?: string): Promise<{ run_id: string; message: string }> {
    const res = await fetch(`${API_BASE}/analysis/run`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        region_id: regionId,
        before_image_id: beforeId,
        after_image_id: afterId,
        analysis_type: 'comprehensive',
        project_id: projectId
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Analysis run failed');
    }
    return res.json();
  },

  async getRainfallData(regionId: string, year?: number): Promise<RainfallDataResponse> {
    const url = year ? `${API_BASE}/rainfall/${regionId}?year=${year}` : `${API_BASE}/rainfall/${regionId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch rainfall records');
    return res.json();
  },

  async getCurrentState(regionId: string): Promise<DigitalTwinState> {
    const res = await fetch(`${API_BASE}/digital-twin/current/${regionId}`);
    if (!res.ok) throw new Error('Failed to fetch current digital twin state');
    return res.json();
  },

  async getHistory(regionId: string): Promise<DigitalTwinState[]> {
    const res = await fetch(`${API_BASE}/digital-twin/history/${regionId}`);
    if (!res.ok) throw new Error('Failed to fetch history states');
    return res.json();
  },

  async compareStates(state1Id: string, state2Id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/digital-twin/compare?state1_id=${state1Id}&state2_id=${state2Id}`);
    if (!res.ok) throw new Error('Comparison failed');
    return res.json();
  },

  async getAlerts(regionId: string): Promise<SystemAlert[]> {
    const res = await fetch(`${API_BASE}/alerts/${regionId}`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async dismissAlert(alertId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/dismiss`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to dismiss alert');
  },

  async sendChatMessage(message: string, regionId?: string, sessionId?: string, language: string = 'en'): Promise<ChatMessage> {
    const res = await fetch(`${API_BASE}/chatbot/message`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        message,
        region_id: regionId,
        session_id: sessionId,
        language
      }),
    });
    if (!res.ok) throw new Error('Failed to get chat response');
    return res.json();
  },

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const res = await fetch(`${API_BASE}/chatbot/history/${sessionId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to get chat history');
    return res.json();
  },

  async clearChat(sessionId: string): Promise<void> {
    await fetch(`${API_BASE}/chatbot/clear/${sessionId}`, { method: 'DELETE', headers: getHeaders() });
  },

  async generateReport(regionId: string, reportType: 'PDF' | 'CSV' | 'JSON' | 'GEOJSON'): Promise<{ download_url: string; filename: string }> {
    const res = await fetch(`${API_BASE}/reports/generate`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        region_id: regionId,
        report_type: reportType
      }),
    });
    if (!res.ok) throw new Error('Report generation failed');
    return res.json();
  },

  // 2026 Real-Time Flood Intelligence & Damage Assessment APIs
  async getPresetLocalities(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/flood-intelligence/localities`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch localities');
    return res.json();
  },

  async getCurrentFloodIntelligence(locality: string = 't_nagar', lat: number = 13.0418, lng: number = 80.2341): Promise<any> {
    const res = await fetch(`${API_BASE}/flood-intelligence/current?locality=${encodeURIComponent(locality)}&lat=${lat}&lng=${lng}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch current flood intelligence');
    return res.json();
  },

  async detectSatelliteFlood(payload: { lat: number; lng: number; radius_km?: number; locality_name?: string; custom_polygon?: any }): Promise<any> {
    const res = await fetch(`${API_BASE}/flood-intelligence/satellite-detect`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Satellite flood detection failed');
    return res.json();
  },

  async assessFloodDamage(payload: { locality: string; inundated_hectares: number; inundation_percentage: number; hazard_level: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/flood-intelligence/damage-assessment`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Damage assessment failed');
    return res.json();
  },

  async get2026Events(params?: { state?: string; district?: string; event_type?: string; severity?: string; query?: string }): Promise<any> {
    const queryParts = [];
    if (params?.state) queryParts.push(`state=${encodeURIComponent(params.state)}`);
    if (params?.district) queryParts.push(`district=${encodeURIComponent(params.district)}`);
    if (params?.event_type) queryParts.push(`event_type=${encodeURIComponent(params.event_type)}`);
    if (params?.severity) queryParts.push(`severity=${encodeURIComponent(params.severity)}`);
    if (params?.query) queryParts.push(`query=${encodeURIComponent(params.query)}`);
    const qs = queryParts.length ? `?${queryParts.join('&')}` : '';
    const res = await fetch(`${API_BASE}/flood-intelligence/events-2026${qs}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch 2026 events');
    return res.json();
  },

  async getHistoricalBenchmarks(): Promise<any> {
    const res = await fetch(`${API_BASE}/flood-intelligence/historical-benchmarks`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch historical benchmarks');
    return res.json();
  },

  async getFloodSources(): Promise<any> {
    const res = await fetch(`${API_BASE}/flood-intelligence/sources`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch flood sources');
    return res.json();
  }
};

import React, { useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken } from '../services/api';
import type { UserProfile, ProjectWorkspace, AnalysisHistoryItem } from '../types';
import {
  FolderPlus,
  Trash2,
  Archive,
  Download,
  FolderOpen,
  Search,
  RefreshCw,
  LogOut,
  LogIn,
  User,
  Shield,
  Layers,
  Clock,
  Calendar,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter
} from 'lucide-react';

interface UserPortalPageProps {
  onReopenAnalysis?: (runId: string) => void;
}

export const UserPortalPage: React.FC<UserPortalPageProps> = ({ onReopenAnalysis }) => {
  // Auth state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());

  // Login form state (pre-filled with demo analyst credentials)
  const [loginUsername, setLoginUsername] = useState<string>('demo_analyst');
  const [loginPassword, setLoginPassword] = useState<string>('AnalystPass2026!');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState<boolean>(false);

  // Portal data
  const [dashboard, setDashboard] = useState<any>(null);
  const [projects, setProjects] = useState<ProjectWorkspace[]>([]);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Filters for analysis history
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedRunDetail, setSelectedRunDetail] = useState<any | null>(null);

  // New project modal / inputs
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectDesc, setNewProjectDesc] = useState<string>('');
  const [newProjectState, setNewProjectState] = useState<string>('Tamil Nadu');
  const [creatingProject, setCreatingProject] = useState<boolean>(false);
  const [exportingData, setExportingData] = useState<boolean>(false);

  // Check current auth status on mount
  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const u = await api.getMe();
      if (u) {
        setUser(u);
        loadPortalData();
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setAuthError(null);
    try {
      const res = await api.login(loginUsername, loginPassword);
      if (res.user) {
        setUser(res.user);
        setToken(res.access_token);
        loadPortalData();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setToken(null);
    setUser(null);
    setDashboard(null);
    setProjects([]);
    setHistory([]);
  };

  const loadPortalData = async () => {
    setLoadingData(true);
    try {
      const [dash, proj, hist] = await Promise.allSettled([
        api.getUserDashboard(),
        api.getProjects(),
        api.getAnalysisHistory(),
      ]);

      if (dash.status === 'fulfilled') setDashboard(dash.value);
      if (proj.status === 'fulfilled') setProjects(proj.value);
      if (hist.status === 'fulfilled') setHistory(hist.value);
    } catch (err) {
      console.error('Failed to load portal data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreatingProject(true);
    try {
      await api.createProject({
        name: newProjectName.trim(),
        description: newProjectDesc.trim(),
        state: newProjectState
      });
      setNewProjectName('');
      setNewProjectDesc('');
      loadPortalData();
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Delete project "${name}"? Past analysis runs will be retained in history.`)) return;
    try {
      await api.deleteProject(id);
      loadPortalData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  const handleArchiveProject = async (id: string, currentlyArchived: boolean) => {
    try {
      await api.updateProject(id, { is_archived: !currentlyArchived });
      loadPortalData();
    } catch (err: any) {
      alert(err.message || 'Failed to update project');
    }
  };

  const handleExportData = async () => {
    setExportingData(true);
    try {
      const data = await api.exportPortalData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user_portal_export_${user?.username || 'user'}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export portal data');
    } finally {
      setExportingData(false);
    }
  };

  const handleReopen = async (runId: string) => {
    try {
      const detail = await api.reopenAnalysis(runId);
      setSelectedRunDetail(detail);
      if (onReopenAnalysis) {
        onReopenAnalysis(runId);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load analysis snapshot');
    }
  };

  // Filter history
  const filteredHistory = history.filter(item => {
    const matchesSearch =
      !searchQuery ||
      item.region_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === 'all' || item.analysis_type.toLowerCase().includes(filterType.toLowerCase());
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-400/30">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Secure Multi-User Workspace & Audit History</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Analyst Portal & Research Workspaces</h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Manage study projects, inspect past multi-temporal analysis runs, review change overlays, and export your personal research repository.
            </p>
          </div>

          {/* User Status / Logout */}
          {user && (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                {user.full_name?.charAt(0) || user.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight">{user.full_name || user.username}</div>
                <div className="text-[10px] text-slate-300">{user.organization || 'Disaster Risk Analyst'}</div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/80 text-white transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── NOT LOGGED IN: LOGIN / SWITCH USER VIEW ─── */}
      {!user ? (
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-5">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Sign in to User Portal</h2>
            <p className="text-xs text-slate-500">
              Access your saved project workspaces and historical flood analysis runs.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username or Email
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {loggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>{loggingIn ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          {/* Quick Demo Credentials Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
            <span className="font-bold text-slate-700 block">Pre-Seeded Demo Accounts:</span>
            <div className="flex justify-between">
              <span>Analyst: <code>demo_analyst</code></span>
              <span>Pass: <code>AnalystPass2026!</code></span>
            </div>
            <div className="flex justify-between">
              <span>Admin: <code>admin@disastertwin.gov.in</code></span>
              <span>Pass: <code>AdminPass2026!</code></span>
            </div>
          </div>
        </div>
      ) : (
        /* ─── LOGGED IN USER PORTAL CONTENT ─── */
        <div className="space-y-6">
          {/* Dashboard Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Active Projects</span>
                <FolderOpen className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-800">
                {projects.filter(p => !p.is_archived).length}
              </div>
              <span className="text-[11px] text-slate-400">
                {projects.filter(p => p.is_archived).length} archived
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Completed Analyses</span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {history.length}
              </div>
              <span className="text-[11px] text-slate-400">Stored in private history</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Primary Region</span>
                <Shield className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-base font-bold text-slate-800 truncate">
                Tamil Nadu
              </div>
              <span className="text-[11px] text-slate-400">Chennai, Cuddalore, Delta</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Data Export</span>
                <Download className="w-4 h-4 text-cyan-600" />
              </div>
              <button
                onClick={handleExportData}
                disabled={exportingData}
                className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1.5 rounded-lg text-xs flex items-center justify-center gap-2 border border-slate-200 transition-all"
              >
                {exportingData ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Export My Data (JSON)</span>
              </button>
            </div>
          </div>

          {/* Section: Project Workspaces */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">My Project Workspaces</h3>
                <p className="text-xs text-slate-500">
                  Organize disaster simulations, satellite observation packs, and impact assessments into private folders.
                </p>
              </div>
            </div>

            {/* Create Project Form */}
            <form onSubmit={handleCreateProject} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="New project name (e.g., Chennai Basin Flood 2023)"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                required
                className="flex-1 min-w-[200px] bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Description / study objective"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                className="flex-1 min-w-[180px] bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={creatingProject}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 shrink-0"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Create Workspace</span>
              </button>
            </form>

            {/* Projects List */}
            {projects.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No custom project workspaces created yet. Create one above to organize your runs.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className={`p-4 rounded-xl border transition-all ${
                      proj.is_archived
                        ? 'bg-slate-50/70 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FolderOpen className={`w-4 h-4 ${proj.is_archived ? 'text-slate-400' : 'text-blue-600'}`} />
                        <h4 className="font-bold text-xs text-slate-800 truncate">{proj.name}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleArchiveProject(proj.id, proj.is_archived)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title={proj.is_archived ? 'Unarchive' : 'Archive'}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(proj.id, proj.name)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {proj.description && (
                      <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">{proj.description}</p>
                    )}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{proj.state || 'All-India'}</span>
                      <span>Created {new Date(proj.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Analysis History & Reopen */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">My Analysis Run History</h3>
                <p className="text-xs text-slate-500">
                  Search past flood detections and land-use analyses. Click Reopen to inspect the exact difference overlay.
                </p>
              </div>

              {/* Search & Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by region or district..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-60"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="flood">Flood Inundation</option>
                  <option value="land">Land Cover</option>
                  <option value="comprehensive">Comprehensive Twin</option>
                </select>
              </div>
            </div>

            {/* Run List Table */}
            {filteredHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No past analysis runs match your filters. Run an analysis from the Before/After tab to log history.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-semibold">
                      <th className="pb-2">Region / Location</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Observation Dates</th>
                      <th className="pb-2 text-right">Flood Extent</th>
                      <th className="pb-2 text-right">Confidence</th>
                      <th className="pb-2 text-right">Timestamp</th>
                      <th className="pb-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 font-sans">
                        <td className="py-2.5 font-bold text-slate-800">
                          {item.region_name || item.region_id}
                          {item.district && <span className="block text-[10px] text-slate-400 font-normal">{item.district}</span>}
                        </td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px]">
                            {item.analysis_type}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-600 text-[10px]">
                          {item.pre_date || 'Pre'} &rarr; {item.post_date || 'Post'}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-blue-600">
                          {item.metrics_summary?.newly_detected_water_sqkm !== undefined && item.metrics_summary?.newly_detected_water_sqkm !== null
                            ? `${item.metrics_summary.newly_detected_water_sqkm.toFixed(1)} km²`
                            : item.flood_extent_sqkm !== undefined
                            ? `${item.flood_extent_sqkm.toFixed(1)} km²`
                            : 'N/A'}
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-600">
                          {item.confidence ? `${(item.confidence * 100).toFixed(0)}%` : '95%'}
                        </td>
                        <td className="py-2.5 text-right text-slate-400 text-[10px]">
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => handleReopen(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold transition-all"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Reopen</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Reopen Detail Modal / Drawer */}
          {selectedRunDetail && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Historical Analysis Snapshot</h3>
                    <p className="text-xs text-slate-500">ID: {selectedRunDetail.run_id || selectedRunDetail.id}</p>
                  </div>
                  <button
                    onClick={() => setSelectedRunDetail(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 font-bold"
                  >
                    &times;
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Analysis Type:</span>
                      <span className="font-bold text-slate-800">{selectedRunDetail.analysis_type}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Flood Extent:</span>
                      <span className="font-bold text-blue-600">
                        {selectedRunDetail.flood_extent_sqkm?.toFixed(2) ?? 'N/A'} sq km
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Confidence Score:</span>
                      <span className="font-bold text-emerald-600">
                        {((selectedRunDetail.confidence || 0.95) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Executed At:</span>
                      <span className="font-bold text-slate-800">
                        {new Date(selectedRunDetail.created_at || Date.now()).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {selectedRunDetail.plain_language_summary && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                      <p className="font-bold mb-1">Executive Summary</p>
                      <p className="leading-relaxed">{selectedRunDetail.plain_language_summary}</p>
                    </div>
                  )}

                  {/* Difference Map Overlay Previews */}
                  {selectedRunDetail.overlay_url && (
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 block">Inundation Overlay</span>
                      <img
                        src={selectedRunDetail.overlay_url}
                        alt="Difference overlay"
                        className="w-full h-48 object-cover rounded-xl border border-slate-200"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedRunDetail(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    Close Snapshot
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

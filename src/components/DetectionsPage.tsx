import { useState, useEffect } from 'react';
import { Radar, RefreshCw, AlertCircle, CheckCircle, Trash2, ChevronLeft, ChevronRight, Plus, Eye, TrendingUp, EyeOff } from 'lucide-react';

const getAuthHeaders = () => {
  const token = localStorage.getItem('skyguard-access-token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

const safeArray = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw;
  if (raw?.data && Array.isArray(raw.data)) return raw.data;
  if (raw?.responses && Array.isArray(raw.responses)) return raw.responses;
  return [];
};

export interface Detection {
  id?: number;
  name?: string;
  description?: string;
  isDroneRelated?: boolean;
}

export interface DetectionResponse {
  responses: Detection[];
  hasnextpage: boolean;
}

export default function DetectionsPage() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', isDroneRelated: false });
  const [submitting, setSubmitting] = useState(false);

  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [top5, setTop5] = useState<any[]>([]);
  const [unseen, setUnseen] = useState<any[]>([]);

  const fetchDetections = async (pageNum: number = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/Detections?pagenum=${pageNum}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const result: DetectionResponse = await res.json();
      const normalized = (result.responses ?? []).map((d: any) => ({
        ...d,
        id: d.detectionID ?? d.id,
      }));
      setDetections(normalized);
      setHasMore(result.hasnextpage);
    } catch (err: any) {
      setError(err.message || 'Failed to load detections');
    } finally {
      setLoading(false);
    }
  };

  const fetchTop5 = async () => {
    try {
      const res = await fetch('/api/Detections/top5', { headers: getAuthHeaders() });
      if (res.ok) setTop5(safeArray(await res.json()));
    } catch { /* silent */ }
  };

  const fetchUnseen = async () => {
    try {
      const res = await fetch('/api/Detections/unseen', { headers: getAuthHeaders() });
      if (res.ok) setUnseen(safeArray(await res.json()));
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchDetections(page);
    fetchTop5();
    fetchUnseen();
  }, [page]);

  const openCreate = () => {
    setForm({ name: '', description: '', isDroneRelated: false });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/Detections', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to create detection');
      setSuccess('Detection created');
      setShowModal(false);
      fetchDetections(page);
      fetchTop5();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = async (id: number) => {
    setShowDetail(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await fetch(`/api/Detections/${id}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const raw = await res.json();
        setDetailData(raw.data ? raw.data : raw);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this detection?')) return;
    try {
      const res = await fetch(`/api/Detections/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccess('Detection deleted');
      fetchDetections(page);
      fetchTop5();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full relative py-20 min-h-[95vh]">
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-16 space-y-6 relative z-10">

        {/* Header */}
        <div className="bg-brand-slate/40 p-5 border border-white/5 rounded-sm flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Radar className="w-5 h-5 text-brand-cyan" /> Detections Management
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => { fetchDetections(page); fetchTop5(); fetchUnseen(); }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-white/10 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan/30 font-mono text-xs uppercase tracking-wider rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-brand-cyan text-brand-bg hover:bg-brand-cyan-light font-mono text-xs uppercase font-bold rounded-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Detection
            </button>
          </div>
        </div>

        {error && <div className="flex items-center gap-2 px-4 py-3 border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="flex items-center gap-2 px-4 py-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm"><CheckCircle className="w-4 h-4" /> {success}</div>}

        {/* Top 5 & Unseen Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-brand-slate/40 border border-white/5 rounded-sm p-5">
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-brand-cyan" /> Top 5 Detections
            </h3>
            {top5.length === 0 ? (
              <p className="text-xs text-slate-600 font-mono text-center py-4">No data</p>
            ) : (
              <div className="space-y-2">
                {top5.map((d: any, i: number) => (
                  <div key={d.id ?? i} className="flex items-center gap-3 p-2.5 bg-brand-bg/50 border border-white/5 rounded-sm">
                    <span className="font-mono text-[10px] text-brand-cyan font-bold w-5 text-center">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{d.name || 'Unknown'}</p>
                      {d.description && <p className="text-[10px] text-on-surface-variant truncate">{d.description}</p>}
                    </div>
                    {d.isDroneRelated != null && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm ${d.isDroneRelated ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                        {d.isDroneRelated ? 'DRONE' : 'OTHER'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-brand-slate/40 border border-white/5 rounded-sm p-5">
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-3">
              <EyeOff className="w-4 h-4 text-rose-400" /> Unseen Detections
              {unseen.length > 0 && (
                <span className="ml-auto font-mono text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">{unseen.length}</span>
              )}
            </h3>
            {unseen.length === 0 ? (
              <p className="text-xs text-slate-600 font-mono text-center py-4">All caught up</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {unseen.map((d: any, i: number) => (
                  <div key={d.id ?? i} className="flex items-center gap-3 p-2.5 bg-brand-bg/50 border border-white/5 rounded-sm hover:border-brand-cyan/20 transition-all cursor-pointer" onClick={() => d.id && openDetail(d.id)}>
                    <div className="w-7 h-7 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                      <Radar className="w-3.5 h-3.5 text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{d.name || 'Unknown'}</p>
                      <p className="text-[9px] text-on-surface-variant font-mono truncate">{d.description || 'No description'}</p>
                    </div>
                    <Eye className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-brand-slate/40 border border-white/5 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-brand-bg/50">
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">ID</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Name</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Description</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Drone Related</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center p-8 text-slate-500 animate-pulse">Loading...</td></tr>
                ) : detections.length === 0 ? (
                  <tr><td colSpan={5} className="text-center p-8 text-slate-500">No detections found</td></tr>
                ) : (
                  detections.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-white/5 hover:bg-brand-cyan/5 group cursor-pointer"
                      onClick={() => d.id && openDetail(d.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-brand-cyan">#{d.id}</td>
                      <td className="px-4 py-3 text-xs text-white">{d.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant max-w-xs truncate">{d.description || 'N/A'}</td>
                      <td className="px-4 py-3">
                        {d.isDroneRelated != null ? (
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm ${d.isDroneRelated ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                            {d.isDroneRelated ? 'YES' : 'NO'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); d.id && openDetail(d.id); }}
                            className="p-1.5 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10 rounded-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(d.id!, e)}
                            className="p-1.5 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-brand-bg/30">
            <span className="font-mono text-[10px] text-on-surface-variant">Page {page}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-1.5 border border-white/10 rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore || loading}
                className="p-1.5 border border-white/10 rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-brand-slate border border-white/10 rounded-sm w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="font-display text-lg font-bold text-white">Create Detection</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><span className="text-xl leading-none">&times;</span></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1 min-h-[80px]"
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isDroneRelated: !form.isDroneRelated })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${form.isDroneRelated ? 'bg-brand-cyan' : 'bg-white/10'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isDroneRelated ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">Drone Related</label>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-white/10 text-slate-400 font-mono text-xs uppercase rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-cyan text-brand-bg hover:bg-brand-cyan-light font-mono text-xs uppercase font-bold rounded-sm disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowDetail(false)}>
          <div className="bg-brand-slate border border-white/10 rounded-sm w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-brand-cyan" /> Detection Details
              </h2>
              <button onClick={() => setShowDetail(false)} className="text-slate-400 hover:text-white"><span className="text-xl leading-none">&times;</span></button>
            </div>
            <div className="p-5">
              {detailLoading ? (
                <div className="text-center py-8 text-slate-500 animate-pulse text-sm">Loading...</div>
              ) : detailData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-mono text-[10px] uppercase text-on-surface-variant block">ID</span>
                      <span className="text-sm text-brand-cyan font-mono">#{detailData.id}</span>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Drone Related</span>
                      {detailData.isDroneRelated != null ? (
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-sm ${detailData.isDroneRelated ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                          {detailData.isDroneRelated ? 'YES' : 'NO'}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-600">N/A</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Name</span>
                    <p className="text-sm text-white mt-1">{detailData.name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Description</span>
                    <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{detailData.description || 'No description provided.'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">Failed to load detection details.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
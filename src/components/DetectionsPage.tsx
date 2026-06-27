import { useState, useEffect } from 'react';
import { Radar, RefreshCw, AlertCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const getAuthHeaders = () => {
  const token = localStorage.getItem('skyguard-access-token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

const fetchDetections = async (pageNum: number = 1) => {
  setLoading(true);
  setError('');

  try {
    const res = await fetch(`/api/Detections?pagenum=${pageNum}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);

    const result: DetectionResponse = await res.json();

    const normalized = (result.responses ?? []).map(d => ({
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
  useEffect(() => {
    fetchDetections(page);
  }, [page]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this detection?')) return;
    try {
      const res = await fetch(`/api/Detections/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchDetections(page);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full relative py-20 min-h-[95vh]">
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-16 space-y-6 relative z-10">
        
        <div className="bg-brand-slate/40 p-5 border border-white/5 rounded-sm flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Radar className="w-5 h-5 text-brand-cyan" />
            Detections Management
          </h1>
          <button onClick={() => fetchDetections(page)} className="flex items-center gap-2 px-4 py-2 border border-white/10 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan/30 font-mono text-xs uppercase tracking-wider rounded-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {error && <div className="flex items-center gap-2 px-4 py-3 border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm"><AlertCircle className="w-4 h-4" /> {error}</div>}

        <div className="bg-brand-slate/40 border border-white/5 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-brand-bg/50">
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">ID</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Name</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Frequency</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Created At</th>
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
                    <tr key={d.id} className="border-b border-white/5 hover:bg-brand-cyan/5 group">
                      <td className="px-4 py-3 font-mono text-xs text-brand-cyan">#{d.id}</td>
                      <td className="px-4 py-3 text-xs text-white">{d.name || 'N/A'}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-on-surface-variant">{d.frequency || 'N/A'}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-on-surface-variant">{d.createdAt ? new Date(d.createdAt).toLocaleString() : 'N/A'}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDelete(d.id)} className="p-1.5 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-sm opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
              className="p-1.5 border border-white/10 rounded-sm disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore || loading}
              className="p-1.5 border border-white/10 rounded-sm disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
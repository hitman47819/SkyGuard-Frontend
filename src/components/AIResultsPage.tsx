import { useState, useEffect } from 'react';
import { Cpu, RefreshCw, AlertCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const getAuthHeaders = () => {
  const token = localStorage.getItem('skyguard-access-token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

export default function AIResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchResults = async (pageNum: number = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/AIResult?pagenum=${pageNum}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      
      const raw = await res.json();
      const items = Array.isArray(raw) ? raw : (raw.data || []);
      const normalized = items.map((r: any) => ({ ...r, id: r.id ?? r.aiResultID }));

      setResults(normalized);
      setHasMore(normalized.length === 20);
    } catch (err: any) {
      setError(err.message || 'Failed to load AI results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResults(page); }, [page]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this AI result?')) return;
    try {
      const res = await fetch(`/api/AIResult/id?id=${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to delete');
      fetchResults(page);
    } catch (err: any) { setError(err.message); }
  };

  return (
    <div className="w-full relative py-20 min-h-[95vh]">
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-16 space-y-6 relative z-10">
        <div className="bg-brand-slate/40 p-5 border border-white/5 rounded-sm flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-brand-cyan" /> AI Results Management
          </h1>
          <button onClick={() => fetchResults(page)} className="flex items-center gap-2 px-4 py-2 border border-white/10 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan/30 font-mono text-xs uppercase rounded-sm">
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
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Detection</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Drone Type</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Confidence</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Summary</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center p-8 text-slate-500 animate-pulse">Loading...</td></tr>
                ) : results.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-8 text-slate-500">No AI results found</td></tr>
                ) : (
                  results.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-brand-cyan/5 group">
                      <td className="px-4 py-3 font-mono text-xs text-brand-cyan">#{r.id}</td>
                      <td className="px-4 py-3 text-xs text-white">{r.detectionName || 'N/A'}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{r.droneTypeName || 'N/A'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-emerald-400">{r.confidence ? r.confidence.toFixed(1) : 0}%</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500 max-w-xs truncate">{r.summary || 'N/A'}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-sm opacity-0 group-hover:opacity-100">
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
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 border border-white/10 rounded-sm disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => p + 1)} disabled={!hasMore} className="p-1.5 border border-white/10 rounded-sm disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
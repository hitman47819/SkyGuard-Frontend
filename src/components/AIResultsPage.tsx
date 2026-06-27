import { useState, useEffect } from 'react';
import { Cpu, RefreshCw, AlertCircle, CheckCircle, Trash2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const getAuthHeaders = () => {
  const token = localStorage.getItem('skyguard-access-token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

const fmtDate = (d: string) => {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  } catch { return d; }
};

export default function AIResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const fetchResults = async (pageNum: number = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/AIResult?pagenum=${pageNum}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Error ${res.status}`);

      const raw = await res.json();
      const wrapper = Array.isArray(raw) ? raw[0] : raw;
      const items = wrapper?.responses ?? [];
      const next = wrapper?.hasnextpage ?? false;
      const normalized = items.map((r: any) => ({ ...r, id: r.id ?? r.aiResultID }));

      setResults(normalized);
      setHasMore(next);
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
      setSuccess('AI result deleted');
      fetchResults(page);
    } catch (err: any) { setError(err.message); }
  };

  const confColor = (c: number) => {
    if (c >= 80) return 'text-emerald-400';
    if (c >= 50) return 'text-yellow-400';
    return 'text-rose-400';
  };

  return (
    <div className="w-full relative py-20 min-h-[95vh]">
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-16 space-y-6 relative z-10">
        <div className="bg-brand-slate/40 p-5 border border-white/5 rounded-sm flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-brand-cyan" /> AI Results Management
          </h1>
          <button onClick={() => fetchResults(page)} disabled={loading} className="flex items-center gap-2 px-4 py-2 border border-white/10 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan/30 font-mono text-xs uppercase rounded-sm disabled:opacity-30 disabled:cursor-not-allowed">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {error && <div className="flex items-center gap-2 px-4 py-3 border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="flex items-center gap-2 px-4 py-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm"><CheckCircle className="w-4 h-4" /> {success}</div>}

        <div className="bg-brand-slate/40 border border-white/5 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-brand-bg/50">
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">ID</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Detection</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Drone Type</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Confidence</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Model</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Processed</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Annotation</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center p-8 text-slate-500 animate-pulse">Loading...</td></tr>
                ) : results.length === 0 ? (
                  <tr><td colSpan={8} className="text-center p-8 text-slate-500">No AI results found</td></tr>
                ) : (
                  results.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-brand-cyan/5 group">
                      <td className="px-4 py-3 font-mono text-xs text-brand-cyan">#{r.id}</td>
                      <td className="px-4 py-3 text-xs text-white">{r.detectionName || 'N/A'}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{r.droneTypeName || 'N/A'}</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold">
                        <span className={confColor(r.confidence ?? 0)}>{r.confidence != null ? r.confidence.toFixed(1) : '0.0'}%</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-on-surface-variant">{r.modelVersion || 'N/A'}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-on-surface-variant">{fmtDate(r.processedAt)}</td>
                      <td className="px-4 py-3">
                        {r.annotationImageUrl ? (
                          <img
                            src={r.annotationImageUrl}
                            alt="annotation"
                            className="w-12 h-8 object-cover rounded-sm border border-white/10 cursor-pointer hover:border-brand-cyan/50 transition-colors"
                            onClick={() => setPreviewImg(r.annotationImageUrl)}
                          />
                        ) : (
                          <span className="text-[10px] text-slate-600">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100">
                          {r.annotationImageUrl && (
                            <button onClick={() => setPreviewImg(r.annotationImageUrl)} className="p-1.5 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10 rounded-sm"><Eye className="w-3.5 h-3.5" /></button>
                          )}
                          <button onClick={() => handleDelete(r.id)} className="p-1.5 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-sm"><Trash2 className="w-3.5 h-3.5" /></button>
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
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} className="p-1.5 border border-white/10 rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => p + 1)} disabled={!hasMore || loading} className="p-1.5 border border-white/10 rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewImg(null)} className="absolute -top-3 -right-3 z-10 p-1.5 bg-brand-slate border border-white/10 rounded-full text-slate-400 hover:text-white"><Trash2 className="w-4 h-4 rotate-45" /></button>
            <img src={previewImg} alt="Annotation preview" className="max-w-full max-h-[85vh] rounded-sm border border-white/10 shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Package, Plus, RefreshCw, AlertCircle, CheckCircle, X, Pencil, Trash2, ChevronLeft, ChevronRight, Radio, Loader2 } from 'lucide-react';

const getAuthHeaders = () => {
  const token = localStorage.getItem('skyguard-access-token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

const fmtDate = (d: string) => {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
  } catch { return d; }
};

const toLocalInput = (d: string) => {
  if (!d) return '';
  try {
    const dt = new Date(d);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  } catch { return ''; }
};

export default function PacksPage() {
  const [packs, setPacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ packetNumber: '', capturedAt: '', startTime: '', endTime: '' });
  const [submitting, setSubmitting] = useState(false);

  const [detailPack, setDetailPack] = useState<any>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const fetchPacks = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/Packs?pagenum=${pageNum}`, { headers: getAuthHeaders() });
      const raw = await res.json();
      const wrapper = Array.isArray(raw) ? raw[0] : raw;
      const items = wrapper?.responses ?? [];
      const next = wrapper?.hasnextpage ?? false;
      const norm = items.map((p: any) => ({ ...p, id: p.id ?? p.packetID ?? p.packID }));
      setPacks(norm);
      setHasMore(next);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPacks(page); }, [page]);

  const openCreate = () => {
    setEditing(null);
    setForm({ packetNumber: '', capturedAt: '', startTime: '', endTime: '' });
    setShowModal(true);
  };

  const openEdit = (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    setEditing(p);
    setForm({
      packetNumber: p.packetNumber != null ? String(p.packetNumber) : '',
      capturedAt: toLocalInput(p.capturedAt),
      startTime: toLocalInput(p.startTime),
      endTime: toLocalInput(p.endTime),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        packetNumber: Number(form.packetNumber) || 0,
        capturedAt: form.capturedAt ? new Date(form.capturedAt).toISOString() : null,
        startTime: form.startTime ? new Date(form.startTime).toISOString() : null,
        endTime: form.endTime ? new Date(form.endTime).toISOString() : null,
      };
      const url = editing ? `/api/Packs/${editing.id}` : '/api/Packs';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to save pack');
      setSuccess(editing ? 'Pack updated' : 'Pack created');
      setShowModal(false);
      fetchPacks(page);
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete pack?')) return;
    try {
      await fetch(`/api/Packs/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      setSuccess('Pack deleted');
      fetchPacks(page);
    } catch (err: any) { setError(err.message); }
  };

  const openDetail = async (pack: any) => {
    setDetailPack(pack);
    setShowDetail(true);
    setSegmentsLoading(true);
    setSegments([]);
    try {
      const res = await fetch(`/api/Segments/pack/${pack.id}`, { headers: getAuthHeaders() });
      const raw = await res.json();
      const items = Array.isArray(raw) ? raw : (raw?.responses ?? []);
      setSegments(items);
    } catch (err: any) { setError(err.message); }
    finally { setSegmentsLoading(false); }
  };

  return (
    <div className="w-full relative py-20 min-h-[95vh]">
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-16 space-y-6 relative z-10">

        <div className="bg-brand-slate/40 p-5 border border-white/5 rounded-sm flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-cyan" /> Packs Management
          </h1>
          <div className="flex gap-3">
            <button onClick={() => fetchPacks(page)} disabled={loading} className="flex items-center gap-2 px-4 py-2 border border-white/10 text-slate-400 hover:text-brand-cyan font-mono text-xs uppercase rounded-sm disabled:opacity-30 disabled:cursor-not-allowed">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-cyan text-brand-bg hover:bg-brand-cyan-light font-mono text-xs uppercase font-bold rounded-sm"><Plus className="w-3.5 h-3.5" /> Add Pack</button>
          </div>
        </div>

        {error && <div className="flex items-center gap-2 px-4 py-3 border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="flex items-center gap-2 px-4 py-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm"><CheckCircle className="w-4 h-4" /> {success}</div>}

        <div className="bg-brand-slate/40 border border-white/5 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-brand-bg/50">
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">ID</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Packet #</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Captured At</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Start Time</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">End Time</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center p-8 animate-pulse text-slate-500">Loading...</td></tr>
                ) : packs.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-8 text-slate-500">No packs found</td></tr>
                ) : packs.map(p => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-brand-cyan/5 group cursor-pointer" onClick={() => openDetail(p)}>
                    <td className="px-4 py-3 font-mono text-xs text-brand-cyan">#{p.id}</td>
                    <td className="px-4 py-3 text-xs text-white">{p.packetNumber ?? 'N/A'}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant font-mono">{fmtDate(p.capturedAt)}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant font-mono">{fmtDate(p.startTime)}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant font-mono">{fmtDate(p.endTime)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100">
                        <button onClick={(e) => openEdit(e, p)} className="p-1.5 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10 rounded-sm"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => handleDelete(p.id, e)} className="p-1.5 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-brand-slate border border-white/10 rounded-sm w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="font-display text-lg font-bold text-white">{editing ? 'Edit Pack' : 'Create Pack'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">Packet Number</label>
                <input type="number" required value={form.packetNumber} onChange={e => setForm({ ...form, packetNumber: e.target.value })} className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">Captured At</label>
                <input type="datetime-local" value={form.capturedAt} onChange={e => setForm({ ...form, capturedAt: e.target.value })} className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">Start Time</label>
                <input type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">End Time</label>
                <input type="datetime-local" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1" />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-white/10 text-slate-400 font-mono text-xs uppercase rounded-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-cyan text-brand-bg hover:bg-brand-cyan-light font-mono text-xs uppercase font-bold rounded-sm disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && detailPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowDetail(false)}>
          <div className="bg-brand-slate border border-white/10 rounded-sm w-full max-w-3xl shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 text-brand-cyan" />
                <div>
                  <h2 className="font-display text-lg font-bold text-white">Pack #{detailPack.packetNumber ?? detailPack.id}</h2>
                  <p className="font-mono text-[10px] text-on-surface-variant mt-0.5">Captured {fmtDate(detailPack.capturedAt)}</p>
                </div>
              </div>
              <button onClick={() => setShowDetail(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>

            <div className="px-4 py-3 border-b border-white/5 bg-brand-bg/30 shrink-0 grid grid-cols-3 gap-4">
              <div>
                <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Start</span>
                <span className="text-xs text-white font-mono">{fmtDate(detailPack.startTime)}</span>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase text-on-surface-variant block">End</span>
                <span className="text-xs text-white font-mono">{fmtDate(detailPack.endTime)}</span>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Segments</span>
                <span className="text-xs text-brand-cyan font-mono font-bold">{segmentsLoading ? '...' : segments.length}</span>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {segmentsLoading ? (
                <div className="flex items-center justify-center gap-2 p-12 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading segments...
                </div>
              ) : segments.length === 0 ? (
                <div className="text-center p-12 text-slate-500 text-sm">No segments found for this pack</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-brand-bg/30 sticky top-0">
                      <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">ID</th>
                      <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Seg #</th>
                      <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Start Time</th>
                      <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">End Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segments.map((s: any, i: number) => (
                      <tr key={s.id ?? i} className="border-b border-white/5 hover:bg-brand-cyan/5">
                        <td className="px-4 py-3 font-mono text-xs text-brand-cyan">#{s.id}</td>
                        <td className="px-4 py-3 text-xs text-white">{s.segmentNumber ?? 'N/A'}</td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant font-mono">{fmtDate(s.startTime)}</td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant font-mono">{fmtDate(s.endTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
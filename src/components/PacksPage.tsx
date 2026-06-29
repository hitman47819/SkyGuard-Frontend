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

// Splits an ISO string into date, time (HH:MM), seconds, and ms
const splitISO = (iso: string) => {
  if (!iso) return { date: '', time: '', sec: '', ms: '' };
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return { date: '', time: '', sec: '', ms: '' };
    const pad = (n: number, len = 2) => String(n).padStart(len, '0');
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const sec = pad(d.getSeconds());
    const ms = d.getMilliseconds() === 0 ? '' : pad(d.getMilliseconds(), 3);
    return { date, time, sec, ms };
  } catch {
    return { date: '', time: '', sec: '', ms: '' };
  }
};

// Combines date, time (HH:MM), seconds, and ms into ISO string
const combineISO = (date: string, time: string, sec: string, ms: string): string => {
  if (!date || !time) return '';
  const secPart = sec ? sec.padStart(2, '0') : '00';
  const msPart = ms ? `.${ms.padStart(3, '0')}` : '';
  const isoString = `${date}T${time}:${secPart}${msPart}Z`;
  const test = new Date(isoString);
  if (isNaN(test.getTime())) return '';
  return isoString;
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
  const [form, setForm] = useState({
    packetNumber: '',
    capturedAtDate: '', capturedAtTime: '', capturedAtSec: '', capturedAtMs: '',
    startTimeDate: '', startTimeTime: '', startTimeSec: '', startTimeMs: '',
    endTimeDate: '', endTimeTime: '', endTimeSec: '', endTimeMs: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const [detailPack, setDetailPack] = useState<any>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const [userRole, setUserRole] = useState<number>(3);
  const canModify = userRole !== 3;

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('skyguard-access-token');
      if (!token) return;
      const res = await authFetch('/api/Users/me', {
        headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
      });
      if (res.ok) {
        const data = await res.json();
        const user = data.data ? data.data : data;
        setUserRole(user.userrole ?? 3);
      }
    } catch { /* silent */ }
  };

  const fetchPacks = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/Packs?pagenum=${pageNum}`, { headers: getAuthHeaders() });
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

  useEffect(() => { fetchCurrentUser(); }, []);
  useEffect(() => { fetchPacks(page); }, [page]);

  const openCreate = () => {
    if (!canModify) return;
    setEditing(null);
    setForm({
      packetNumber: '',
      capturedAtDate: '', capturedAtTime: '', capturedAtSec: '', capturedAtMs: '',
      startTimeDate: '', startTimeTime: '', startTimeSec: '', startTimeMs: '',
      endTimeDate: '', endTimeTime: '', endTimeSec: '', endTimeMs: '',
    });
    setShowModal(true);
  };

  const openEdit = (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    if (!canModify) return;
    setEditing(p);
    const cap = splitISO(p.capturedAt);
    const start = splitISO(p.startTime);
    const end = splitISO(p.endTime);
    setForm({
      packetNumber: p.packetNumber != null ? String(p.packetNumber) : '',
      capturedAtDate: cap.date, capturedAtTime: cap.time, capturedAtSec: cap.sec, capturedAtMs: cap.ms,
      startTimeDate: start.date, startTimeTime: start.time, startTimeSec: start.sec, startTimeMs: start.ms,
      endTimeDate: end.date, endTimeTime: end.time, endTimeSec: end.sec, endTimeMs: end.ms,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify) return;
    setSubmitting(true);
    try {
      const payload = {
        packetNumber: Number(form.packetNumber) || 0,
        capturedAt: combineISO(form.capturedAtDate, form.capturedAtTime, form.capturedAtSec, form.capturedAtMs) || null,
        startTime: combineISO(form.startTimeDate, form.startTimeTime, form.startTimeSec, form.startTimeMs) || null,
        endTime: combineISO(form.endTimeDate, form.endTimeTime, form.endTimeSec, form.endTimeMs) || null,
      };
      const url = editing ? `/api/Packs/${editing.id}` : '/api/Packs';
      const method = editing ? 'PUT' : 'POST';
      const res = await authFetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to save pack');
      setSuccess(editing ? 'Pack updated' : 'Pack created');
      setShowModal(false);
      fetchPacks(page);
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canModify) return;
    if (!confirm('Delete pack?')) return;
    try {
      await authFetch(`/api/Packs/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
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
      const res = await authFetch(`/api/Segments/pack/${pack.id}`, { headers: getAuthHeaders() });
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
            {canModify && (
              <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-cyan text-brand-bg hover:bg-brand-cyan-light font-mono text-xs uppercase font-bold rounded-sm"><Plus className="w-3.5 h-3.5" /> Add Pack</button>
            )}
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
                        {canModify && (
                          <>
                            <button onClick={(e) => openEdit(e, p)} className="p-1.5 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10 rounded-sm"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={(e) => handleDelete(p.id, e)} className="p-1.5 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                          </>
                        )}
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

      {/* Create / Edit Modal */}
      {showModal && canModify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-brand-slate border border-white/10 rounded-sm w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="font-display text-lg font-bold text-white">{editing ? 'Edit Pack' : 'Create Pack'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">Packet Number</label>
                <input type="number" required value={form.packetNumber} onChange={e => setForm({...form, packetNumber: e.target.value})} className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1" />
              </div>

              {/* Time fields (Captured, Start, End) – each row: date / time(HH:MM) / sec / ms */}
              {['capturedAt', 'startTime', 'endTime'].map((field) => (
                <div key={field}>
                  <label className="font-mono text-[10px] uppercase text-on-surface-variant mb-1 block">
                    {field === 'capturedAt' ? 'Captured At' : field === 'startTime' ? 'Start Time' : 'End Time'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      required
                      value={(form as any)[`${field}Date`]}
                      onChange={e => setForm({...form, [`${field}Date`]: e.target.value})}
                      className="flex-1 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-2 py-2 text-xs rounded-sm outline-none"
                    />
                    <input
                      type="time"
                      required
                      value={(form as any)[`${field}Time`]}
                      onChange={e => setForm({...form, [`${field}Time`]: e.target.value})}
                      className="w-20 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-1 py-2 text-xs rounded-sm outline-none"
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="s"
                      value={(form as any)[`${field}Sec`]}
                      onChange={e => setForm({...form, [`${field}Sec`]: e.target.value})}
                      className="w-12 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-1 py-2 text-xs rounded-sm outline-none"
                    />
                    <input
                      type="number"
                      min="0"
                      max="999"
                      placeholder="ms"
                      value={(form as any)[`${field}Ms`]}
                      onChange={e => setForm({...form, [`${field}Ms`]: e.target.value})}
                      className="w-14 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-1 py-2 text-xs rounded-sm outline-none"
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-white/10 text-slate-400 font-mono text-xs uppercase rounded-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-cyan text-brand-bg hover:bg-brand-cyan-light font-mono text-xs uppercase font-bold rounded-sm disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal (unchanged) */}
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
              <div><span className="font-mono text-[10px] uppercase text-on-surface-variant block">Start</span><span className="text-xs text-white font-mono">{fmtDate(detailPack.startTime)}</span></div>
              <div><span className="font-mono text-[10px] uppercase text-on-surface-variant block">End</span><span className="text-xs text-white font-mono">{fmtDate(detailPack.endTime)}</span></div>
              <div><span className="font-mono text-[10px] uppercase text-on-surface-variant block">Segments</span><span className="text-xs text-brand-cyan font-mono font-bold">{segmentsLoading ? '...' : segments.length}</span></div>
            </div>
            <div className="overflow-y-auto flex-1">
              {segmentsLoading ? (
                <div className="flex items-center justify-center gap-2 p-12 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading segments...</div>
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
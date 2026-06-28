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

// Splits an ISO string into date (yyyy-mm-dd), time (HH:MM), and ms (SSS)
const splitISO = (iso: string) => {
  if (!iso) return { date: '', time: '', ms: '' };
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return { date: '', time: '', ms: '' };
    const pad = (n: number, len = 2) => String(n).padStart(len, '0');
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const ms = pad(d.getMilliseconds(), 3);
    return { date, time, ms };
  } catch {
    return { date: '', time: '', ms: '' };
  }
};

// Combines date, time, and ms into a full ISO string (UTC)
const combineISO = (date: string, time: string, ms: string): string => {
  if (!date || !time) return '';
  // Append seconds = "00" if needed? Actually the time input gives HH:MM, no seconds.
  // We'll manually add ":00" for seconds and then ".ms" if provided.
  const seconds = '00';
  const msPart = ms ? `.${ms.padStart(3, '0')}` : '';
  const isoString = `${date}T${time}:${seconds}${msPart}Z`;
  // Validate that it's a correct date
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
  // Form state: we store each datetime as separate date, time, ms
  const [form, setForm] = useState({
    packetNumber: '',
    capturedAtDate: '',
    capturedAtTime: '',
    capturedAtMs: '',
    startTimeDate: '',
    startTimeTime: '',
    startTimeMs: '',
    endTimeDate: '',
    endTimeTime: '',
    endTimeMs: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const [detailPack, setDetailPack] = useState<any>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // Role restrictions
  const [userRole, setUserRole] = useState<number>(3);
  const canModify = userRole !== 3;

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('skyguard-access-token');
      if (!token) return;
      const res = await fetch('/api/Users/me', {
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

  useEffect(() => { fetchCurrentUser(); }, []);
  useEffect(() => { fetchPacks(page); }, [page]);

  const openCreate = () => {
    if (!canModify) return;
    setEditing(null);
    setForm({
      packetNumber: '',
      capturedAtDate: '', capturedAtTime: '', capturedAtMs: '',
      startTimeDate: '', startTimeTime: '', startTimeMs: '',
      endTimeDate: '', endTimeTime: '', endTimeMs: '',
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
      capturedAtDate: cap.date, capturedAtTime: cap.time, capturedAtMs: cap.ms,
      startTimeDate: start.date, startTimeTime: start.time, startTimeMs: start.ms,
      endTimeDate: end.date, endTimeTime: end.time, endTimeMs: end.ms,
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
        capturedAt: combineISO(form.capturedAtDate, form.capturedAtTime, form.capturedAtMs) || null,
        startTime: combineISO(form.startTimeDate, form.startTimeTime, form.startTimeMs) || null,
        endTime: combineISO(form.endTimeDate, form.endTimeTime, form.endTimeMs) || null,
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
    if (!canModify) return;
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
      {/* ... rest of the JSX remains the same until the modal ... */}
      {/* Header, alerts, table all unchanged */}

      {/* Modal with precise time inputs */}
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

              {/* Captured At */}
              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">Captured At</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="date"
                    value={form.capturedAtDate}
                    onChange={e => setForm({...form, capturedAtDate: e.target.value})}
                    className="flex-1 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-2 py-2 text-sm rounded-sm outline-none"
                  />
                  <input
                    type="time"
                    step="1"
                    value={form.capturedAtTime}
                    onChange={e => setForm({...form, capturedAtTime: e.target.value})}
                    className="w-24 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-2 py-2 text-sm rounded-sm outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    max="999"
                    placeholder="ms"
                    value={form.capturedAtMs}
                    onChange={e => setForm({...form, capturedAtMs: e.target.value})}
                    className="w-16 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-2 py-2 text-sm rounded-sm outline-none"
                  />
                </div>
              </div>

              {/* Start Time */}
              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">Start Time</label>
                <div className="flex gap-2 mt-1">
                  <input type="date" value={form.startTimeDate} onChange={e => setForm({...form, startTimeDate: e.target.value})} className="flex-1 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-2 py-2 text-sm rounded-sm outline-none" />
                  <input type="time" step="1" value={form.startTimeTime} onChange={e => setForm({...form, startTimeTime: e.target.value})} className="w-24 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-2 py-2 text-sm rounded-sm outline-none" />
                  <input type="number" min="0" max="999" placeholder="ms" value={form.startTimeMs} onChange={e => setForm({...form, startTimeMs: e.target.value})} className="w-16 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-2 py-2 text-sm rounded-sm outline-none" />
                </div>
              </div>

              {/* End Time */}
              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">End Time</label>
                <div className="flex gap-2 mt-1">
                  <input type="date" value={form.endTimeDate} onChange={e => setForm({...form, endTimeDate: e.target.value})} className="flex-1 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-2 py-2 text-sm rounded-sm outline-none" />
                  <input type="time" step="1" value={form.endTimeTime} onChange={e => setForm({...form, endTimeTime: e.target.value})} className="w-24 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-2 py-2 text-sm rounded-sm outline-none" />
                  <input type="number" min="0" max="999" placeholder="ms" value={form.endTimeMs} onChange={e => setForm({...form, endTimeMs: e.target.value})} className="w-16 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-2 py-2 text-sm rounded-sm outline-none" />
                </div>
              </div>

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
          {/* ... unchanged detail modal ... */}
        </div>
      )}
    </div>
  );
}
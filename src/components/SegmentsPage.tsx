import { useState, useEffect } from 'react';
import {
  Layers, Plus, Pencil, Trash2, AlertCircle, CheckCircle,
  RefreshCw, X, ChevronLeft, ChevronRight, Package, Loader2, Clock, Hash, Box
} from 'lucide-react';
import type { Segment, SegmentCreateDto, SegmentUpdateDto, User } from '../types';
import { authFetch } from "@/utlis/authfetch";

const getAuthHeaders = () => {
  const token = localStorage.getItem('skyguard-access-token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

interface Pack {
  id: number;
  packetNumber: number;
  capturedAt: string;
  startTime: string;
  endTime: string;
}

// Time helpers – splits into date, time (HH:MM), sec, ms
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

const combineISO = (date: string, time: string, sec: string, ms: string): string => {
  if (!date || !time) return '';
  const secPart = sec ? sec.padStart(2, '0') : '00';
  const msPart = ms ? `.${ms.padStart(3, '0')}` : '';
  const isoString = `${date}T${time}:${secPart}${msPart}Z`;
  const test = new Date(isoString);
  if (isNaN(test.getTime())) return '';
  return isoString;
};

interface SegmentResponse {
  responses: Segment[];
  hasnextpage: boolean;
}

export default function SegmentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [formData, setFormData] = useState({
    segmentNumber: 1,
    packetId: 1,
    startTimeDate: '', startTimeTime: '', startTimeSec: '', startTimeMs: '',
    endTimeDate: '', endTimeTime: '', endTimeSec: '', endTimeMs: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // --- Segment Details Popup state ---
  const [segmentDetails, setSegmentDetails] = useState<Segment | null>(null);
  const [segmentDetailsLoading, setSegmentDetailsLoading] = useState(false);
  const [segmentDetailsError, setSegmentDetailsError] = useState('');

  // --- Pack Details Popup state ---
  const [packDetails, setPackDetails] = useState<Pack | null>(null);
  const [packSegments, setPackSegments] = useState<Segment[]>([]);
  const [packLoading, setPackLoading] = useState(false);
  const [packError, setPackError] = useState('');

  const canEdit = user ? user.userrole === 1 || user.userrole === 2 : false;

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('skyguard-access-token');
      if (!token) return;
      const res = await authFetch('/api/Users/me', {
        headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
      });
      if (res.ok) {
        const raw = await res.json();
        const userData = raw.data ? raw.data : raw;
        setUser(userData);
      }
    } catch { /* silent */ }
  };

  const fetchSegments = async (pageNum: number = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`/api/Segments?pagenum=${pageNum}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);

      const result: SegmentResponse = await res.json();
      const normalized = (result.responses ?? []).map((s: any) => ({
        ...s,
        id: s.segmentID ?? s.id,
      }));
      setSegments(normalized);
      setHasMore(result.hasnextpage);
    } catch (err: any) {
      setError(err.message || 'Failed to load segments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchSegments(page);
  }, [page]);

  // --- Open Segment Details popup (GET /api/Segments/{id}) ---
  const openSegmentDetails = async (id: number) => {
    setPackDetails(null);
    setPackSegments([]);
    setSegmentDetails(null);
    setSegmentDetailsError('');
    setSegmentDetailsLoading(true);
    try {
      const res = await authFetch(`/api/Segments/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const raw = await res.json();
      const data = raw.data ? raw.data : raw;
      setSegmentDetails({ ...data, id: data.segmentID ?? data.id });
    } catch (err: any) {
      setSegmentDetailsError(err.message || 'Failed to load segment');
    } finally {
      setSegmentDetailsLoading(false);
    }
  };

  const closeSegmentDetails = () => {
    setSegmentDetails(null);
    setSegmentDetailsError('');
  };

  // --- Open Pack Details popup (GET /api/Packs/{id} + GET /api/Segments/pack/{packID}) ---
  const openPackDetails = async (packId: number) => {
    setSegmentDetails(null);
    setPackDetails(null);
    setPackSegments([]);
    setPackError('');
    setPackLoading(true);
    try {
      const [packRes, segRes] = await Promise.all([
        authFetch(`/api/Packs/${packId}`, { headers: getAuthHeaders() }),
        authFetch(`/api/Segments/pack/${packId}`, { headers: getAuthHeaders() }),
      ]);

      if (!packRes.ok) throw new Error(`Failed to load pack (Error ${packRes.status})`);

      const packRaw = await packRes.json();
      const packData = packRaw.data ? packRaw.data : packRaw;
      setPackDetails(packData);

      if (segRes.ok) {
        const segRaw = await segRes.json();
        const segList: Segment[] = (segRaw.data ?? segRaw ?? []).map((s: any) => ({
          ...s,
          id: s.segmentID ?? s.id,
        }));
        setPackSegments(segList);
      } else {
        setPackSegments([]);
      }
    } catch (err: any) {
      setPackError(err.message || 'Failed to load pack');
    } finally {
      setPackLoading(false);
    }
  };

  const closePackDetails = () => {
    setPackDetails(null);
    setPackSegments([]);
    setPackError('');
  };

  const openCreate = () => {
    setEditingSegment(null);
    const now = new Date();
    const later = new Date(now.getTime() + 3600000);
    const nowSplit = splitISO(now.toISOString());
    const laterSplit = splitISO(later.toISOString());

    setFormData({
      segmentNumber: 1,
      packetId: 1,
      startTimeDate: nowSplit.date,
      startTimeTime: nowSplit.time,
      startTimeSec: nowSplit.sec,
      startTimeMs: nowSplit.ms,
      endTimeDate: laterSplit.date,
      endTimeTime: laterSplit.time,
      endTimeSec: laterSplit.sec,
      endTimeMs: laterSplit.ms,
    });
    setShowModal(true);
  };

  const openEdit = (segment: Segment) => {
    setEditingSegment(segment);
    const startSplit = splitISO(segment.startTime);
    const endSplit = splitISO(segment.endTime);

    setFormData({
      segmentNumber: segment.segmentNumber,
      packetId: segment.packetId,
      startTimeDate: startSplit.date,
      startTimeTime: startSplit.time,
      startTimeSec: startSplit.sec,
      startTimeMs: startSplit.ms,
      endTimeDate: endSplit.date,
      endTimeTime: endSplit.time,
      endTimeSec: endSplit.sec,
      endTimeMs: endSplit.ms,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const startISO = combineISO(
        formData.startTimeDate,
        formData.startTimeTime,
        formData.startTimeSec,
        formData.startTimeMs,
      );
      const endISO = combineISO(
        formData.endTimeDate,
        formData.endTimeTime,
        formData.endTimeSec,
        formData.endTimeMs,
      );

      if (!startISO || !endISO) throw new Error('Invalid date/time');

      if (editingSegment) {
        const updatePayload: SegmentUpdateDto = {};
        if (formData.segmentNumber !== undefined) updatePayload.segmentNumber = formData.segmentNumber;
        if (formData.packetId !== undefined) updatePayload.packetId = formData.packetId;
        updatePayload.startTime = startISO;
        updatePayload.endTime = endISO;

        const res = await authFetch(`/api/Segments/${editingSegment.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updatePayload),
        });
        if (!res.ok) throw new Error('Failed to update segment');
        setSuccess('Segment updated successfully');
      } else {
        const createPayload: SegmentCreateDto = {
          segmentNumber: formData.segmentNumber,
          packetId: formData.packetId,
          startTime: startISO,
          endTime: endISO,
        };

        const res = await authFetch('/api/Segments', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(createPayload),
        });
        if (!res.ok) throw new Error('Failed to create segment');
        setSuccess('Segment created successfully');
      }

      setShowModal(false);
      fetchSegments(page);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this segment?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await authFetch(`/api/Segments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete segment');
      setSuccess('Segment deleted successfully');
      fetchSegments(page);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const formatDuration = (start: string, end: string) => {
    try {
      const ms = new Date(end).getTime() - new Date(start).getTime();
      return `${Math.round(ms / 1000)}s`;
    } catch {
      return '—';
    }
  };

  return (
    <div className="w-full relative py-20 min-h-[95vh]">
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-16 space-y-6 relative z-10">
        {/* Header */}
        <div className="bg-brand-slate/40 p-5 border border-white/5 rounded-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-cyan" />
                Segment Management
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">
                Manage RF signal segments across detection packets.
                {user && (
                  <span className="text-brand-cyan font-mono ml-2">
                    [{user.userrole === 1 ? 'Super' : user.userrole === 2 ? 'Admin' : 'View Only'}]
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchSegments(page)}
                className="flex items-center gap-2 px-4 py-2 border border-white/10 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan/30 transition-all font-mono text-xs uppercase tracking-wider rounded-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
              {canEdit && (
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-cyan text-brand-bg hover:bg-brand-cyan-light transition-all font-mono text-xs uppercase tracking-wider font-bold rounded-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Segment
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 border border-rose-500/30 bg-rose-500/10 rounded-sm text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 px-4 py-3 border border-emerald-500/30 bg-emerald-500/10 rounded-sm text-emerald-300 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* Segments Table */}
        <div className="bg-brand-slate/40 border border-white/5 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-brand-bg/50">
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">ID</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Segment #</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Packet ID</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Start Time</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">End Time</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Duration</th>
                  {canEdit && <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array.from({ length: canEdit ? 7 : 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 bg-white/5 rounded animate-pulse w-16"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : segments.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 7 : 6} className="px-4 py-12 text-center text-on-surface-variant text-sm">
                      <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No segments found
                    </td>
                  </tr>
                ) : (
                  segments.map((segment) => (
                    <tr
                      key={segment.id}
                      className="border-b border-white/5 hover:bg-brand-cyan/5 transition-colors group"
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        <button
                          onClick={() => openSegmentDetails(segment.id)}
                          className="text-brand-cyan hover:text-brand-cyan-light hover:underline cursor-pointer transition-all"
                          title="View segment details"
                        >
                          #{segment.id}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-white font-bold">{segment.segmentNumber}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openPackDetails(segment.packetId)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-cyan/10 border border-brand-cyan/20 rounded-sm font-mono text-[10px] text-brand-cyan hover:bg-brand-cyan/20 hover:border-brand-cyan/40 transition-all cursor-pointer"
                          title="View packet details"
                        >
                          <Package className="w-3 h-3" />
                          {segment.packetId}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-on-surface-variant">{formatDate(segment.startTime)}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-on-surface-variant">{formatDate(segment.endTime)}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-emerald-400">
                        {formatDuration(segment.startTime, segment.endTime)}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEdit(segment)}
                              className="p-1.5 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10 rounded-sm transition-all"
                              title="Edit segment"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(segment.id)}
                              className="p-1.5 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-sm transition-all"
                              title="Delete segment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-brand-bg/30">
            <span className="font-mono text-[10px] text-on-surface-variant">Page {page}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-1.5 border border-white/10 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan/30 disabled:opacity-30 rounded-sm transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore || loading}
                className="p-1.5 border border-white/10 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan/30 disabled:opacity-30 rounded-sm transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-brand-slate border border-white/10 rounded-sm w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="font-display text-lg font-bold text-white">
                {editingSegment ? 'Edit Segment' : 'Create Segment'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                    Segment Number
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.segmentNumber}
                    onChange={e => setFormData(d => ({ ...d, segmentNumber: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                    Packet ID
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.packetId}
                    onChange={e => setFormData(d => ({ ...d, packetId: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none transition-all"
                  />
                </div>
              </div>

              {/* Start Time */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                  Start Time
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    required
                    value={formData.startTimeDate}
                    onChange={e => setFormData(d => ({ ...d, startTimeDate: e.target.value }))}
                    className="flex-1 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-2 py-2 text-xs rounded-sm outline-none"
                  />
                  <input
                    type="time"
                    required
                    value={formData.startTimeTime}
                    onChange={e => setFormData(d => ({ ...d, startTimeTime: e.target.value }))}
                    className="w-20 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-1 py-2 text-xs rounded-sm outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="s"
                    value={formData.startTimeSec}
                    onChange={e => setFormData(d => ({ ...d, startTimeSec: e.target.value }))}
                    className="w-12 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-1 py-2 text-xs rounded-sm outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    max="999"
                    placeholder="ms"
                    value={formData.startTimeMs}
                    onChange={e => setFormData(d => ({ ...d, startTimeMs: e.target.value }))}
                    className="w-14 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-1 py-2 text-xs rounded-sm outline-none"
                  />
                </div>
              </div>

              {/* End Time */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                  End Time
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    required
                    value={formData.endTimeDate}
                    onChange={e => setFormData(d => ({ ...d, endTimeDate: e.target.value }))}
                    className="flex-1 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-2 py-2 text-xs rounded-sm outline-none"
                  />
                  <input
                    type="time"
                    required
                    value={formData.endTimeTime}
                    onChange={e => setFormData(d => ({ ...d, endTimeTime: e.target.value }))}
                    className="w-20 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-1 py-2 text-xs rounded-sm outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="s"
                    value={formData.endTimeSec}
                    onChange={e => setFormData(d => ({ ...d, endTimeSec: e.target.value }))}
                    className="w-12 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-1 py-2 text-xs rounded-sm outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    max="999"
                    placeholder="ms"
                    value={formData.endTimeMs}
                    onChange={e => setFormData(d => ({ ...d, endTimeMs: e.target.value }))}
                    className="w-14 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-1 py-2 text-xs rounded-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all font-mono text-xs uppercase tracking-wider rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-cyan text-brand-bg hover:bg-brand-cyan-light transition-all font-mono text-xs uppercase tracking-wider font-bold rounded-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingSegment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Segment Details Popup */}
      {(segmentDetails || segmentDetailsLoading || segmentDetailsError) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeSegmentDetails}
        >
          <div
            className="bg-brand-slate border border-white/10 rounded-sm w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-cyan" />
                Segment Details
              </h2>
              <button
                onClick={closeSegmentDetails}
                className="p-1 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {segmentDetailsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-brand-cyan animate-spin" />
                </div>
              ) : segmentDetailsError ? (
                <div className="flex items-center gap-2 px-4 py-3 border border-rose-500/30 bg-rose-500/10 rounded-sm text-rose-300 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {segmentDetailsError}
                </div>
              ) : segmentDetails ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-brand-bg/50 border border-white/5 rounded-sm">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-on-surface-variant font-mono font-bold mb-1">
                        <Hash className="w-3 h-3" /> Segment ID
                      </div>
                      <div className="font-mono text-sm text-brand-cyan font-bold">#{segmentDetails.id}</div>
                    </div>
                    <div className="p-3 bg-brand-bg/50 border border-white/5 rounded-sm">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-on-surface-variant font-mono font-bold mb-1">
                        <Layers className="w-3 h-3" /> Segment #
                      </div>
                      <div className="font-mono text-sm text-white font-bold">{segmentDetails.segmentNumber}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-brand-bg/50 border border-white/5 rounded-sm">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-on-surface-variant font-mono font-bold mb-1">
                      <Package className="w-3 h-3" /> Packet ID
                    </div>
                    <button
                      onClick={() => openPackDetails(segmentDetails.packetId)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-cyan/10 border border-brand-cyan/20 rounded-sm font-mono text-xs text-brand-cyan hover:bg-brand-cyan/20 hover:border-brand-cyan/40 transition-all"
                    >
                      <Package className="w-3 h-3" />
                      {segmentDetails.packetId}
                    </button>
                  </div>

                  <div className="p-3 bg-brand-bg/50 border border-white/5 rounded-sm">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-on-surface-variant font-mono font-bold mb-1">
                      <Clock className="w-3 h-3" /> Start Time
                    </div>
                    <div className="font-mono text-xs text-white">{formatDate(segmentDetails.startTime)}</div>
                  </div>

                  <div className="p-3 bg-brand-bg/50 border border-white/5 rounded-sm">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-on-surface-variant font-mono font-bold mb-1">
                      <Clock className="w-3 h-3" /> End Time
                    </div>
                    <div className="font-mono text-xs text-white">{formatDate(segmentDetails.endTime)}</div>
                  </div>

                  <div className="p-3 bg-brand-cyan/5 border border-brand-cyan/20 rounded-sm">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-on-surface-variant font-mono font-bold mb-1">
                      <Clock className="w-3 h-3" /> Duration
                    </div>
                    <div className="font-mono text-lg text-emerald-400 font-bold">
                      {formatDuration(segmentDetails.startTime, segmentDetails.endTime)}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-end pt-4 border-t border-white/5 mt-4">
                <button
                  onClick={closeSegmentDetails}
                  className="px-4 py-2 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all font-mono text-xs uppercase tracking-wider rounded-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pack Details Popup */}
      {(packDetails || packLoading || packError) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closePackDetails}
        >
          <div
            className="bg-brand-slate border border-white/10 rounded-sm w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-cyan" />
                Packet Details
              </h2>
              <button
                onClick={closePackDetails}
                className="p-1 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              {packLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-brand-cyan animate-spin" />
                </div>
              ) : packError ? (
                <div className="flex items-center gap-2 px-4 py-3 border border-rose-500/30 bg-rose-500/10 rounded-sm text-rose-300 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {packError}
                </div>
              ) : packDetails ? (
                <div className="space-y-4">
                  {/* Pack info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-brand-bg/50 border border-white/5 rounded-sm">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-on-surface-variant font-mono font-bold mb-1">
                        <Hash className="w-3 h-3" /> Packet ID
                      </div>
                      <div className="font-mono text-sm text-brand-cyan font-bold">#{packDetails.id}</div>
                    </div>
                    <div className="p-3 bg-brand-bg/50 border border-white/5 rounded-sm">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-on-surface-variant font-mono font-bold mb-1">
                        <Box className="w-3 h-3" /> Packet Number
                      </div>
                      <div className="font-mono text-sm text-white font-bold">{packDetails.packetNumber}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-brand-bg/50 border border-white/5 rounded-sm">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-on-surface-variant font-mono font-bold mb-1">
                        <Clock className="w-3 h-3" /> Captured
                      </div>
                      <div className="font-mono text-[11px] text-white">{formatDate(packDetails.capturedAt)}</div>
                    </div>
                    <div className="p-3 bg-brand-bg/50 border border-white/5 rounded-sm">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-on-surface-variant font-mono font-bold mb-1">
                        <Clock className="w-3 h-3" /> Start
                      </div>
                      <div className="font-mono text-[11px] text-white">{formatDate(packDetails.startTime)}</div>
                    </div>
                    <div className="p-3 bg-brand-bg/50 border border-white/5 rounded-sm">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-on-surface-variant font-mono font-bold mb-1">
                        <Clock className="w-3 h-3" /> End
                      </div>
                      <div className="font-mono text-[11px] text-white">{formatDate(packDetails.endTime)}</div>
                    </div>
                  </div>

                  {/* Segments list */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-brand-cyan" />
                        Segments in this packet
                      </h3>
                      <span className="font-mono text-[10px] text-on-surface-variant">
                        {packSegments.length} total
                      </span>
                    </div>

                    {packSegments.length === 0 ? (
                      <div className="px-4 py-8 text-center text-on-surface-variant text-sm border border-white/5 rounded-sm bg-brand-bg/30">
                        <Layers className="w-6 h-6 mx-auto mb-2 opacity-30" />
                        No segments in this packet
                      </div>
                    ) : (
                      <div className="border border-white/5 rounded-sm overflow-hidden">
                        <div className="max-h-72 overflow-y-auto">
                          <table className="w-full">
                            <thead className="sticky top-0">
                              <tr className="border-b border-white/5 bg-brand-bg/80">
                                <th className="text-left px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">ID</th>
                                <th className="text-left px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Seg #</th>
                                <th className="text-left px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Start</th>
                                <th className="text-left px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">End</th>
                                <th className="text-left px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Dur</th>
                              </tr>
                            </thead>
                            <tbody>
                              {packSegments.map((seg) => (
                                <tr
                                  key={seg.id}
                                  onClick={() => openSegmentDetails(seg.id)}
                                  className="border-b border-white/5 hover:bg-brand-cyan/10 transition-colors cursor-pointer group"
                                >
                                  <td className="px-3 py-2 font-mono text-[11px] text-brand-cyan group-hover:underline">
                                    #{seg.id}
                                  </td>
                                  <td className="px-3 py-2 text-[11px] text-white font-bold">{seg.segmentNumber}</td>
                                  <td className="px-3 py-2 font-mono text-[10px] text-on-surface-variant">
                                    {formatDate(seg.startTime)}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-[10px] text-on-surface-variant">
                                    {formatDate(seg.endTime)}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-[10px] text-emerald-400">
                                    {formatDuration(seg.startTime, seg.endTime)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-end pt-4 border-t border-white/5 mt-4">
                <button
                  onClick={closePackDetails}
                  className="px-4 py-2 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all font-mono text-xs uppercase tracking-wider rounded-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
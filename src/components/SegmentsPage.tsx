import { useState, useEffect } from 'react';
import {
  Layers, Plus, Pencil, Trash2, AlertCircle, CheckCircle,
  RefreshCw, X, ChevronLeft, ChevronRight, Package
} from 'lucide-react';
import type { Segment, SegmentCreateDto, SegmentUpdateDto, User } from '../types';

const getAuthHeaders = () => {
  const token = localStorage.getItem('skyguard-access-token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// --- Helpers for millisecond precision ---

/**
 * Splits an ISO string into { date: 'yyyy-mm-dd', time: 'HH:MM', ms: 'SSS' }
 * Milliseconds are optional – returns '' if not present.
 */
const splitISO = (iso: string) => {
  if (!iso) return { date: '', time: '', ms: '' };
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return { date: '', time: '', ms: '' };
    const pad = (n: number, len = 2) => String(n).padStart(len, '0');
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const ms = d.getMilliseconds() === 0 ? '' : pad(d.getMilliseconds(), 3);
    return { date, time, ms };
  } catch {
    return { date: '', time: '', ms: '' };
  }
};

/**
 * Combines date, time, and optional ms into a full ISO-8601 string (UTC).
 * Seconds are set to "00" unless the browser provides them via step="1".
 * Actually the time input with step="1" gives HH:MM:SS – so we'll use seconds from there.
 * We'll slightly adjust: the time input will now store HH:MM:SS (from a time input with step="1").
 */
const combineISO = (date: string, time: string, ms: string): string => {
  if (!date || !time) return '';
  // time format can be HH:MM or HH:MM:SS – we'll parse accordingly
  const parts = time.split(':');
  const hours = parts[0]?.padStart(2, '0') ?? '00';
  const minutes = parts[1]?.padStart(2, '0') ?? '00';
  const seconds = parts[2]?.padStart(2, '0') ?? '00';
  const msPart = ms ? `.${ms.padStart(3, '0')}` : '';
  const isoString = `${date}T${hours}:${minutes}:${seconds}${msPart}Z`;
  const test = new Date(isoString);
  if (isNaN(test.getTime())) return '';
  return isoString;
};

// --- Component ---

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

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);

  // Precise form: we store date, time (HH:MM or HH:MM:SS), and ms separately
  const [formData, setFormData] = useState({
    segmentNumber: 1,
    packetId: 1,
    startTimeDate: '',
    startTimeTime: '',
    startTimeMs: '',
    endTimeDate: '',
    endTimeTime: '',
    endTimeMs: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const canEdit = user ? user.userrole === 1 || user.userrole === 2 : false;

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('skyguard-access-token');
      if (!token) return;
      const res = await fetch('/api/Users/me', {
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
      const res = await fetch(`/api/Segments?pagenum=${pageNum}`, {
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
      startTimeMs: nowSplit.ms,
      endTimeDate: laterSplit.date,
      endTimeTime: laterSplit.time,
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
      startTimeMs: startSplit.ms,
      endTimeDate: endSplit.date,
      endTimeTime: endSplit.time,
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
        formData.startTimeMs,
      );
      const endISO = combineISO(
        formData.endTimeDate,
        formData.endTimeTime,
        formData.endTimeMs,
      );

      if (!startISO || !endISO) throw new Error('Invalid date/time');

      if (editingSegment) {
        const updatePayload: SegmentUpdateDto = {};
        if (formData.segmentNumber !== undefined) updatePayload.segmentNumber = formData.segmentNumber;
        if (formData.packetId !== undefined) updatePayload.packetId = formData.packetId;
        updatePayload.startTime = startISO;
        updatePayload.endTime = endISO;

        const res = await fetch(`/api/Segments/${editingSegment.id}`, {
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

        const res = await fetch('/api/Segments', {
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
      const res = await fetch(`/api/Segments/${id}`, {
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
                      <td className="px-4 py-3 font-mono text-xs text-brand-cyan">#{segment.id}</td>
                      <td className="px-4 py-3 text-xs text-white font-bold">{segment.segmentNumber}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-cyan/10 border border-brand-cyan/20 rounded-sm font-mono text-[10px] text-brand-cyan">
                          <Package className="w-3 h-3" />
                          {segment.packetId}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-on-surface-variant">{formatDate(segment.startTime)}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-on-surface-variant">{formatDate(segment.endTime)}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-emerald-400">
                        {Math.round((new Date(segment.endTime).getTime() - new Date(segment.startTime).getTime()) / 1000)}s
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
            <span className="font-mono text-[10px] text-on-surface-variant">
              Page {page}
            </span>
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

              {/* Start Time – date, time, ms */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                  Start Time
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    required
                    value={formData.startTimeDate}
                    onChange={e => setFormData(d => ({ ...d, startTimeDate: e.target.value }))}
                    className="flex-1 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-2 py-2 text-sm rounded-sm outline-none"
                  />
                  <input
                    type="time"
                    step="1"
                    required
                    value={formData.startTimeTime}
                    onChange={e => setFormData(d => ({ ...d, startTimeTime: e.target.value }))}
                    className="w-24 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-2 py-2 text-sm rounded-sm outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    max="999"
                    placeholder="ms"
                    value={formData.startTimeMs}
                    onChange={e => setFormData(d => ({ ...d, startTimeMs: e.target.value }))}
                    className="w-16 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-2 py-2 text-sm rounded-sm outline-none"
                  />
                </div>
              </div>

              {/* End Time – date, time, ms */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                  End Time
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    required
                    value={formData.endTimeDate}
                    onChange={e => setFormData(d => ({ ...d, endTimeDate: e.target.value }))}
                    className="flex-1 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-2 py-2 text-sm rounded-sm outline-none"
                  />
                  <input
                    type="time"
                    step="1"
                    required
                    value={formData.endTimeTime}
                    onChange={e => setFormData(d => ({ ...d, endTimeTime: e.target.value }))}
                    className="w-24 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-2 py-2 text-sm rounded-sm outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    max="999"
                    placeholder="ms"
                    value={formData.endTimeMs}
                    onChange={e => setFormData(d => ({ ...d, endTimeMs: e.target.value }))}
                    className="w-16 bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-2 py-2 text-sm rounded-sm outline-none"
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
    </div>
  );
}
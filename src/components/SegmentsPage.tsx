import { useState, useEffect } from 'react';
import {
  Layers, Plus, Pencil, Trash2, AlertCircle, CheckCircle,
  RefreshCw, X, ChevronLeft, ChevronRight, Package
} from 'lucide-react';
import type { Segment, SegmentCreateDto, SegmentUpdateDto, ApiResponse, User } from '../types';

const getAuthHeaders = () => {
  const token = localStorage.getItem('skyguard-access-token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

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
  const [formData, setFormData] = useState<SegmentCreateDto>({
    segmentNumber: 1,
    packetId: 1,
    startTime: '',
    endTime: '',
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
        // Handle both raw object and { data: {...} } response structures
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
      
      const raw = await res.json();
      // API returns a raw array, not { data: [...] }
      const items = Array.isArray(raw) ? raw : (raw.data ?? []);
      
      // Normalize segmentID -> id if the type still uses `id`
      const normalized = items.map((s: any) => ({
        ...s,
        id: s.segmentID ?? s.id,
      }));

      setSegments(normalized);
      setHasMore(normalized.length === 10);
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
    setFormData({
      segmentNumber: 1,
      packetId: 1,
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    });
    setShowModal(true);
  };

  const openEdit = (segment: Segment) => {
    setEditingSegment(segment);
    setFormData({
      segmentNumber: segment.segmentNumber,
      packetId: segment.packetId,
      startTime: segment.startTime.slice(0, 16),
      endTime: segment.endTime.slice(0, 16),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      };

      if (editingSegment) {
        const updatePayload: SegmentUpdateDto = {};
        if (payload.segmentNumber !== undefined) updatePayload.segmentNumber = payload.segmentNumber;
        if (payload.packetId !== undefined) updatePayload.packetId = payload.packetId;
        if (payload.startTime) updatePayload.startTime = payload.startTime;
        if (payload.endTime) updatePayload.endTime = payload.endTime;

        const res = await fetch(`/api/Segments/${editingSegment.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updatePayload),
        });
        if (!res.ok) throw new Error('Failed to update segment');
        setSuccess('Segment updated successfully');
      } else {
        const res = await fetch('/api/Segments', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
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
                disabled={page === 1}
                className="p-1.5 border border-white/10 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan/30 disabled:opacity-30 rounded-sm transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={e => setFormData(d => ({ ...d, startTime: e.target.value }))}
                    className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endTime}
                    onChange={e => setFormData(d => ({ ...d, endTime: e.target.value }))}
                    className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none transition-all"
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
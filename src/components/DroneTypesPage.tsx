import { useState, useEffect } from 'react';
import { Plane, Plus, RefreshCw, AlertCircle, CheckCircle, X, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const getAuthHeaders = () => {
  const token = localStorage.getItem('skyguard-access-token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

export default function DroneTypesPage() {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', manufacturer: '', frequencyRange: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  // Role state
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

  const fetchTypes = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/Dronetype?pagenum=${pageNum}`, { headers: getAuthHeaders() });
      const raw = await res.json();
      const wrapper = Array.isArray(raw) ? raw[0] : raw;
      const items = wrapper?.responses ?? [];
      // API returns "hassnextpage" with double s
      const next = wrapper?.hassnextpage ?? false;
      const norm = items.map((t: any) => ({
        ...t,
        id: t.id ?? t.droneTypeID ?? t.droneTypeId,
      }));
      setTypes(norm);
      setHasMore(next);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchCurrentUser(); }, []);
  useEffect(() => { fetchTypes(page); }, [page]);

  const openCreate = () => {
    if (!canModify) return;
    setEditing(null); setForm({ name: '', manufacturer: '', frequencyRange: '', notes: '' }); setShowModal(true);
  };

  const openEdit = (t: any) => {
    if (!canModify) return;
    setEditing(t); setForm({ name: t.name, manufacturer: t.manufacturer || '', frequencyRange: t.frequencyRange || '', notes: t.notes || '' }); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify) return;
    setSubmitting(true);
    try {
      const url = editing ? `/api/Dronetype/${editing.id}` : '/api/Dronetype';
      const method = editing ? 'PUT' : 'POST';
      const res = await authFetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Failed to save drone type');
      setSuccess(editing ? 'Drone type updated' : 'Drone type created');
      setShowModal(false);
      fetchTypes(page);
    } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!canModify) return;
    if (!confirm('Delete drone type?')) return;
    try {
      await authFetch(`/api/Dronetype/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      setSuccess('Drone type deleted');
      fetchTypes(page);
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="w-full relative py-20 min-h-[95vh]">
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-16 space-y-6 relative z-10">

        <div className="bg-brand-slate/40 p-5 border border-white/5 rounded-sm flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Plane className="w-5 h-5 text-brand-cyan" /> Drone Types Management
          </h1>
          <div className="flex gap-3">
            <button onClick={() => fetchTypes(page)} disabled={loading} className="flex items-center gap-2 px-4 py-2 border border-white/10 text-slate-400 hover:text-brand-cyan font-mono text-xs uppercase rounded-sm disabled:opacity-30 disabled:cursor-not-allowed">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            {canModify && (
              <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-cyan text-brand-bg hover:bg-brand-cyan-light font-mono text-xs uppercase font-bold rounded-sm"><Plus className="w-3.5 h-3.5" /> Add Drone Type</button>
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
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Name</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Manufacturer</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Freq. Range</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="text-center p-8 animate-pulse text-slate-500">Loading...</td></tr> :
                 types.length === 0 ? <tr><td colSpan={5} className="text-center p-8 text-slate-500">No drone types found</td></tr> :
                 types.map(t => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-brand-cyan/5 group">
                    <td className="px-4 py-3 font-mono text-xs text-brand-cyan">#{t.id}</td>
                    <td className="px-4 py-3 text-xs text-white">{t.name}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{t.manufacturer || 'N/A'}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{t.frequencyRange || 'N/A'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100">
                        {canModify && (
                          <>
                            <button onClick={() => openEdit(t)} className="p-1.5 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10 rounded-sm"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDelete(t.id)} className="p-1.5 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                 ))
                }
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

      {showModal && canModify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-brand-slate border border-white/10 rounded-sm w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="font-display text-lg font-bold text-white">{editing ? 'Edit Drone Type' : 'Create Drone Type'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">Manufacturer</label>
                <input type="text" value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">Frequency Range</label>
                <input type="text" value={form.frequencyRange} onChange={e => setForm({...form, frequencyRange: e.target.value})} className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1 min-h-[80px]" />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-white/10 text-slate-400 font-mono text-xs uppercase rounded-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-cyan text-brand-bg hover:bg-brand-cyan-light font-mono text-xs uppercase font-bold rounded-sm disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
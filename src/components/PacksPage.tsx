import { useState, useEffect } from 'react';
import { Package, Plus, RefreshCw, AlertCircle, CheckCircle, X, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const getAuthHeaders = () => {
  const token = localStorage.getItem('skyguard-access-token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
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
  const [form, setForm] = useState({ packetName: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchPacks = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/Packs?pagenum=${pageNum}`, { headers: getAuthHeaders() });
      const raw = await res.json();
      const items = Array.isArray(raw) ? raw : (raw.data || []);
      const norm = items.map((p: any) => ({ ...p, id: p.id ?? p.packetID ?? p.packID }));
      setPacks(norm);
      setHasMore(norm.length === 20);
    } catch (err: any) { setError(err.message); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPacks(page); }, [page]);

  const openCreate = () => { setEditing(null); setForm({ packetName: '', description: '' }); setShowModal(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ packetName: p.packetName || p.name, description: p.description || '' }); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editing ? `/api/Packs/${editing.id}` : '/api/Packs';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Failed to save pack');
      setSuccess(editing ? 'Pack updated' : 'Pack created');
      setShowModal(false);
      fetchPacks(page);
    } catch (e: any) { setError(e.message); } 
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete pack?')) return;
    try {
      await fetch(`/api/Packs/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      setSuccess('Pack deleted');
      fetchPacks(page);
    } catch (e: any) { setError(e.message); }
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
            <button onClick={() => fetchPacks(page)} className="flex items-center gap-2 px-4 py-2 border border-white/10 text-slate-400 hover:text-brand-cyan font-mono text-xs uppercase rounded-sm"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
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
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Name</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Description</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] uppercase text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={4} className="text-center p-8 animate-pulse">Loading...</td></tr> :
                 packs.length === 0 ? <tr><td colSpan={4} className="text-center p-8 text-slate-500">No packs found</td></tr> :
                 packs.map(p => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-brand-cyan/5 group">
                    <td className="px-4 py-3 font-mono text-xs text-brand-cyan">#{p.id}</td>
                    <td className="px-4 py-3 text-xs text-white">{p.packetName || p.name}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{p.description || 'N/A'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100">
                        <button onClick={() => openEdit(p)} className="p-1.5 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10 rounded-sm"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-sm"><Trash2 className="w-3.5 h-3.5" /></button>
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
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 border border-white/10 rounded-sm disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => p + 1)} disabled={!hasMore} className="p-1.5 border border-white/10 rounded-sm disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-brand-slate border border-white/10 rounded-sm w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="font-display text-lg font-bold text-white">{editing ? 'Edit Pack' : 'Create Pack'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">Pack Name</label>
                <input type="text" required value={form.packetName} onChange={e => setForm({...form, packetName: e.target.value})} className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">Description</label>
                <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1 min-h-[80px]" />
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
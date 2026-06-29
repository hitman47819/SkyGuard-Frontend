import { useState, useEffect, useRef } from 'react';
import { Cpu, RefreshCw, AlertCircle, CheckCircle, Trash2, ChevronLeft, ChevronRight, Eye, Plus, Pencil, Upload, Loader2 } from 'lucide-react';

const getAuthHeaders = () => {
  const token = localStorage.getItem('skyguard-access-token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

const getAuthHeadersNoContentType = () => {
  const token = localStorage.getItem('skyguard-access-token');
  return { Authorization: `Bearer ${token}` };
};

const safeArray = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw;
  if (raw?.data && Array.isArray(raw.data)) return raw.data;
  if (raw?.responses && Array.isArray(raw.responses)) return raw.responses;
  return [];
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

const emptyForm = {
  segmentId: '',
  detectionId: '',
  droneTypeId: '',
  confidence: '100',
  summary: '',
  annotationImageUrl: '',
  annotationImagePublicId: '',
  modelVersion: '',
};

export default function AIResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Current user role (default 3 – Analytics)
  const [userRole, setUserRole] = useState<number>(3);

  // authFetch current user role
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
    } catch {
      /* silent */
    }
  };

  const fetchResults = async (pageNum: number = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`/api/AIResult?pagenum=${pageNum}`, { headers: getAuthHeaders() });
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

  useEffect(() => {
    fetchCurrentUser(); // get role on mount
  }, []);

  useEffect(() => { fetchResults(page); }, [page]);

  const canModify = userRole !== 3; // Super(1) & Admin(2) can modify

  const openCreate = () => {
    if (!canModify) return;
    setEditing(null);
    setForm({ ...emptyForm });
    clearFileSelection();
    setShowModal(true);
  };

  const openEdit = async (e: React.MouseEvent, r: any) => {
    e.stopPropagation();
    if (!canModify) return;
    setDetailLoading(true);
    try {
      const res = await authFetch(`/api/AIResult/id?id=${r.id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to authFetch result');
      const raw = await res.json();
      const data = raw.data ? raw.data : raw;
      setEditing(data);
      setForm({
        segmentId: String(data.segmentId ?? ''),
        detectionId: String(data.detectionId ?? ''),
        droneTypeId: String(data.droneTypeId ?? ''),
        confidence: data.confidence != null ? String(data.confidence) : '100',
        summary: data.summary ?? '',
        annotationImageUrl: data.annotationImageUrl ?? '',
        annotationImagePublicId: data.annotationImagePublicId ?? '',
        modelVersion: data.modelVersion ?? '',
      });
      clearFileSelection();
      if (data.annotationImageUrl) setFilePreview(data.annotationImageUrl);
      setShowModal(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetail = async (r: any) => {
    setShowDetail(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await authFetch(`/api/AIResult/id?id=${r.id}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const raw = await res.json();
        setDetailData(raw.data ? raw.data : raw);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFilePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (id: number, file: File, method: 'POST' | 'PUT') => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('Image', file);
      const res = await authFetch(`/api/AIResult/upload-image?id=${id}`, {
        method,
        headers: getAuthHeadersNoContentType(),
        body: formData,
      });
      if (!res.ok) throw new Error('Image upload failed');
      return await res.text();
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        segmentId: Number(form.segmentId) || 0,
        detectionId: Number(form.detectionId) || 0,
        droneTypeId: Number(form.droneTypeId) || 0,
        confidence: Number(form.confidence) || 0,
        summary: form.summary || undefined,
        annotationImageUrl: form.annotationImageUrl || undefined,
        annotationImagePublicId: form.annotationImagePublicId || undefined,
        modelVersion: form.modelVersion || undefined,
      };

      let resultId: number;

      if (editing) {
        const { segmentId: _, detectionId: __, ...updatePayload } = payload;
        const res = await authFetch(`/api/AIResult/id?id=${editing.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updatePayload),
        });
        if (!res.ok) throw new Error('Failed to update AI result');
        resultId = editing.id;
      } else {
        const res = await authFetch('/api/AIResult', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create AI result');
        const data = await res.json();
        const created = data.data ? data.data : data;
        resultId = created.id;
      }

      if (selectedFile && resultId) {
        const method = editing ? 'PUT' : 'POST';
        await uploadImage(resultId, selectedFile, method);
      }

      setSuccess(editing ? 'AI result updated' : 'AI result created');
      setShowModal(false);
      fetchResults(page);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canModify) return;
    if (!window.confirm('Delete this AI result?')) return;
    try {
      const res = await authFetch(`/api/AIResult/id?id=${id}`, { method: 'DELETE', headers: getAuthHeaders() });
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
          <div className="flex gap-3">
            <button onClick={() => fetchResults(page)} disabled={loading} className="flex items-center gap-2 px-4 py-2 border border-white/10 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan/30 font-mono text-xs uppercase rounded-sm disabled:opacity-30 disabled:cursor-not-allowed">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            {canModify && (
              <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-cyan text-brand-bg hover:bg-brand-cyan-light font-mono text-xs uppercase font-bold rounded-sm">
                <Plus className="w-3.5 h-3.5" /> Add Result
              </button>
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
                    <tr key={r.id} className="border-b border-white/5 hover:bg-brand-cyan/5 group cursor-pointer" onClick={() => openDetail(r)}>
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
                          <img src={r.annotationImageUrl} alt="annotation" className="w-12 h-8 object-cover rounded-sm border border-white/10 cursor-pointer hover:border-brand-cyan/50 transition-colors" onClick={(e) => { e.stopPropagation(); setPreviewImg(r.annotationImageUrl); }} />
                        ) : (
                          <span className="text-[10px] text-slate-600">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100">
                          {r.annotationImageUrl && (
                            <button onClick={(e) => { e.stopPropagation(); setPreviewImg(r.annotationImageUrl); }} className="p-1.5 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10 rounded-sm"><Eye className="w-3.5 h-3.5" /></button>
                          )}
                          {canModify && (
                            <>
                              <button onClick={(e) => openEdit(e, r)} className="p-1.5 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10 rounded-sm"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={(e) => handleDelete(r.id, e)} className="p-1.5 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                          )}
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

      {/* Create / Edit Modal (only for allowed roles) */}
      {showModal && canModify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-brand-slate border border-white/10 rounded-sm w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
              <h2 className="font-display text-lg font-bold text-white">{editing ? 'Edit AI Result' : 'Create AI Result'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><span className="text-xl leading-none">&times;</span></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase text-on-surface-variant">Segment ID</label>
                  <input
                    type="number"
                    value={form.segmentId}
                    onChange={e => setForm({ ...form, segmentId: e.target.value })}
                    disabled={!!editing}
                    className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-on-surface-variant">Detection ID</label>
                  <input
                    type="number"
                    value={form.detectionId}
                    onChange={e => setForm({ ...form, detectionId: e.target.value })}
                    disabled={!!editing}
                    className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase text-on-surface-variant">Drone Type ID</label>
                  <input
                    type="number"
                    value={form.droneTypeId}
                    onChange={e => setForm({ ...form, droneTypeId: e.target.value })}
                    className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-on-surface-variant">Confidence</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.confidence}
                    onChange={e => setForm({ ...form, confidence: e.target.value })}
                    className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">Model Version</label>
                <input
                  type="text"
                  value={form.modelVersion}
                  onChange={e => setForm({ ...form, modelVersion: e.target.value })}
                  className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1"
                  placeholder="e.g. v2.1.0"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">Summary</label>
                <textarea
                  value={form.summary}
                  onChange={e => setForm({ ...form, summary: e.target.value })}
                  className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none mt-1 min-h-[80px]"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-on-surface-variant">Annotation Image</label>
                <div className="mt-1 space-y-3">
                  {filePreview && (
                    <div className="relative w-40 h-28 rounded-sm border border-white/10 overflow-hidden">
                      <img src={filePreview} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={clearFileSelection}
                        className="absolute top-1 right-1 p-1 bg-black/70 rounded-full text-slate-400 hover:text-white"
                      >
                        <span className="text-xs leading-none">&times;</span>
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 border border-dashed border-white/20 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan/40 font-mono text-xs rounded-sm transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {selectedFile ? selectedFile.name : 'Choose Image'}
                    </button>
                    {selectedFile && (
                      <span className="text-[10px] text-brand-cyan font-mono">Selected</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-white/10 text-slate-400 font-mono text-xs uppercase rounded-sm">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="px-4 py-2 bg-brand-cyan text-brand-bg hover:bg-brand-cyan-light font-mono text-xs uppercase font-bold rounded-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {(submitting || uploading) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {uploading ? 'Uploading...' : submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal (always available) */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowDetail(false)}>
          <div className="bg-brand-slate border border-white/10 rounded-sm w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-brand-cyan" /> AI Result #{detailData?.id}
              </h2>
              <button onClick={() => setShowDetail(false)} className="text-slate-400 hover:text-white"><span className="text-xl leading-none">&times;</span></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {detailLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </div>
              ) : detailData ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Segment</span>
                      <span className="text-sm text-white font-mono">#{detailData.segmentId ?? 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Detection</span>
                      <span className="text-sm text-white">{detailData.detectionName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Drone Type</span>
                      <span className="text-sm text-white">{detailData.droneTypeName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Confidence</span>
                      <span className={`text-sm font-mono font-bold ${confColor(detailData.confidence ?? 0)}`}>
                        {detailData.confidence != null ? detailData.confidence.toFixed(1) : '0.0'}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Model Version</span>
                      <span className="text-sm text-white font-mono">{detailData.modelVersion || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Processed At</span>
                      <span className="text-sm text-on-surface-variant font-mono">{fmtDate(detailData.processedAt)}</span>
                    </div>
                  </div>

                  {detailData.summary && (
                    <div>
                      <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Summary</span>
                      <p className="text-sm text-on-surface-variant mt-1 leading-relaxed bg-brand-bg/50 border border-white/5 rounded-sm p-3">{detailData.summary}</p>
                    </div>
                  )}

                  {detailData.annotationImageUrl && (
                    <div>
                      <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Annotation Image</span>
                      <img
                        src={detailData.annotationImageUrl}
                        alt="Annotation"
                        className="mt-1 max-w-full max-h-[400px] object-contain rounded-sm border border-white/10 cursor-pointer hover:border-brand-cyan/40 transition-colors"
                        onClick={() => setPreviewImg(detailData.annotationImageUrl)}
                      />
                      {detailData.annotationImagePublicId && (
                        <p className="font-mono text-[9px] text-slate-600 mt-1">Public ID: {detailData.annotationImagePublicId}</p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                    <div>
                      <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Created At</span>
                      <span className="text-sm text-on-surface-variant font-mono">{fmtDate(detailData.createdAt)}</span>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Public Image ID</span>
                      <span className="text-sm text-on-surface-variant font-mono">{detailData.annotationImagePublicId || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-sm">Failed to load details.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {previewImg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewImg(null)} className="absolute -top-3 -right-3 z-10 p-1.5 bg-brand-slate border border-white/10 rounded-full text-slate-400 hover:text-white">
              <span className="text-lg leading-none">&times;</span>
            </button>
            <img src={previewImg} alt="Annotation preview" className="max-w-full max-h-[85vh] rounded-sm border border-white/10 shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
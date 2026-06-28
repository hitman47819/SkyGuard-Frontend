import { useState, useEffect } from 'react';
import {
  Users, Pencil, Trash2, Shield, User, Eye,
  AlertCircle, CheckCircle, RefreshCw, X, ChevronLeft, ChevronRight,
  Crown, UserPlus
} from 'lucide-react';
import type { User as UserType, UpdateUserRequest } from '../types';
import InviteUserPage from './InviteUserPage';

const getAuthHeaders = () => {
  const token = localStorage.getItem('skyguard-access-token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const ROLE_CONFIG = {
  1: { label: 'Super', icon: Crown, color: '#F59E0B', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
  2: { label: 'Admin', icon: Shield, color: '#6366F1', bg: 'bg-brand-cyan/10', border: 'border-brand-cyan/20', text: 'text-brand-cyan' },
  3: { label: 'Analytics', icon: Eye, color: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
};

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserRequest>({});
  const [submitting, setSubmitting] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);

  const isSuper = currentUser?.userrole === 1;
  const isAdmin = currentUser?.userrole === 2;

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('skyguard-access-token');
      if (!token) return;
      const res = await fetch('/api/Users/me', {
        headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.data ? data.data : data);
      }
    } catch { /* silent */ }
  };

  const fetchUsers = async (pageNum: number = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/Users?pagenum=${pageNum}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);

      const raw = await res.json();
      const items: UserType[] = Array.isArray(raw) ? raw : (raw.data || []);

      const normalized = items.map((u: any) => ({
        ...u,
        id: u.userID ?? u.id,
      }));

      setUsers(normalized);
      setHasMore(normalized.length === 10);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers(page);
  }, [page]);

  const openEdit = (user: UserType) => {
    setEditingUser(user);
    setEditForm({
      userFirstName: user.userFirstName,
      userLastName: user.userLastName,
      userEmail: user.userEmail,
      userPhone: user.userPhone,
    });
    setShowModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/Users/${editingUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Failed to update user');
      setSuccess('User updated successfully');
      setShowModal(false);
      fetchUsers(page);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/Users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete user');
      setSuccess('User deleted successfully');
      fetchUsers(page);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const pageTitle = isSuper ? 'Admin Management' : isAdmin ? 'Analytics User Management' : 'Users';
  const pageSubtitle = isSuper
    ? 'Manage administrator accounts across the system.'
    : isAdmin
      ? 'Manage analytics user accounts.'
      : '';

  return (
    <div className="w-full relative py-20 min-h-[95vh]">
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-16 space-y-6 relative z-10">
        {/* Header */}
        <div className="bg-brand-slate/40 p-5 border border-white/5 rounded-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-cyan" />
                {pageTitle}
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">{pageSubtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchUsers(page)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-white/10 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan/30 transition-all font-mono text-xs uppercase tracking-wider rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {(isSuper || isAdmin) && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-cyan text-brand-bg hover:bg-brand-cyan-light transition-all font-mono text-xs uppercase tracking-wider font-bold rounded-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Invite User
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

        {/* Users Table */}
        <div className="bg-brand-slate/40 border border-white/5 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-brand-bg/50">
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">User</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Email</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Phone</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Role</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 bg-white/5 rounded animate-pulse w-20"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-on-surface-variant text-sm">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      {isSuper ? 'No admin users found' : isAdmin ? 'No analytics users found' : 'No users to display'}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const roleConfig = ROLE_CONFIG[u.userrole as keyof typeof ROLE_CONFIG];
                    const RoleIcon = roleConfig?.icon || User;
                    return (
                      <tr
                        key={u.id}
                        className="border-b border-white/5 hover:bg-brand-cyan/5 transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-brand-cyan" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{u.userFirstName} {u.userLastName}</p>
                              <p className="text-[10px] font-mono text-on-surface-variant">ID: {u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-on-surface-variant">{u.userEmail}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-on-surface-variant">{u.userPhone}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${roleConfig?.bg} ${roleConfig?.border} border rounded-sm font-mono text-[10px] ${roleConfig?.text} font-bold`}>
                            <RoleIcon className="w-3 h-3" />
                            {roleConfig?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEdit(u)}
                              className="p-1.5 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10 rounded-sm transition-all"
                              title="Edit user"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="p-1.5 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-sm transition-all"
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
                className="p-1.5 border border-white/10 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan/30 disabled:opacity-30 disabled:cursor-not-allowed rounded-sm transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore || loading}
                className="p-1.5 border border-white/10 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan/30 disabled:opacity-30 disabled:cursor-not-allowed rounded-sm transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-brand-slate border border-white/10 rounded-sm w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-brand-cyan" />
                Edit User
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.userFirstName || ''}
                    onChange={e => setEditForm(f => ({ ...f, userFirstName: e.target.value }))}
                    className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.userLastName || ''}
                    onChange={e => setEditForm(f => ({ ...f, userLastName: e.target.value }))}
                    className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={editForm.userEmail || ''}
                  onChange={e => setEditForm(f => ({ ...f, userEmail: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                  Phone
                </label>
                <input
                  type="tel"
                  required
                  value={editForm.userPhone || ''}
                  onChange={e => setEditForm(f => ({ ...f, userPhone: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-white px-3 py-2.5 text-sm rounded-sm outline-none transition-all"
                />
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
                  {submitting ? 'Saving...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={() => setShowInviteModal(false)}>
          <div className="w-full max-w-2xl my-8 relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 z-50 p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <InviteUserPage
              userRole={currentUser?.userrole || 3}
              onInviteSent={() => {
                setShowInviteModal(false);
                fetchUsers(page);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
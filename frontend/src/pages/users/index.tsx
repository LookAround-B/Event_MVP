import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Pencil, Trash2, Plus, Search, Check, Clock, Download,
  Shield, ShieldCheck, X, Users as UsersIcon,
  AlertCircle, Save, UserCheck, UserX,
} from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import ConfirmModal from '@/components/ConfirmModal';
import AuditPagination from '@/components/AuditPagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';

// Shared input class that stays visible inside dark modals
const INPUT_CLS = "w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/15 placeholder:text-white/30 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all";

interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  role?: string;
  isApproved?: boolean;
  isActive?: boolean;
  profileComplete?: boolean;
  createdAt: string;
}

interface Role { id: string; name: string; }

const ROLE_COLORS: Record<string, string> = {
  admin:  'bg-purple-500/15 text-purple-400 border-purple-500/25',
  club:   'bg-blue-500/15 text-blue-400 border-blue-500/25',
  rider:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
};

function RoleBadge({ role }: { role?: string }) {
  const r = role?.toLowerCase() ?? 'rider';
  const cls = ROLE_COLORS[r] ?? 'bg-surface-container text-on-surface-variant border-border/30';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {role || 'rider'}
    </span>
  );
}

function UserAvatar({ user }: { user: User }) {
  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase();
  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 border border-primary/20"
      style={{ background: 'hsl(var(--primary)/0.12)', color: 'hsl(var(--primary))' }}
    >
      {initials}
    </div>
  );
}

// ─── Inline Edit Modal ───────────────────────────────────────────────────────
interface EditModalProps {
  user: User;
  roles: Role[];
  onClose: () => void;
  onSaved: (updated: User) => void;
}

function EditModal({ user, roles, onClose, onSaved }: EditModalProps) {
  const [form, setForm] = useState({
    firstName: user.firstName ?? user.name.split(' ')[0] ?? '',
    lastName:  user.lastName  ?? user.name.split(' ').slice(1).join(' ') ?? '',
    phone:     user.phone     ?? '',
    gender:    user.gender    ?? '',
    role:      user.role      ?? '',
    isActive:  user.isActive  ?? true,
    isApproved: user.isApproved ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // Update basic fields
      await api.put(`/api/users/${user.id}`, {
        firstName: form.firstName,
        lastName:  form.lastName,
        phone:     form.phone,
        gender:    form.gender,
        isActive:  form.isActive,
        isApproved: form.isApproved,
      });

      // Update role if changed
      if (form.role && form.role !== user.role) {
        const targetRole = roles.find(r => r.name === form.role);
        if (targetRole) {
          await api.put(`/api/users/${user.id}/roles`, { roleId: targetRole.id });
        }
      }

      onSaved({
        ...user,
        firstName:  form.firstName,
        lastName:   form.lastName,
        name:       `${form.firstName} ${form.lastName}`.trim(),
        phone:      form.phone,
        gender:     form.gender,
        role:       form.role,
        isActive:   form.isActive,
        isApproved: form.isApproved,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border/40 shadow-2xl"
        style={{ background: 'hsl(var(--surface-container))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/20">
          <div className="flex items-center gap-3">
            <UserAvatar user={user} />
            <div>
              <p className="font-bold text-on-surface text-sm">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-bright text-muted-foreground hover:text-on-surface transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">First Name</label>
              <input
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Last Name</label>
              <input
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Phone</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className={INPUT_CLS}
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Gender</label>
              <Select value={form.gender || '__none__'} onValueChange={v => setForm(f => ({ ...f, gender: v === '__none__' ? '' : v }))}>
                <SelectTrigger className="bg-surface-container/50 border-border/30 text-sm h-10">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Not set</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Role</label>
            <Select value={form.role || '__none__'} onValueChange={v => setForm(f => ({ ...f, role: v === '__none__' ? '' : v }))}>
              <SelectTrigger className="bg-surface-container/50 border-border/30 text-sm h-10">
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No role</SelectItem>
                {roles.map(r => (
                  <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, isApproved: !f.isApproved }))}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                form.isApproved
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
              }`}
            >
              {form.isApproved ? <UserCheck className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              {form.isApproved ? 'Approved' : 'Pending'}
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                form.isActive
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {form.isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
              {form.isActive ? 'Active' : 'Inactive'}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-5 pt-0">
          <button onClick={onClose} className="btn btn-secondary flex-1 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create User Modal ────────────────────────────────────────────────────────
interface CreateModalProps {
  roles: Role[];
  onClose: () => void;
  onCreated: (user: User) => void;
}

const EMPTY_FORM = { email: '', password: '', firstName: '', lastName: '', gender: '', roleId: '' };

function CreateUserModal({ roles, onClose, onCreated }: CreateModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  // Reset autofill
  useEffect(() => {
    const t = setTimeout(() => { setForm(EMPTY_FORM); if (emailRef.current) emailRef.current.value = ''; }, 150);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      setError('Email, password, first name and last name are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/api/users', form);
      const created: User = {
        id: res.data?.id ?? res.data?.data?.id ?? '',
        email: form.email,
        name: `${form.firstName} ${form.lastName}`.trim(),
        firstName: form.firstName,
        lastName: form.lastName,
        role: roles.find(r => r.id === form.roleId)?.name ?? '',
        isApproved: false,
        isActive: true,
        profileComplete: false,
        createdAt: new Date().toISOString(),
      };
      onCreated(created);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl"
        style={{ background: 'hsl(var(--surface-container))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="font-bold text-on-surface">Create New User</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Add a new admin, club, or rider account</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-muted-foreground hover:text-on-surface transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 space-y-4">
          {/* Hidden honeypot to block autofill */}
          <div className="hidden">
            <input type="text" name="fake-user" autoComplete="username" tabIndex={-1} />
            <input type="password" name="fake-pass" autoComplete="current-password" tabIndex={-1} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email *</label>
            <input ref={emailRef} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className={INPUT_CLS} placeholder="user@example.com" autoComplete="off" required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Password *</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className={INPUT_CLS} placeholder="Min. 8 characters" autoComplete="new-password" required minLength={8} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">First Name *</label>
              <input type="text" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                className={INPUT_CLS} placeholder="First name" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Last Name *</label>
              <input type="text" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                className={INPUT_CLS} placeholder="Last name" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Gender</label>
              <Select value={form.gender || '__none__'} onValueChange={v => setForm(f => ({ ...f, gender: v === '__none__' ? '' : v }))}>
                <SelectTrigger className="bg-white/5 border-white/15 text-white text-sm h-9 focus:border-primary/60">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Not specified</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Role</label>
              <Select value={form.roleId || '__none__'} onValueChange={v => setForm(f => ({ ...f, roleId: v === '__none__' ? '' : v }))}>
                <SelectTrigger className="bg-white/5 border-white/15 text-white text-sm h-9 focus:border-primary/60">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No role</SelectItem>
                  {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="btn btn-secondary flex-1 text-sm">Cancel</button>
          <button onClick={() => handleSubmit()} disabled={saving} className="btn btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const ROLE_TABS = ['All', 'Pending', 'Admin', 'Club', 'Rider'] as const;
type RoleTab = typeof ROLE_TABS[number];

export default function Users() {
  const { isAdmin } = useAuth();

  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [activeTab, setActiveTab] = useState<RoleTab>('All');
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0, limit: 15, page: 1 });
  const [approving, setApproving]   = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<User | null>(null);
  const [editTarget, setEditTarget]       = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<User | null>(null);
  const [showCreate, setShowCreate]       = useState(false);
  const [roles, setRoles]       = useState<Role[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Derived filter from tab
  const roleFilter   = activeTab === 'All' || activeTab === 'Pending' ? '' : activeTab.toLowerCase();
  const statusFilter = activeTab === 'Pending' ? 'pending' : '';

  useEffect(() => {
    api.get('/api/settings/roles').then(r => setRoles(r.data.data || [])).catch(() => {});
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(search     && { search }),
        ...(roleFilter   && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await api.get(`/api/users?${params}`);
      setUsers(res.data.data || []);
      setPagination(res.data.pagination);
      setError(null);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Reset page when tab/search changes
  useEffect(() => { setPage(1); }, [activeTab, search]);

  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      setApproving(approveTarget.id);
      await api.post('/api/admin/approve-user', { userId: approveTarget.id });
      setUsers(us => us.map(u => u.id === approveTarget.id ? { ...u, isApproved: true } : u));
    } catch (err: any) {
      if (err.response?.data?.message === 'User is already approved') fetchUsers();
    } finally {
      setApproving(null);
      setApproveTarget(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/users/${deleteTarget.id}`);
      setUsers(us => us.filter(u => u.id !== deleteTarget.id));
      setSelectedUsers(sel => sel.filter(id => id !== deleteTarget.id));
    } catch {
      alert('Failed to delete user');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ format: 'csv', ...(search && { search }), ...(roleFilter && { role: roleFilter }) });
      const res = await api.get(`/api/users?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      Object.assign(document.createElement('a'), { href: url, download: 'users.csv' }).click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Failed to export'); }
  };

  const toggleSelectAll = () =>
    setSelectedUsers(s => s.length === users.length ? [] : users.map(u => u.id));
  const toggleSelect = (id: string) =>
    setSelectedUsers(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  // Tab counts based on current page data (server handles filtering)
  const pendingCount = users.filter(u => !u.isApproved).length;

  return (
    <ProtectedRoute>
      <Head><title>Users | Equestrian Events</title></Head>
      <BoneyardSkeleton name="users-page" loading={false}>
      <div className="animate-fade-in max-w-[1600px] mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl">
              User <span className="gradient-text">Directory</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage accounts, roles, and access permissions across the platform.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="btn btn-secondary flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={() => setShowCreate(true)} className="btn btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Users', value: pagination.total, color: 'text-primary', bg: 'bg-primary/8' },
            { label: 'Pending Approval', value: users.filter(u => !u.isApproved).length, color: 'text-yellow-400', bg: 'bg-yellow-500/8' },
            { label: 'Approved', value: users.filter(u => u.isApproved).length, color: 'text-emerald-400', bg: 'bg-emerald-500/8' },
            { label: 'Profile Incomplete', value: users.filter(u => !u.profileComplete).length, color: 'text-orange-400', bg: 'bg-orange-500/8' },
          ].map(s => (
            <div key={s.label} className={`bento-card px-4 py-3 flex items-center gap-3 ${s.bg}`}>
              <div>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Role Tabs + Search ── */}
        <div className="bento-card p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Role tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container/60 border border-border/20">
              {ROLE_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:text-on-surface hover:bg-surface-bright'
                  }`}
                >
                  {tab}
                  {tab === 'Pending' && pendingCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-yellow-500/20 text-yellow-400">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface-container/50 border border-border/30 rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
              />
            </div>

            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-muted-foreground hover:text-on-surface flex items-center gap-1">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Bulk selection bar ── */}
        {selectedUsers.length > 0 && isAdmin && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/30 bg-primary/5">
            <span className="text-sm font-semibold text-primary">{selectedUsers.length} selected</span>
            <button
              onClick={async () => {
                if (!window.confirm(`Approve ${selectedUsers.length} users?`)) return;
                await api.put('/api/users/bulk-update', { userIds: selectedUsers, action: 'approve' });
                setSelectedUsers([]);
                fetchUsers();
              }}
              className="btn btn-primary text-xs py-1.5 flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Approve All
            </button>
            <button onClick={() => setSelectedUsers([])} className="text-xs text-muted-foreground hover:text-on-surface">
              Cancel
            </button>
          </div>
        )}

        {error && (
          <div className="bento-card p-4 border-l-4 border-destructive text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* ── Table ── */}
        <div className="bento-card overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

          {loading ? (
            <div className="p-6 space-y-2.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-xl bg-border/20" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <UsersIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No users found</p>
              {activeTab !== 'All' && (
                <button onClick={() => setActiveTab('All')} className="mt-2 text-xs text-primary hover:underline">
                  View all users
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[860px]">
                  <thead>
                    <tr className="border-b border-border/20">
                      {isAdmin && (
                        <th className="w-10 px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === users.length && users.length > 0}
                            onChange={toggleSelectAll}
                            className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
                          />
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Profile</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Joined</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {users.map((user) => {
                      const isPending = !user.isApproved;
                      const isSelected = selectedUsers.includes(user.id);
                      return (
                        <tr
                          key={user.id}
                          className={`group transition-colors ${
                            isPending
                              ? 'bg-yellow-500/[0.03] hover:bg-yellow-500/[0.06]'
                              : 'hover:bg-surface-container/40'
                          } ${isSelected ? 'bg-primary/5' : ''}`}
                        >
                          {isAdmin && (
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(user.id)}
                                className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
                              />
                            </td>
                          )}

                          {/* User cell */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              {isPending && (
                                <div className="absolute -ml-1 w-1 h-8 rounded-r-full bg-yellow-400/60" />
                              )}
                              <UserAvatar user={user} />
                              <div className="min-w-0">
                                <p className="font-semibold text-on-surface text-sm truncate">{user.name || '—'}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-4 py-3 hidden md:table-cell">
                            <p className="text-xs text-on-surface-variant">{user.phone || '—'}</p>
                            {user.gender && <p className="text-[11px] text-muted-foreground mt-0.5">{user.gender}</p>}
                          </td>

                          {/* Role */}
                          <td className="px-4 py-3">
                            <RoleBadge role={user.role} />
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/12 text-yellow-400 border border-yellow-500/20">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/12 text-emerald-400 border border-emerald-500/20">
                                <Check className="w-3 h-3" /> Approved
                              </span>
                            )}
                            {!user.isActive && (
                              <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* Profile complete */}
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className={`text-xs font-medium ${user.profileComplete ? 'text-emerald-400' : 'text-orange-400'}`}>
                              {user.profileComplete ? '✓ Complete' : '⚠ Incomplete'}
                            </span>
                          </td>

                          {/* Joined */}
                          <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                            {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Approve button — only for pending + profile complete */}
                              {isAdmin && isPending && user.profileComplete && (
                                <button
                                  onClick={() => setApproveTarget(user)}
                                  disabled={approving === user.id}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                                >
                                  {approving === user.id
                                    ? <div className="w-3 h-3 border border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin" />
                                    : <Check className="w-3 h-3" />}
                                  Approve
                                </button>
                              )}
                              {/* Incomplete warning */}
                              {isAdmin && isPending && !user.profileComplete && (
                                <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                  Profile Incomplete
                                </span>
                              )}

                              {/* Permissions */}
                              {isAdmin && (
                                <Link
                                  href={`/users/${user.id}/permissions`}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
                                  title="Manage Permissions"
                                >
                                  <Shield className="w-3.5 h-3.5" />
                                </Link>
                              )}

                              {/* Edit */}
                              <button
                                onClick={() => setEditTarget(user)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors border border-transparent hover:border-blue-500/20"
                                title="Edit User"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => setDeleteTarget(user)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-transparent hover:border-destructive/20"
                                title="Delete User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-border/10 bg-surface-container/20 px-4 py-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {pagination.total} total users
                  {activeTab !== 'All' && ` · filtered by ${activeTab}`}
                </p>
                <AuditPagination page={page} totalPages={pagination.pages} onPageChange={setPage} className="mt-0" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Approve Modal ── */}
      <ConfirmModal
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        variant="success"
        icon={ShieldCheck}
        title="Approve User Access"
        description={approveTarget ? `Approve ${approveTarget.name || approveTarget.email} and grant access to the platform.` : ''}
        confirmLabel="Approve User"
      />

      {/* ── Delete Modal ── */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        variant="danger"
        icon={Trash2}
        title="Delete User"
        description={deleteTarget ? `Permanently delete ${deleteTarget.name || deleteTarget.email}? This cannot be undone.` : ''}
        confirmLabel="Delete"
      />

      {/* ── Edit Modal ── */}
      {editTarget && (
        <EditModal
          user={editTarget}
          roles={roles}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => {
            setUsers(us => us.map(u => u.id === updated.id ? updated : u));
            setEditTarget(null);
          }}
        />
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <CreateUserModal
          roles={roles}
          onClose={() => setShowCreate(false)}
          onCreated={(created) => {
            setUsers(us => [created, ...us]);
            setShowCreate(false);
          }}
        />
      )}
      </BoneyardSkeleton>
    </ProtectedRoute>
  );
}

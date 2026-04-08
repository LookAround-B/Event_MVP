import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { Pencil, Trash2, Plus, Search, Check, Clock, Download, Shield, Filter, X, ChevronDown, UserCog, Users as UsersIcon, Activity } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import ConfirmModal from '@/components/ConfirmModal';
import AuditPagination from '@/components/AuditPagination';
import { KPICard } from '@/components/dashboard/KPICard';
import { KPIGrid } from '@/components/dashboard/KPIGrid';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  gender?: string;
  role?: string;
  isApproved?: boolean;
  isActive?: boolean;
  profileComplete?: boolean;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
}

interface UsersResponse {
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0, limit: 10, page: 1 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [bulkRoleId, setBulkRoleId] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(tokenParts[1], 'base64').toString('utf-8')
          );
          setIsAdmin(payload.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter, genderFilter, statusFilter]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/api/settings/roles');
        setRoles(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      }
    };
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(genderFilter && { gender: genderFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await api.get<UsersResponse>(`/api/users?${params}`);
      setUsers(response.data.data || []);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/api/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      setSelectedUsers(selectedUsers.filter(uid => uid !== id));
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user');
    }
  };

  const handleApprove = async (userId: string, userName: string) => {
    if (!window.confirm(`Approve user ${userName}?`)) return;

    try {
      setApproving(userId);
      await api.post(`/api/admin/approve-user`, { userId });
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isApproved: true } : u
      ));
      setApproving(null);
    } catch (err: any) {
      console.error('Failed to approve user:', err);
      alert(err.response?.data?.message || 'Failed to approve user');
      setApproving(null);
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        ...(roleFilter && { role: roleFilter }),
        ...(search && { search }),
        ...(genderFilter && { gender: genderFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const response = await api.get(`/api/users?${params}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export users:', err);
      alert('Failed to export users');
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;

    if (bulkAction === 'assignRole' && !bulkRoleId) {
      alert('Please select a role to assign');
      return;
    }

    if (!window.confirm(`Apply "${bulkAction}" to ${selectedUsers.length} selected user(s)?`)) return;

    try {
      setBulkLoading(true);
      await api.put('/api/users/bulk-update', {
        userIds: selectedUsers,
        action: bulkAction,
        ...(bulkAction === 'assignRole' && { roleId: bulkRoleId }),
      });
      setSelectedUsers([]);
      setBulkAction('');
      setBulkRoleId('');
      fetchUsers();
    } catch (err: any) {
      console.error('Bulk action failed:', err);
      alert(err.response?.data?.message || 'Bulk action failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setGenderFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const hasActiveFilters = roleFilter || genderFilter || statusFilter;

  return (
    <ProtectedRoute>
      <Head><title>Users | Equestrian Events</title></Head>
      <div className="animate-fade-in max-w-[1600px] mx-auto">

        {/* ═══ Page Header ═══ */}
        <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl lg:text-5xl">
              User <span className="gradient-text">Directory</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">Manage system users, roles, and access permissions across the platform.</p>
          </div>
        </div>

        {/* ═══ KPI Cards ═══ */}
        <KPIGrid>
          <KPICard title="Total Users" value={pagination.total || users.length} icon={UsersIcon} variant="primary" subText="Registered accounts" className="animate-slide-up-1" />
          <KPICard title="Approved" value={users.filter(u => u.isApproved).length} icon={Check} variant="outline" subText="Active users" className="animate-slide-up-2" />
          <KPICard title="Pending" value={users.filter(u => !u.isApproved).length} icon={Clock} variant="secondary" subText="Awaiting approval" className="animate-slide-up-3" />
        </KPIGrid>

        {/* ═══ Filter / Action Bar ═══ */}
        <div className="bento-card p-4 mb-4 lg:mb-6 animate-slide-up-2 border-beam">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-3 bg-surface-container/50 rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-full sm:w-72 border border-border/30 transition-all focus:bg-surface-container"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border border-border/30 transition-colors ${hasActiveFilters ? 'border-primary/50 text-primary bg-primary/5' : 'bg-surface-container/60 text-on-surface-variant hover:bg-surface-bright'}`}
              >
                <Filter className="w-4 h-4" /> Filters {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
              </button>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-surface-container/60 rounded-xl text-sm text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/30">
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
              </button>
              <Link href="/users/create" className="flex items-center gap-2 px-4 sm:px-5 py-2.5 btn-cta rounded-xl text-sm font-bold flex-1 sm:flex-initial justify-center shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> Add User
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="bento-card p-4 mb-4 border-l-4 border-destructive text-destructive text-sm animate-slide-up">{error}</div>
        )}

        <div className="space-y-4">
          {/* Expandable Filters */}
          {showFilters && (
            <div className="bento-card mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Role</label>
                  <Select value={roleFilter || '__all__'} onValueChange={(v) => { setRoleFilter(v === '__all__' ? '' : v); setPage(1); }}>
                    <SelectTrigger className="bg-surface-container border-border/30 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Roles</SelectItem>
                      {roles.map(r => (
                        <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Gender</label>
                  <Select value={genderFilter || '__all__'} onValueChange={(v) => { setGenderFilter(v === '__all__' ? '' : v); setPage(1); }}>
                    <SelectTrigger className="bg-surface-container border-border/30 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Genders</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
                  <Select value={statusFilter || '__all__'} onValueChange={(v) => { setStatusFilter(v === '__all__' ? '' : v); setPage(1); }}>
                    <SelectTrigger className="bg-surface-container border-border/30 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Statuses</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {hasActiveFilters && (
                  <div className="sm:col-span-3">
                    <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-on-surface flex items-center gap-1">
                      <X className="w-3 h-3" /> Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bulk Actions Bar */}
          {selectedUsers.length > 0 && isAdmin && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(124, 58, 237, 0.3)' }}>
              <span className="text-sm text-primary-300 font-semibold whitespace-nowrap">
                {selectedUsers.length} selected
              </span>
              <Select value={bulkAction || '__none__'} onValueChange={(v) => setBulkAction(v === '__none__' ? '' : v)}>
                <SelectTrigger className="bg-surface-container border-border/30 text-sm w-[180px]">
                  <SelectValue placeholder="Choose action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Choose action...</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="activate">Activate</SelectItem>
                  <SelectItem value="deactivate">Deactivate</SelectItem>
                  <SelectItem value="assignRole">Assign Role</SelectItem>
                </SelectContent>
              </Select>
              {bulkAction === 'assignRole' && (
                <Select value={bulkRoleId || '__none__'} onValueChange={(v) => setBulkRoleId(v === '__none__' ? '' : v)}>
                  <SelectTrigger className="bg-surface-container border-border/30 text-sm w-[160px]">
                    <SelectValue placeholder="Select Role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select Role...</SelectItem>
                    {roles.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction || bulkLoading}
                className="btn-primary text-sm py-2 disabled:opacity-50"
              >
                {bulkLoading ? 'Applying...' : 'Apply'}
              </button>
              <button
                onClick={() => { setSelectedUsers([]); setBulkAction(''); }}
                className="text-sm text-muted-foreground hover:text-on-surface"
              >
                Cancel
              </button>
            </div>
          )}

        <div className="bento-card overflow-hidden animate-slide-up-3">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-surface-container/40 animate-pulse" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found</p>
              <Link href="/users/create" className="btn-primary inline-block mt-4">
                Create First User
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr>
                      {isAdmin && (
                        <th className="w-10">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === users.length && users.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded accent-primary-500 cursor-pointer"
                          />
                        </th>
                      )}
                      <th>Email</th>
                      <th>Name</th>
                      <th className="hidden md:table-cell">Phone</th>
                      <th className="hidden md:table-cell">Gender</th>
                      <th>Role</th>
                      {isAdmin && <th>Status</th>}
                      <th className="hidden lg:table-cell">Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className={selectedUsers.includes(user.id) ? 'ring-1 ring-primary-500 ring-inset' : ''}>
                        {isAdmin && (
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleSelectUser(user.id)}
                              className="w-4 h-4 rounded accent-primary-500 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="font-medium">{user.email}</td>
                        <td>{user.name}</td>
                        <td className="hidden md:table-cell">{user.phone || '-'}</td>
                        <td className="hidden md:table-cell">
                          {user.gender ? (
                            <span className="badge badge-info">{user.gender}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role?.includes('admin') ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' : 'bg-surface-container text-on-surface-variant'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td>
                            {!user.isApproved ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                                <Clock className="w-4 h-4" /> Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                <Check className="w-4 h-4" /> Approved
                              </span>
                            )}
                          </td>
                        )}
                        <td className="hidden lg:table-cell">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="flex gap-2">
                            {isAdmin && !user.isApproved && (
                              <button 
                                onClick={() => handleApprove(user.id, user.name)}
                                disabled={approving === user.id}
                                className="btn-primary p-2 flex items-center gap-1 text-sm disabled:opacity-50"
                              >
                                {approving === user.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                                ) : (
                                  <>
                                    <Check className="w-4 h-4" /> <span className="hidden sm:inline">Approve</span>
                                  </>
                                )}
                              </button>
                            )}
                            {isAdmin && (
                              <Link
                                href={`/users/${user.id}/permissions`}
                                className="btn-secondary p-2 flex items-center gap-1 text-sm"
                                title="Manage Permissions"
                              >
                                <Shield className="w-4 h-4" />
                              </Link>
                            )}
                            <Link 
                              href={`/users/${user.id}/edit`}
                              className="btn-secondary p-2 flex items-center gap-1 text-sm"
                            >
                              <Pencil className="w-4 h-4" />
                            </Link>
                            <button 
                              onClick={() => handleDelete(user.id)}
                              className="btn-danger p-2 flex items-center gap-1 text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-border/10 bg-surface-container/20 p-3">
                <AuditPagination page={page} totalPages={pagination.pages} onPageChange={setPage} className="mt-0" />
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

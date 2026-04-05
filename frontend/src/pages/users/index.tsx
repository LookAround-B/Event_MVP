import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { Pencil, Trash2, Plus, Search, Check, Clock, Download, Shield, Filter, X, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';

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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl">User <span className="gradient-text">Directory</span></h1>
            <p className="text-muted-foreground mt-2">Manage system users and permissions</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2">
              <Download /> Export CSV
            </button>
            <Link href="/users/create" className="btn-primary flex items-center gap-2">
              <Plus /> Add User
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bento-card">
          {/* Search and Filter Bar */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Search className="text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Search users by email or name..."
                  className="input"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary flex items-center gap-2 ${hasActiveFilters ? 'border-primary text-primary' : ''}`}
              >
                <Filter /> Filters {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary-500" />}
              </button>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Role</label>
                  <select
                    className="input"
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                  >
                    <option value="">All Roles</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Gender</label>
                  <select
                    className="input"
                    value={genderFilter}
                    onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
                  >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
                  <select
                    className="input"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  >
                    <option value="">All Statuses</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                {hasActiveFilters && (
                  <div className="sm:col-span-3">
                    <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-on-surface flex items-center gap-1">
                      <X className="w-3 h-3" /> Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bulk Actions Bar */}
          {selectedUsers.length > 0 && isAdmin && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(124, 58, 237, 0.3)' }}>
              <span className="text-sm text-primary-300 font-semibold whitespace-nowrap">
                {selectedUsers.length} selected
              </span>
              <select
                className="input text-sm"
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
              >
                <option value="">Choose action...</option>
                <option value="approve">Approve</option>
                <option value="activate">Activate</option>
                <option value="deactivate">Deactivate</option>
                <option value="assignRole">Assign Role</option>
              </select>
              {bulkAction === 'assignRole' && (
                <select
                  className="input text-sm"
                  value={bulkRoleId}
                  onChange={(e) => setBulkRoleId(e.target.value)}
                >
                  <option value="">Select Role...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
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

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading users...</p>
              </div>
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
              <div className="table-container">
                <table className="table">
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
                            user.role?.includes('admin') ? 'bg-purple-100 text-purple-800' : 'bg-surface-container text-gray-800'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td>
                            {!user.isApproved ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                <Clock className="w-4 h-4" /> Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
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

              {pagination.pages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                  <p className="text-sm text-muted-foreground">
                    Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= pagination.pages}
                      onClick={() => setPage(page + 1)}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiCheck, FiClock } from 'react-icons/fi';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role?: string;
  isApproved?: boolean;
  profileComplete?: boolean;
  createdAt: string;
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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0, limit: 10, page: 1 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is admin
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
  }, [page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
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
      // Update the user in the list
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

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
            <p className="text-gray-600 mt-2">Manage system users and permissions</p>
          </div>
          <Link href="/users/create" className="btn-primary flex items-center gap-2">
            <FiPlus /> Add User
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <FiSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Search users by email or name..."
              className="form-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading users...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No users found</p>
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
                      <th>Email</th>
                      <th>Name</th>
                      <th>Phone</th>
                      {isAdmin && <th>Status</th>}
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="font-medium">{user.email}</td>
                        <td>{user.name}</td>
                        <td>{user.phone || '-'}</td>
                        {isAdmin && (
                          <td>
                            {!user.isApproved ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                <FiClock className="w-4 h-4" /> Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                <FiCheck className="w-4 h-4" /> Approved
                              </span>
                            )}
                          </td>
                        )}
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="flex gap-2">
                            {isAdmin && !user.isApproved && (
                              <button 
                                onClick={() => handleApprove(user.id, user.name)}
                                disabled={approving === user.id}
                                className="btn-primary p-2 flex items-center gap-1 text-sm disabled:opacity-50"
                              >
                                {approving === user.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                                  </>
                                ) : (
                                  <>
                                    <FiCheck className="w-4 h-4" /> Approve
                                  </>
                                )}
                              </button>
                            )}
                            <Link 
                              href={`/users/${user.id}/edit`}
                              className="btn-secondary p-2 flex items-center gap-1 text-sm"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </Link>
                            <button 
                              onClick={() => handleDelete(user.id)}
                              className="btn-danger p-2 flex items-center gap-1 text-sm"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.pages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <p className="text-sm text-gray-600">
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

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import apiClient from '@/lib/api';
import { FiCheck, FiTrash2, FiRefreshCw } from 'react-icons/fi';

interface PendingUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  gender?: string;
  phone?: string;
  createdAt: string;
}

export default function AdminApprovals() {
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const token = Cookies.get('authToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const payload = JSON.parse(
        Buffer.from(tokenParts[1], 'base64').toString('utf-8')
      );
      
      if (payload.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      
      setIsAdmin(true);
    } catch (error) {
      router.push('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingUsers();
    }
  }, [isAdmin]);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/admin/approve-user');
      setPendingUsers(response.data.data || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string, userName: string) => {
    if (!window.confirm(`Approve user ${userName}?`)) {
      return;
    }

    try {
      setApproving(userId);
      setError('');
      setSuccess('');

      await apiClient.post('/api/admin/approve-user', { userId });
      setSuccess(`${userName} has been approved successfully!`);
      
      // Refresh the list
      setTimeout(() => {
        fetchPendingUsers();
        setApproving(null);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve user');
      setApproving(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <FiRefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Verifying access...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <FiRefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading pending approvals...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Approvals</h1>
          <p className="text-gray-600">
            Manage and approve pending user sign-ups from Google authentication
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {pendingUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg mb-4">No pending approvals</p>
            <p className="text-gray-500">All users have been approved!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Sign-up Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pendingUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.gender || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.phone || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleApprove(user.id, `${user.firstName} ${user.lastName}`)}
                          disabled={approving === user.id}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            approving === user.id
                              ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {approving === user.id ? (
                            <>
                              <FiRefreshCw className="w-4 h-4 animate-spin" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <FiCheck className="w-4 h-4" />
                              Approve
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t">
              <p className="text-sm text-gray-600">
                Total pending approvals: <strong>{pendingUsers.length}</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiEye } from 'react-icons/fi';
import api from '@/lib/api';

interface Registration {
  id: string;
  paymentStatus: string;
  divisional_class: string;
  notes: string;
  rider: {
    firstName: string;
    lastName: string;
    email: string;
  };
  horse: {
    name: string;
    breed: string;
  };
  event: {
    name: string;
    date: string;
  };
}

export default function Registrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRegistrations();
  }, [page, statusFilter]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/registrations', {
        params: {
          page,
          limit: 10,
          status: statusFilter,
        },
      });

      setRegistrations(response.data.data.registrations);
      setTotalPages(response.data.data.pagination.pages);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
      setError('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this registration?')) return;

    try {
      await api.delete(`/api/registrations/${id}`);
      setRegistrations(registrations.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to delete registration:', err);
      alert('Failed to delete registration');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PAID: 'badge-success',
      UNPAID: 'badge-warning',
      PARTIAL: 'badge-info',
      CANCELLED: 'badge-danger',
    };
    return colors[status] || 'badge-secondary';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Registrations</h2>
        <Link href="/registrations/create" className="btn-primary">
          <FiPlus className="inline mr-2" /> New Registration
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="mb-6 card">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Payment Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="form-input"
          >
            <option value="">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIAL">Partial</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card table-container">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading registrations...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No registrations found. Create one to get started!
          </div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Horse</th>
                  <th>Event</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id}>
                    <td className="font-medium">{reg.rider.firstName} {reg.rider.lastName}</td>
                    <td>{reg.horse.name}</td>
                    <td>{reg.event.name}</td>
                    <td>{reg.divisional_class}</td>
                    <td>
                        <span className={`badge ${getStatusColor(reg.paymentStatus)}`}>
                          {reg.paymentStatus.charAt(0).toUpperCase() + reg.paymentStatus.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <Link href={`/registrations/${reg.id}`} className="text-blue-600 hover:text-blue-900">
                          <FiEye className="w-4 h-4" title="View" />
                        </Link>
                        <Link href={`/registrations/${reg.id}/edit`} className="text-green-600 hover:text-green-900">
                          <FiEdit className="w-4 h-4" title="Edit" />
                        </Link>
                        <button
                          onClick={() => handleDelete(reg.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

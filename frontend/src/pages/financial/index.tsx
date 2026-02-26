import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';

interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'adjustment';
  amount: number;
  method: string;
  status: string;
  description: string;
  createdAt: string;
  registration: {
    rider: {
      firstName: string;
      lastName: string;
    };
    event: {
      name: string;
    };
  };
}

interface Summary {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
}

export default function Financial() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalRevenue: 0,
    totalTransactions: 0,
    averageTransaction: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, [page, typeFilter, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transRes, summRes] = await Promise.all([
        api.get('/api/financial/transactions', {
          params: {
            page,
            limit: 15,
            type: typeFilter,
            status: statusFilter,
          },
        }),
        api.get('/api/financial/summary'),
      ]);

      setTransactions(transRes.data.data.transactions);
      setSummary(summRes.data.data.summary);
      setTotalPages(transRes.data.data.pagination.pages);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch financial data:', err);
      setError('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      payment: 'text-green-600',
      refund: 'text-red-600',
      adjustment: 'text-blue-600',
    };
    return colors[type] || 'text-gray-600';
  };

  const getTypeSign = (type: string) => {
    return type === 'refund' ? '-' : '+';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'badge-success',
      pending: 'badge-warning',
      failed: 'badge-danger',
      cancelled: 'badge-secondary',
    };
    return colors[status] || 'badge-secondary';
  };

  return (
    <ProtectedRoute>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Financial Management</h2>
          <Link href="/financial/transactions/create" className="btn-primary">
            <FiPlus className="inline mr-2" /> Record Transaction
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ${(summary.totalRevenue / 100).toFixed(2)}
            </p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm font-medium">Total Transactions</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalTransactions}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm font-medium">Average Transaction</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ${(summary.averageTransaction / 100).toFixed(2)}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="card mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="form-input"
            >
              <option value="">All Types</option>
              <option value="payment">Payment</option>
              <option value="refund">Refund</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="form-input"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card table-container">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No transactions found. Record one to get started!
            </div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Rider / Event</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trans) => (
                    <tr key={trans.id}>
                      <td className="font-medium">
                        <div>{trans.registration.rider.firstName} {trans.registration.rider.lastName}</div>
                        <div className="text-sm text-gray-600">{trans.registration.event.name}</div>
                      </td>
                      <td className={`font-bold ${getTypeColor(trans.type)}`}>
                        {getTypeSign(trans.type)}${(trans.amount / 100).toFixed(2)}
                      </td>
                      <td className="capitalize">{trans.type}</td>
                      <td className="capitalize">{trans.method.replace('_', ' ')}</td>
                      <td>
                        <span className={`badge ${getStatusColor(trans.status)}`}>
                          {trans.status.charAt(0).toUpperCase() + trans.status.slice(1)}
                        </span>
                      </td>
                      <td>{new Date(trans.createdAt).toLocaleDateString()}</td>
                      <td className="text-sm text-gray-600">{trans.description || '-'}</td>
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
    </ProtectedRoute>
  );
}

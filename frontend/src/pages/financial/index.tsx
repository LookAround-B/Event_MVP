import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiDownload } from 'react-icons/fi';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';

interface Transaction {
  id: string;
  registrationId: string;
  amount: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  transactionDate: string;
  status: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

interface Summary {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
}

function escapeCSVField(field: string | number): string {
  const s = String(field);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToExcel(headers: string[], rows: (string | number)[][], filename: string) {
  const esc = (s: string | number) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const headerRow = headers.map(h => `<Cell><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('');
  const dataRows = rows.map(r => {
    const cells = r.map(c => {
      const t = typeof c === 'number' ? 'Number' : 'String';
      return `<Cell><Data ss:Type="${t}">${esc(c)}</Data></Cell>`;
    });
    return `<Row>${cells.join('')}</Row>`;
  });
  const xml = `<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Sheet1"><Table><Row>${headerRow}</Row>${dataRows.join('')}</Table></Worksheet></Workbook>`;
  downloadBlob(new Blob([xml], { type: 'application/vnd.ms-excel' }), filename);
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map(t => t.id)));
    }
  };

  const getExportData = () => {
    const headers = ['Reference #', 'Amount', 'CGST', 'SGST', 'IGST', 'Total Amount', 'Payment Method', 'Payment Status', 'Transaction Date'];
    const source = selectedIds.size > 0 ? transactions.filter(t => selectedIds.has(t.id)) : transactions;
    const rows = source.map(t => [
      t.referenceNumber || t.id.slice(0, 8),
      t.amount,
      t.cgstAmount,
      t.sgstAmount,
      t.igstAmount,
      t.totalAmount,
      t.paymentMethod?.replace('_', ' ') || '-',
      t.status,
      new Date(t.createdAt).toLocaleDateString(),
    ]);
    return { headers, rows };
  };

  const handleExportCSV = () => {
    const { headers, rows } = getExportData();
    const csv = [
      headers.map(escapeCSVField).join(','),
      ...rows.map(r => r.map(escapeCSVField).join(',')),
    ].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'transactions.csv');
    toast.success('Transactions exported as CSV');
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    exportToExcel(headers, rows, 'transactions.xls');
    toast.success('Transactions exported as Excel');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PAID: 'badge-success',
      PARTIAL: 'badge-warning',
      UNPAID: 'badge-danger',
      CANCELLED: 'badge-secondary',
    };
    return colors[status?.toUpperCase()] || 'badge-secondary';
  };

  return (
    <ProtectedRoute>
      <Head><title>Financial | Equestrian Events</title></Head>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">Financial Management</h2>
          <div className="flex gap-3">
            <button onClick={handleExportCSV} className="btn-secondary">
              <FiDownload className="inline mr-2" /> Export CSV
            </button>
            <button onClick={handleExportExcel} className="btn-secondary">
              <FiDownload className="inline mr-2" /> Export Excel
            </button>
            <Link href="/financial/transactions/create" className="btn-primary">
              <FiPlus className="inline mr-2" /> Record Transaction
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <p className="text-gray-300 text-sm font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-white mt-2">
              ₹{(summary.totalRevenue).toFixed(2)}
            </p>
          </div>
          <div className="card">
            <p className="text-gray-300 text-sm font-medium">Total Transactions</p>
            <p className="text-3xl font-bold text-white mt-2">{summary.totalTransactions}</p>
          </div>
          <div className="card">
            <p className="text-gray-300 text-sm font-medium">Average Transaction</p>
            <p className="text-3xl font-bold text-white mt-2">
              ₹{(summary.averageTransaction).toFixed(2)}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-15 border border-red-400 border-opacity-30 text-red-300 backdrop-blur-sm px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="card mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Filter by Type</label>
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
            <label className="block text-sm font-medium text-white mb-2">Filter by Status</label>
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

        {/* Transactions Table */}
        <div className="card table-container">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-gray-300 mt-2">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-300">
              No transactions found. Record one to get started!
            </div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === transactions.length && transactions.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-600"
                      />
                    </th>
                    <th>Reference #</th>
                    <th>Amount</th>
                    <th>CGST</th>
                    <th>SGST</th>
                    <th>IGST</th>
                    <th>Total Amount</th>
                    <th>Payment Method</th>
                    <th>Payment Status</th>
                    <th>Transaction Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trans) => (
                    <tr key={trans.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(trans.id)}
                          onChange={() => toggleSelect(trans.id)}
                          className="rounded border-gray-600"
                        />
                      </td>
                      <td className="font-medium text-sm">{trans.referenceNumber || trans.id.slice(0, 8)}</td>
                      <td>₹{trans.amount.toFixed(2)}</td>
                      <td className="text-sm">₹{trans.cgstAmount.toFixed(2)}</td>
                      <td className="text-sm">₹{trans.sgstAmount.toFixed(2)}</td>
                      <td className="text-sm">₹{trans.igstAmount.toFixed(2)}</td>
                      <td className="font-bold text-green-600">₹{trans.totalAmount.toFixed(2)}</td>
                      <td className="capitalize">{trans.paymentMethod?.replace('_', ' ') || '-'}</td>
                      <td>
                        <span className={`badge ${getStatusColor(trans.status)}`}>
                          {trans.status.charAt(0).toUpperCase() + trans.status.slice(1)}
                        </span>
                      </td>
                      <td>{new Date(trans.createdAt).toLocaleDateString()}</td>
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
                  <span className="px-4 py-2 text-gray-300">
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

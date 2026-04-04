import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiSearch, FiDownload } from 'react-icons/fi';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';

interface Registration {
  id: string;
  eventAmount: number;
  stableAmount: number;
  gstAmount: number;
  totalAmount: number;
  paymentStatus: string;
  rider: {
    firstName: string;
    lastName: string;
    email: string;
  };
  horse: {
    id: string;
    name: string;
    color?: string;
    gender: string;
  };
  event: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  createdAt: string;
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

export default function Registrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === registrations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(registrations.map(r => r.id)));
    }
  };

  const getExportData = () => {
    const headers = ['Rider Name', 'Horse Name', 'Event Name', 'Total Amount', 'Payment Status'];
    const source = selectedIds.size > 0 ? registrations.filter(r => selectedIds.has(r.id)) : registrations;
    const rows = source.map(r => [
      `${r.rider.firstName} ${r.rider.lastName}`,
      r.horse.name,
      r.event.name,
      r.totalAmount,
      r.paymentStatus,
    ]);
    return { headers, rows };
  };

  const handleExportCSV = () => {
    const { headers, rows } = getExportData();
    const csv = [
      headers.map(escapeCSVField).join(','),
      ...rows.map(r => r.map(escapeCSVField).join(',')),
    ].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'registrations.csv');
    toast.success('Registrations exported as CSV');
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    exportToExcel(headers, rows, 'registrations.xls');
    toast.success('Registrations exported as Excel');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this registration?')) return;

    try {
      await api.delete(`/api/registrations/${id}`);
      setRegistrations(registrations.filter(r => r.id !== id));
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
      toast.success('Registration deleted successfully');
    } catch (err) {
      console.error('Failed to delete registration:', err);
      toast.error('Failed to delete registration');
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
    <ProtectedRoute>
      <Head><title>Registrations | Equestrian Events</title></Head>
      <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">Registrations</h2>
            <div className="flex gap-3">
              <button onClick={handleExportCSV} className="btn-secondary">
                <FiDownload className="inline mr-2" /> Export CSV
              </button>
              <button onClick={handleExportExcel} className="btn-secondary">
                <FiDownload className="inline mr-2" /> Export Excel
              </button>
              <Link href="/registrations/create" className="btn-primary">
                <FiPlus className="inline mr-2" /> New Registration
              </Link>
            </div>
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-20 border border-red-400 border-opacity-30 text-red-300 backdrop-blur-sm px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="mb-6 card">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="form-input pl-10"
              >
                <option value="">All Payment Statuses</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="card table-container">
            {loading ? (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ height: 48, borderRadius: 8, background: 'rgba(255,255,255,0.08)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-8 text-gray-300">
                {statusFilter ? 'No registrations with this status' : 'No registrations yet. Create one to get started!'}
              </div>
            ) : (
              <>
                <table className="table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedIds.size === registrations.length && registrations.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-600"
                        />
                      </th>
                      <th>Rider Name</th>
                      <th>Horse Name</th>
                      <th>Event Name</th>
                      <th>Total Amount</th>
                      <th>Payment Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => (
                      <tr key={reg.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(reg.id)}
                            onChange={() => toggleSelect(reg.id)}
                            className="rounded border-gray-600"
                          />
                        </td>
                        <td className="font-medium">{reg.rider.firstName} {reg.rider.lastName}</td>
                        <td>{reg.horse.name} ({reg.horse.gender})</td>
                        <td>{reg.event.name}</td>
                        <td className="font-medium">₹{reg.totalAmount}</td>
                        <td>
                          <span className={`badge ${getStatusColor(reg.paymentStatus)}`}>
                            {reg.paymentStatus.charAt(0).toUpperCase() + reg.paymentStatus.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDelete(reg.id)}
                            className="text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
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

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiEye, FiDownload } from 'react-icons/fi';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';

interface Rider {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  gender?: string;
  registrationCount: number;
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

export default function Riders() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRiders();
  }, [page, searchTerm]);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/riders', {
        params: {
          page,
          limit: 10,
          search: searchTerm,
        },
      });

      setRiders(response.data.data.riders);
      setTotalPages(response.data.data.pagination.pages);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch riders:', err);
      setError('Failed to load riders');
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
    if (selectedIds.size === riders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(riders.map(r => r.id)));
    }
  };

  const getExportData = () => {
    const headers = ['Rider Name', 'Email', 'Phone', 'Gender', 'Registrations'];
    const source = selectedIds.size > 0 ? riders.filter(r => selectedIds.has(r.id)) : riders;
    const rows = source.map(r => [
      `${r.firstName} ${r.lastName}`,
      r.email,
      r.mobile || '-',
      r.gender || '-',
      r.registrationCount,
    ]);
    return { headers, rows };
  };

  const handleExportCSV = () => {
    const { headers, rows } = getExportData();
    const csv = [
      headers.map(escapeCSVField).join(','),
      ...rows.map(r => r.map(escapeCSVField).join(',')),
    ].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'riders.csv');
    toast.success('Riders exported as CSV');
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    exportToExcel(headers, rows, 'riders.xls');
    toast.success('Riders exported as Excel');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rider?')) return;

    try {
      await api.delete(`/api/riders/${id}`);
      setRiders(riders.filter(r => r.id !== id));
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
      toast.success('Rider deleted successfully');
    } catch (err) {
      console.error('Failed to delete rider:', err);
      toast.error('Failed to delete rider');
    }
  };

  return (
    <ProtectedRoute>
      <Head><title>Riders | Equestrian Events</title></Head>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">Riders</h2>
          <div className="flex gap-3">
            <button onClick={handleExportCSV} className="btn-secondary">
              <FiDownload className="inline mr-2" /> Export CSV
            </button>
            <button onClick={handleExportExcel} className="btn-secondary">
              <FiDownload className="inline mr-2" /> Export Excel
            </button>
            <Link href="/riders/create" className="btn-primary">
              <FiPlus className="inline mr-2" /> New Rider
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-15 border border-red-400 border-opacity-30 text-red-300 backdrop-blur-sm px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="mb-6 card">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search riders by name, email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="form-input pl-10"
            />
          </div>
        </div>

        <div className="card table-container">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-gray-300 mt-2">Loading riders...</p>
            </div>
          ) : riders.length === 0 ? (
            <div className="text-center py-8 text-gray-300">
              {searchTerm ? 'No riders match your search' : 'No riders registered yet. Add one to get started!'}
            </div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === riders.length && riders.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-600"
                      />
                    </th>
                    <th>Rider Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Gender</th>
                    <th>Registrations</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {riders.map((rider) => (
                    <tr key={rider.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(rider.id)}
                          onChange={() => toggleSelect(rider.id)}
                          className="rounded border-gray-600"
                        />
                      </td>
                      <td className="font-medium">{rider.firstName} {rider.lastName}</td>
                      <td>{rider.email}</td>
                      <td>{rider.mobile || '-'}</td>
                      <td>{rider.gender || '-'}</td>
                      <td>{rider.registrationCount}</td>
                      <td>
                        <div className="flex space-x-2">
                          <Link href={`/riders/${rider.id}`} className="text-blue-400 hover:text-blue-300">
                            <FiEye className="w-4 h-4" title="View" />
                          </Link>
                          <Link href={`/riders/create?id=${rider.id}`} className="text-green-400 hover:text-green-300">
                            <FiEdit className="w-4 h-4" title="Edit" />
                          </Link>
                          <button
                            onClick={() => handleDelete(rider.id)}
                            className="text-red-400 hover:text-red-300"
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

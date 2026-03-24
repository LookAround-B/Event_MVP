import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiEye, FiDownload, FiFilter, FiX } from 'react-icons/fi';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import ActionsDropdown from '@/components/ActionsDropdown';

interface Rider {
  id: string;
  eId: string;
  efiRiderId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  gender?: string;
  isActive: boolean;
  clubId?: string;
  clubName?: string;
  registrationCount: number;
}

interface Club {
  id: string;
  name: string;
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
  const router = useRouter();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filterGender, setFilterGender] = useState('');
  const [filterClubId, setFilterClubId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    fetchRiders();
  }, [page, searchTerm, filterGender, filterClubId, filterStatus]);

  const fetchClubs = async () => {
    try {
      const res = await api.get('/api/clubs?limit=100');
      setClubs(res.data.data?.clubs || []);
    } catch (err) {
      console.error('Failed to fetch clubs:', err);
    }
  };

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10, search: searchTerm };
      if (filterGender) params.gender = filterGender;
      if (filterClubId) params.clubId = filterClubId;
      if (filterStatus) params.status = filterStatus;

      const response = await api.get('/api/riders', { params });
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

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected rider(s)?`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map(rid => api.delete(`/api/riders/${rid}`)));
      toast.success(`${selectedIds.size} rider(s) deleted`);
      setSelectedIds(new Set());
      fetchRiders();
    } catch (err) {
      toast.error('Failed to delete some riders');
    }
  };

  const getExportData = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Gender', 'EFI Rider ID', 'Embassy ID', 'Club', 'Registrations'];
    const source = selectedIds.size > 0 ? riders.filter(r => selectedIds.has(r.id)) : riders;
    const rows = source.map(r => [
      r.firstName,
      r.lastName,
      r.email,
      r.mobile || '-',
      r.gender || '-',
      r.efiRiderId || '-',
      r.eId || '-',
      r.clubName || '-',
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

  const clearFilters = () => {
    setFilterGender('');
    setFilterClubId('');
    setFilterStatus('');
    setPage(1);
  };

  const hasActiveFilters = filterGender || filterClubId || filterStatus;

  return (
    <ProtectedRoute>
      <Head><title>Riders | Equestrian Events</title></Head>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">Rider List</h2>
          <div className="flex gap-3">
            {selectedIds.size > 0 && (
              <button onClick={handleBulkDelete} className="btn-secondary text-red-400 border-red-400">
                <FiTrash2 className="inline mr-2" /> Delete ({selectedIds.size})
              </button>
            )}
            <button onClick={handleExportCSV} className="btn-secondary">
              <FiDownload className="inline mr-2" /> CSV
            </button>
            <button onClick={handleExportExcel} className="btn-secondary">
              <FiDownload className="inline mr-2" /> Excel
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

        {/* Search & Filter Bar */}
        <div className="mb-6 card">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-3 text-gray-500" />
              <input
                type="text"
                placeholder="Search riders by name, email, EFI ID..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="form-input pl-10"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center gap-2 ${hasActiveFilters ? 'border-primary-400 text-primary-400' : ''}`}
            >
              <FiFilter /> Filters {hasActiveFilters && '(active)'}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-white border-opacity-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Gender</label>
                  <select
                    value={filterGender}
                    onChange={(e) => { setFilterGender(e.target.value); setPage(1); }}
                    className="form-input"
                  >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Club</label>
                  <select
                    value={filterClubId}
                    onChange={(e) => { setFilterClubId(e.target.value); setPage(1); }}
                    className="form-input"
                  >
                    <option value="">All Clubs</option>
                    {clubs.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                    className="form-input"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-3 text-sm text-gray-400 hover:text-white flex items-center gap-1">
                  <FiX className="w-3 h-3" /> Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="card table-container">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-gray-300 mt-2">Loading riders...</p>
            </div>
          ) : riders.length === 0 ? (
            <div className="text-center py-8 text-gray-300">
              {searchTerm || hasActiveFilters ? 'No riders match your search/filters' : 'No riders registered yet. Add one to get started!'}
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
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>EFI Rider ID</th>
                    <th>Embassy ID</th>
                    <th>Club Name</th>
                    <th>Email</th>
                    <th>Gender</th>
                    <th>Status</th>
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
                      <td className="font-medium">{rider.firstName}</td>
                      <td>{rider.lastName || '-'}</td>
                      <td>{rider.efiRiderId || '-'}</td>
                      <td className="font-mono text-sm">{rider.eId}</td>
                      <td>{rider.clubName || '-'}</td>
                      <td>{rider.email}</td>
                      <td>{rider.gender || '-'}</td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rider.isActive
                            ? 'bg-green-500 bg-opacity-20 text-green-400'
                            : 'bg-red-500 bg-opacity-20 text-red-400'
                        }`}>
                          {rider.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <ActionsDropdown actions={[
                          { label: 'View', icon: <FiEye className="w-4 h-4" />, onClick: () => router.push(`/riders/${rider.id}`) },
                          { label: 'Edit', icon: <FiEdit className="w-4 h-4" />, onClick: () => router.push(`/riders/create?id=${rider.id}`), className: 'text-amber-400 hover:text-amber-300' },
                          { label: 'Delete', icon: <FiTrash2 className="w-4 h-4" />, onClick: () => handleDelete(rider.id), className: 'text-red-400 hover:text-red-300' },
                        ]} />
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

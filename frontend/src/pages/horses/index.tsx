import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Eye, Download, Filter, X } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import ActionsDropdown from '@/components/ActionsDropdown';

interface Horse {
  id: string;
  name: string;
  breed: string | null;
  color: string | null;
  height: number | null;
  gender: string;
  yearOfBirth: number | null;
  passportNumber: string | null;
  embassyId: string | null;
  isActive: boolean;
  riderName: string | null;
  clubName: string | null;
  userType: string | null;
  registrationCount: number;
}

interface Club {
  id: string;
  name: string;
}

interface Rider {
  id: string;
  firstName: string;
  lastName: string;
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

export default function Horses() {
  const router = useRouter();
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterGender, setFilterGender] = useState('');
  const [filterClubId, setFilterClubId] = useState('');
  const [filterRiderId, setFilterRiderId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Dropdown data for filters
  const [clubs, setClubs] = useState<Club[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchHorses();
  }, [page, searchTerm, filterGender, filterClubId, filterRiderId, filterStatus]);

  const fetchFilterOptions = async () => {
    try {
      const [clubsRes, ridersRes] = await Promise.all([
        api.get('/api/clubs', { params: { limit: 100 } }).catch(() => null),
        api.get('/api/riders', { params: { limit: 100 } }).catch(() => null),
      ]);
      if (clubsRes?.data?.data?.clubs) setClubs(clubsRes.data.data.clubs);
      else if (clubsRes?.data?.data) setClubs(Array.isArray(clubsRes.data.data) ? clubsRes.data.data : []);
      if (ridersRes?.data?.data?.riders) setRiders(ridersRes.data.data.riders);
      else if (ridersRes?.data?.data) setRiders(Array.isArray(ridersRes.data.data) ? ridersRes.data.data : []);
    } catch {
      // Filters will just have no options - non-critical
    }
  };

  const fetchHorses = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 10,
        search: searchTerm,
      };
      if (filterGender) params.gender = filterGender;
      if (filterClubId) params.clubId = filterClubId;
      if (filterRiderId) params.riderId = filterRiderId;
      if (filterStatus !== '') params.isActive = filterStatus;

      const response = await api.get('/api/horses', { params });

      setHorses(response.data.data.horses);
      setTotalPages(response.data.data.pagination.pages);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch horses:', err);
      setError('Failed to load horses');
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
    if (selectedIds.size === horses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(horses.map(h => h.id)));
    }
  };

  const getExportData = () => {
    const headers = ['Horse Name', 'Breed', 'Sex', 'Birth Year', 'Color', 'Height', 'Passport #', 'Embassy ID', 'Rider', 'Club', 'User Type', 'Status', 'Registrations'];
    const source = selectedIds.size > 0 ? horses.filter(h => selectedIds.has(h.id)) : horses;
    const rows = source.map(h => [
      h.name,
      h.breed || '-',
      h.gender || '-',
      h.yearOfBirth || '-',
      h.color || '-',
      h.height ? `${h.height}h` : '-',
      h.passportNumber || '-',
      h.embassyId || '-',
      h.riderName || '-',
      h.clubName || '-',
      h.userType || '-',
      h.isActive ? 'Active' : 'Inactive',
      h.registrationCount,
    ]);
    return { headers, rows };
  };

  const clearFilters = () => {
    setFilterGender('');
    setFilterClubId('');
    setFilterRiderId('');
    setFilterStatus('');
    setPage(1);
  };

  const activeFilterCount = [filterGender, filterClubId, filterRiderId, filterStatus].filter(Boolean).length;

  const handleExportCSV = () => {
    const { headers, rows } = getExportData();
    const csv = [
      headers.map(escapeCSVField).join(','),
      ...rows.map(r => r.map(escapeCSVField).join(',')),
    ].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'horses.csv');
    toast.success('Horses exported as CSV');
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    exportToExcel(headers, rows, 'horses.xls');
    toast.success('Horses exported as Excel');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this horse?')) return;

    try {
      await api.delete(`/api/horses/${id}`);
      setHorses(horses.filter(h => h.id !== id));
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
      toast.success('Horse deleted successfully');
    } catch (err) {
      console.error('Failed to delete horse:', err);
      toast.error('Failed to delete horse');
    }
  };

  return (
    <ProtectedRoute>
      <Head><title>Horses | Equestrian Events</title></Head>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl">Horse <span className="gradient-text">Registry</span></h1>
          <div className="flex gap-3">
            <button onClick={handleExportCSV} className="btn-secondary">
              <Download className="inline mr-2" /> Export CSV
            </button>
            <button onClick={handleExportExcel} className="btn-secondary">
              <Download className="inline mr-2" /> Export Excel
            </button>
            <Link href="/horses/create" className="btn-primary">
              <Plus className="inline mr-2" /> New Horse
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="mb-6 bento-card">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search horses by name, passport, embassy ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="input pl-10"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center gap-2 ${activeFilterCount > 0 ? '' : ''}`}
            >
              <Filter className="w-4 h-4" />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="form-label">Sex</label>
                  <select
                    value={filterGender}
                    onChange={(e) => { setFilterGender(e.target.value); setPage(1); }}
                    className="input text-sm"
                  >
                    <option value="">All</option>
                    <option value="Stallion">Stallion</option>
                    <option value="Mare">Mare</option>
                    <option value="Gelding">Gelding</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Club</label>
                  <select
                    value={filterClubId}
                    onChange={(e) => { setFilterClubId(e.target.value); setPage(1); }}
                    className="input text-sm"
                  >
                    <option value="">All Clubs</option>
                    {clubs.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Rider</label>
                  <select
                    value={filterRiderId}
                    onChange={(e) => { setFilterRiderId(e.target.value); setPage(1); }}
                    className="input text-sm"
                  >
                    <option value="">All Riders</option>
                    {riders.map(r => (
                      <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                    className="input text-sm"
                  >
                    <option value="">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-sm transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bento-card table-container">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading horses...</p>
            </div>
          ) : horses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No horses match your search' : 'No horses in inventory yet. Add one to get started!'}
            </div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === horses.length && horses.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-border"
                      />
                    </th>
                    <th>Horse Name</th>
                    <th>Sex</th>
                    <th>Birth Year</th>
                    <th>Passport #</th>
                    <th>Embassy ID</th>
                    <th>Rider</th>
                    <th>Club</th>
                    <th>User Type</th>
                    <th>Color</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {horses.map((horse) => {
                    return (
                    <tr key={horse.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(horse.id)}
                          onChange={() => toggleSelect(horse.id)}
                          className="rounded border-border"
                        />
                      </td>
                      <td className="font-medium">{horse.name}</td>
                      <td>{horse.gender || '-'}</td>
                      <td>{horse.yearOfBirth || '-'}</td>
                      <td className="text-xs font-mono">{horse.passportNumber || '-'}</td>
                      <td className="text-xs font-mono">{horse.embassyId || '-'}</td>
                      <td>{horse.riderName || '-'}</td>
                      <td>{horse.clubName || '-'}</td>
                      <td>
                        {horse.userType ? (
                          <span className="badge badge-info text-xs">{horse.userType}</span>
                        ) : '-'}
                      </td>
                      <td>{horse.color || '-'}</td>
                      <td>
                        <span className={`badge ${horse.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {horse.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <ActionsDropdown actions={[
                          { label: 'View', icon: <Eye className="w-4 h-4" />, onClick: () => router.push(`/horses/${horse.id}`) },
                          { label: 'Edit', icon: <Edit className="w-4 h-4" />, onClick: () => router.push(`/horses/create?id=${horse.id}`), className: 'text-amber-400 hover:text-amber-300' },
                          { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: () => handleDelete(horse.id), className: 'text-destructive hover:text-destructive' },
                        ]} />
                      </td>
                    </tr>
                    );
                  })}
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

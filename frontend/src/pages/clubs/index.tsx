import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { FiEdit2, FiTrash2, FiPlus, FiDownload, FiEye, FiFilter, FiX } from 'react-icons/fi';
import ActionsDropdown from '@/components/ActionsDropdown';

interface Club {
  id: string;
  eId: string;
  name: string;
  shortCode: string;
  email: string;
  contactNumber: string;
  address: string;
  city: string;
  state: string;
  isActive: boolean;
  primaryContact: {
    firstName: string;
    lastName: string;
    email: string;
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

export default function ClubsList() {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'active' | 'inactive'>('');
  const [editingEmbassyId, setEditingEmbassyId] = useState<string | null>(null);
  const [editEmbassyValue, setEditEmbassyValue] = useState('');
  const limit = 10;

  useEffect(() => {
    fetchClubs();
  }, [page, search]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/clubs', {
        params: { page, limit, search },
      });
      setClubs(response.data.clubs || []);
      setTotal(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
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
    const filtered = getFilteredClubs();
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)));
    }
  };

  const getFilteredClubs = () => {
    let filtered = clubs;
    if (filterCity) {
      filtered = filtered.filter(c => c.city?.toLowerCase().includes(filterCity.toLowerCase()));
    }
    if (filterStatus === 'active') {
      filtered = filtered.filter(c => c.isActive);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(c => !c.isActive);
    }
    return filtered;
  };

  const clearFilters = () => {
    setFilterCity('');
    setFilterStatus('');
  };

  const getExportData = () => {
    const headers = ['Club Name', 'Club Code', 'Embassy ID', 'First Name', 'Last Name', 'Email', 'City'];
    const source = selectedIds.size > 0 ? clubs.filter(c => selectedIds.has(c.id)) : clubs;
    const rows = source.map(c => [
      c.name,
      c.shortCode,
      c.eId || '',
      c.primaryContact?.firstName || '',
      c.primaryContact?.lastName || '',
      c.email || c.primaryContact?.email || '',
      c.city || '',
    ]);
    return { headers, rows };
  };

  const handleExportCSV = () => {
    const { headers, rows } = getExportData();
    const csv = [
      headers.map(escapeCSVField).join(','),
      ...rows.map(r => r.map(escapeCSVField).join(',')),
    ].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'clubs.csv');
    toast.success('Clubs exported as CSV');
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    exportToExcel(headers, rows, 'clubs.xls');
    toast.success('Clubs exported as Excel');
  };

  const deleteClub = async (id: string) => {
    if (confirm('Are you sure you want to delete this club?')) {
      try {
        await api.delete(`/api/clubs/${id}`);
        setClubs(clubs.filter(c => c.id !== id));
        selectedIds.delete(id);
        setSelectedIds(new Set(selectedIds));
        toast.success('Club deleted successfully');
      } catch (error) {
        console.error('Failed to delete club:', error);
        toast.error('Failed to delete club');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected club(s)?`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => api.delete(`/api/clubs/${id}`)));
      setClubs(clubs.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} club(s) deleted successfully`);
    } catch (error) {
      console.error('Failed to bulk delete:', error);
      toast.error('Failed to delete some clubs');
    }
  };

  const saveEmbassyId = async (clubId: string) => {
    try {
      await api.put(`/api/clubs/${clubId}`, { eId: editEmbassyValue });
      setClubs(clubs.map(c => c.id === clubId ? { ...c, eId: editEmbassyValue } : c));
      setEditingEmbassyId(null);
      toast.success('Embassy ID updated');
    } catch (error) {
      console.error('Failed to update Embassy ID:', error);
      toast.error('Failed to update Embassy ID');
    }
  };

  const filteredClubs = getFilteredClubs();
  const pages = Math.ceil(total / limit);
  const uniqueCities = [...new Set(clubs.map(c => c.city).filter(Boolean))];

  return (
    <ProtectedRoute>
      <Head><title>Clubs | Equestrian Events</title></Head>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">Club Co-ordinator List</h2>
          <div className="flex gap-3">
            {selectedIds.size > 0 && (
              <button onClick={handleBulkDelete} className="btn-secondary text-red-400 border-red-400">
                <FiTrash2 className="inline mr-2" /> Delete ({selectedIds.size})
              </button>
            )}
            <button onClick={handleExportCSV} className="btn-secondary">
              <FiDownload className="inline mr-2" /> Export CSV
            </button>
            <button onClick={handleExportExcel} className="btn-secondary">
              <FiDownload className="inline mr-2" /> Export Excel
            </button>
            <Link href="/clubs/create" className="btn-primary">
              <FiPlus className="inline mr-2" /> Add Club
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 card">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search clubs by name, email, or code..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="form-input flex-1"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center gap-2 ${showFilters ? 'ring-2 ring-purple-500' : ''}`}
            >
              <FiFilter /> Filters
              {(filterCity || filterStatus) && (
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {(filterCity ? 1 : 0) + (filterStatus ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-white border-opacity-10">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-300 mb-1">City</label>
                  <select
                    value={filterCity}
                    onChange={e => setFilterCity(e.target.value)}
                    className="form-input"
                  >
                    <option value="" className="bg-slate-800 text-white">All Cities</option>
                    {uniqueCities.map(city => (
                      <option key={city} value={city} className="bg-slate-800 text-white">{city}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value as '' | 'active' | 'inactive')}
                    className="form-input"
                  >
                    <option value="" className="bg-slate-800 text-white">All Status</option>
                    <option value="active" className="bg-slate-800 text-white">Active</option>
                    <option value="inactive" className="bg-slate-800 text-white">Inactive</option>
                  </select>
                </div>
                {(filterCity || filterStatus) && (
                  <button onClick={clearFilters} className="btn-secondary flex items-center gap-1 text-red-400">
                    <FiX /> Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="card table-container">
          {loading ? (
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ height: 48, borderRadius: 8, background: 'rgba(255,255,255,0.08)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="text-center py-8 text-gray-300">No clubs found</div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredClubs.length && filteredClubs.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-600"
                      />
                    </th>
                    <th>Club Name</th>
                    <th>Club Code</th>
                    <th>Embassy ID</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClubs.map(club => (
                    <tr key={club.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(club.id)}
                          onChange={() => toggleSelect(club.id)}
                          className="rounded border-gray-600"
                        />
                      </td>
                      <td className="font-medium">{club.name}</td>
                      <td>{club.shortCode}</td>
                      <td>
                        {editingEmbassyId === club.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editEmbassyValue}
                              onChange={e => setEditEmbassyValue(e.target.value)}
                              className="form-input text-xs py-1 px-2 w-32"
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveEmbassyId(club.id);
                                if (e.key === 'Escape') setEditingEmbassyId(null);
                              }}
                              autoFocus
                            />
                            <button onClick={() => saveEmbassyId(club.id)} className="text-green-400 text-xs">Save</button>
                            <button onClick={() => setEditingEmbassyId(null)} className="text-gray-400 text-xs">Cancel</button>
                          </div>
                        ) : (
                          <span
                            className="cursor-pointer hover:text-purple-300"
                            onClick={() => {
                              setEditingEmbassyId(club.id);
                              setEditEmbassyValue(club.eId || '');
                            }}
                            title="Click to edit"
                          >
                            {club.eId || '—'}
                          </span>
                        )}
                      </td>
                      <td>{club.primaryContact?.firstName}</td>
                      <td>{club.primaryContact?.lastName}</td>
                      <td>{club.email || club.primaryContact?.email}</td>
                      <td>{club.city}</td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          club.isActive ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-red-500 bg-opacity-20 text-red-400'
                        }`}>
                          {club.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <ActionsDropdown actions={[
                          { label: 'View', icon: <FiEye className="w-4 h-4" />, onClick: () => router.push(`/clubs/${club.id}?mode=view`) },
                          { label: 'Edit', icon: <FiEdit2 className="w-4 h-4" />, onClick: () => router.push(`/clubs/${club.id}`), className: 'text-amber-400 hover:text-amber-300' },
                          { label: 'Delete', icon: <FiTrash2 className="w-4 h-4" />, onClick: () => deleteClub(club.id), className: 'text-red-400 hover:text-red-300' },
                        ]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-300">
                    Page {page} of {pages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(pages, page + 1))}
                    disabled={page === pages}
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

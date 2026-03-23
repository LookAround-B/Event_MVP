import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { FiEdit2, FiTrash2, FiPlus, FiDownload } from 'react-icons/fi';

interface Club {
  id: string;
  eId: string;
  name: string;
  shortCode: string;
  email: string;
  contactNumber: string;
  address: string;
  city: string;
  primaryContact: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  isActive: boolean;
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
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
    if (selectedIds.size === clubs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(clubs.map(c => c.id)));
    }
  };

  const getExportData = () => {
    const headers = ['Club Name', 'Code', 'Contact Person', 'Email', 'City'];
    const source = selectedIds.size > 0 ? clubs.filter(c => selectedIds.has(c.id)) : clubs;
    const rows = source.map(c => [
      c.name,
      c.shortCode,
      `${c.primaryContact.firstName} ${c.primaryContact.lastName}`,
      c.email || c.primaryContact.email,
      c.city,
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

  const pages = Math.ceil(total / limit);

  return (
    <ProtectedRoute>
      <Head><title>Clubs | Equestrian Events</title></Head>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">Clubs</h2>
          <div className="flex gap-3">
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

        {/* Search */}
        <div className="mb-6 card">
          <input
            type="text"
            placeholder="Search clubs by name, email, or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input w-full"
          />
        </div>

        {/* Table */}
        <div className="card table-container">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-gray-300 mt-2">Loading clubs...</p>
            </div>
          ) : clubs.length === 0 ? (
            <div className="text-center py-8 text-gray-300">No clubs found</div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === clubs.length && clubs.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-600"
                      />
                    </th>
                    <th>Club Name</th>
                    <th>Code</th>
                    <th>Contact Person</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clubs.map(club => (
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
                        {club.primaryContact.firstName} {club.primaryContact.lastName}
                      </td>
                      <td>{club.email || club.primaryContact.email}</td>
                      <td>{club.city}</td>
                      <td>
                        <div className="flex space-x-2">
                          <Link href={`/clubs/${club.id}`} className="text-blue-400 hover:text-blue-300">
                            <FiEdit2 size={18} title="Edit" />
                          </Link>
                          <button
                            onClick={() => deleteClub(club.id)}
                            className="text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
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

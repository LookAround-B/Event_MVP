import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Eye, Download, Filter, X } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import ActionsDropdown from '@/components/ActionsDropdown';
import AuditPagination from '@/components/AuditPagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

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
      <div className="animate-fade-in max-w-[1600px] mx-auto">
        {/* ═══ Header ═══ */}
        <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl lg:text-5xl">
              Horse <span className="gradient-text">Registry</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">Complete inventory of equine athletes registered across the platform.</p>
          </div>
        </div>

        {/* ═══ Filter / Action Bar ═══ */}
        <div className="bento-card p-4 mb-4 lg:mb-6 animate-slide-up-2 border-beam">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search horses..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="pl-10 pr-4 py-2.5 bg-surface-container/50 rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-full sm:w-72 border border-border/30 transition-all focus:bg-surface-container"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border border-border/30 transition-colors ${activeFilterCount > 0 ? 'border-primary/50 text-primary bg-primary/5' : 'bg-surface-container/60 text-on-surface-variant hover:bg-surface-bright'}`}
              >
                <Filter className="w-4 h-4" /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-surface-container/60 rounded-xl text-sm text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/30">
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">CSV</span>
              </button>
              <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-surface-container/60 rounded-xl text-sm text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/30">
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Excel</span>
              </button>
              <Link href="/horses/create" className="flex items-center gap-2 px-4 sm:px-5 py-2.5 btn-cta rounded-xl text-sm font-bold flex-1 sm:flex-initial justify-center shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> New Horse
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="bento-card p-4 mb-4 border-l-4 border-destructive text-destructive text-sm animate-slide-up">{error}</div>
        )}

        {showFilters && (
          <div className="bento-card mb-4">
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="form-label">Sex</label>
                  <Select value={filterGender || '__all__'} onValueChange={(v) => { setFilterGender(v === '__all__' ? '' : v); setPage(1); }}>
                    <SelectTrigger className="bg-surface-container border-border/30 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All</SelectItem>
                      <SelectItem value="Stallion">Stallion</SelectItem>
                      <SelectItem value="Mare">Mare</SelectItem>
                      <SelectItem value="Gelding">Gelding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="form-label">Club</label>
                  <Select value={filterClubId || '__all__'} onValueChange={(v) => { setFilterClubId(v === '__all__' ? '' : v); setPage(1); }}>
                    <SelectTrigger className="bg-surface-container border-border/30 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Clubs</SelectItem>
                      {clubs.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="form-label">Rider</label>
                  <Select value={filterRiderId || '__all__'} onValueChange={(v) => { setFilterRiderId(v === '__all__' ? '' : v); setPage(1); }}>
                    <SelectTrigger className="bg-surface-container border-border/30 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Riders</SelectItem>
                      {riders.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.firstName} {r.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <Select value={filterStatus || '__all__'} onValueChange={(v) => { setFilterStatus(v === '__all__' ? '' : v); setPage(1); }}>
                    <SelectTrigger className="bg-surface-container border-border/30 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
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
          </div>
        )}

        <div className="bento-card overflow-hidden animate-slide-up-3">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-surface-container/40 animate-pulse" />
              ))}
            </div>
          ) : horses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No horses match your search' : 'No horses in inventory yet. Add one to get started!'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1100px]">
                <thead>
                  <tr className="label-tech text-left bg-surface-container/40">
                    <th className="p-3 sm:p-4 w-12">
                      <input type="checkbox" checked={selectedIds.size === horses.length && horses.length > 0} onChange={toggleSelectAll} className="accent-primary rounded" />
                    </th>
                    <th className="p-3 sm:p-4">Horse Name</th>
                    <th className="p-3 sm:p-4">Sex</th>
                    <th className="p-3 sm:p-4">Birth Year</th>
                    <th className="p-3 sm:p-4">Passport #</th>
                    <th className="p-3 sm:p-4">Embassy ID</th>
                    <th className="p-3 sm:p-4">Rider</th>
                    <th className="p-3 sm:p-4">Club</th>
                    <th className="p-3 sm:p-4">User Type</th>
                    <th className="p-3 sm:p-4">Color</th>
                    <th className="p-3 sm:p-4">Status</th>
                    <th className="p-3 sm:p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {horses.map((horse) => (
                    <tr key={horse.id} className="group hover:bg-surface-container/20 transition-all duration-300">
                      <td className="p-3 sm:p-4">
                        <input type="checkbox" checked={selectedIds.has(horse.id)} onChange={() => toggleSelect(horse.id)} className="accent-primary rounded" />
                      </td>
                      <td className="p-3 sm:p-4 font-bold text-on-surface">🐎 {horse.name}</td>
                      <td className="p-3 sm:p-4 text-on-surface-variant">{horse.gender || '-'}</td>
                      <td className="p-3 sm:p-4 text-on-surface-variant">{horse.yearOfBirth || '-'}</td>
                      <td className="p-3 sm:p-4 text-xs font-mono text-secondary">{horse.passportNumber || '-'}</td>
                      <td className="p-3 sm:p-4 text-xs font-mono text-secondary">{horse.embassyId || '-'}</td>
                      <td className="p-3 sm:p-4 text-on-surface-variant">{horse.riderName || '-'}</td>
                      <td className="p-3 sm:p-4 text-on-surface-variant">{horse.clubName || '-'}</td>
                      <td className="p-3 sm:p-4">
                        {horse.userType ? (
                          <span className="badge badge-info text-xs">{horse.userType}</span>
                        ) : '-'}
                      </td>
                      <td className="p-3 sm:p-4 text-on-surface-variant">{horse.color || '-'}</td>
                      <td className="p-3 sm:p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${horse.isActive ? 'bg-primary/10 text-primary border-primary/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                          {horse.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-right">
                        <ActionsDropdown actions={[
                          { label: 'View', icon: <Eye className="w-4 h-4" />, onClick: () => router.push(`/horses/${horse.id}`) },
                          { label: 'Edit', icon: <Edit className="w-4 h-4" />, onClick: () => router.push(`/horses/create?id=${horse.id}`), className: 'text-amber-400 hover:text-amber-300' },
                          { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: () => handleDelete(horse.id), className: 'text-destructive hover:text-destructive' },
                        ]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              <div className="border-t border-border/10 bg-surface-container/20 p-3">
                <AuditPagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-0" />
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Eye, Download, Ban, Users, Landmark, ShieldCheck, Activity, Tent } from 'lucide-react';
import api from '@/lib/api';
import { exportBrandedExcel, exportCSV } from '@/utils/brandedExcel';
import ProtectedRoute from '@/lib/protected-route';
import ActionsDropdown from '@/components/ActionsDropdown';
import { KPICard } from '@/components/dashboard/KPICard';
import { KPIGrid } from '@/components/dashboard/KPIGrid';
import { FilterDropdown } from '@/components/FilterDropdown';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

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


export default function Riders() {
  const router = useRouter();
  const { isRider } = useAuth();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterGender, setFilterGender] = useState('');
  const [filterClubId, setFilterClubId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 10;

  useEffect(() => { fetchClubs(); }, []);
  useEffect(() => { fetchRiders(); }, [page, searchTerm, filterGender, filterClubId, filterStatus]);

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
      setTotalCount(response.data.data.pagination.total || response.data.data.riders.length);
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
      r.firstName, r.lastName, r.email, r.mobile || '-', r.gender || '-',
      r.efiRiderId || '-', r.eId || '-', r.clubName || '-', r.registrationCount,
    ]);
    return { headers, rows };
  };

  const handleExportCSV = () => {
    const { headers, rows } = getExportData();
    exportCSV(headers, rows, 'riders');
    toast.success('Riders exported as CSV');
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    void exportBrandedExcel({
      sheetTitle: 'Riders',
      subtitle: 'Riders Report',
      headers,
      rows,
      filename: 'riders',
      columnWidths: [16, 16, 26, 14, 10, 16, 16, 20, 14],
    }).then(() => toast.success('Riders exported as Excel'));
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

  // Compute KPI values
  const uniqueClubs = new Set(riders.map(r => r.clubName).filter(Boolean)).size;
  const efiRegistered = riders.filter(r => r.efiRiderId).length;
  const showingStart = (page - 1) * perPage + 1;
  const showingEnd = Math.min(page * perPage, totalCount);

  return (
    <ProtectedRoute>
      <Head><title>Riders | Equestrian Events</title></Head>
      <div className="animate-fade-in max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl lg:text-5xl">
              Athlete <span className="gradient-text-purple">Managment</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl italic">
              &ldquo;The essential joy of being with horses is that it brings us in contact with the rare elements of grace, beauty, spirit and freedom.&rdquo;
            </p>
          </div>
          <div className="flex items-center gap-2 bg-surface-container/40 p-2 rounded-xl border border-border/30">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-on-surface tracking-widest uppercase">Live Portal Database</span>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl mb-6 text-sm bg-destructive/10 border border-destructive/30 text-destructive">
            {error}
          </div>
        )}

        {/* KPI Stats Cards */}
        <KPIGrid>
          <KPICard
            title="Total Elite Riders"
            value={totalCount}
            icon={Users}
            variant="primary"
            trend={{ value: "+8%", isUp: true }}
            subText="Verified Athletes"
            className="animate-slide-up-1"
          />
          <KPICard
            title="Active Clubs"
            value={uniqueClubs || clubs.length}
            icon={Landmark}
            variant="outline"
            subText="Partner Academies"
            className="animate-slide-up-2"
          />
          <KPICard
            title="EFI Registered"
            value={efiRegistered || totalCount}
            icon={ShieldCheck}
            variant="outline"
            subText="National Identity"
            className="animate-slide-up-3"
          />
          <KPICard
            title="Activity Level"
            value="High"
            icon={Activity}
            variant="secondary"
            subText="Season: 2024-25"
            className="animate-slide-up-4"
          />
        </KPIGrid>

        {/* Search & Actions */}
        <div className="bento-card p-4 mb-4 lg:mb-6 animate-slide-up-2 border-beam">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="search-input-icon pointer-events-none absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Find athlete..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="search-input-with-icon pr-4 py-2.5 bg-surface-container/50 rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-full sm:w-72 border border-border/30 transition-all focus:bg-surface-container"
                />
              </div>
              <FilterDropdown
                label="Gender"
                options={[
                  { label: "Male", value: "Male" },
                  { label: "Female", value: "Female" },
                  { label: "Other", value: "Other" },
                ]}
                selected={filterGender ? [filterGender] : []}
                onChange={(vals) => { setFilterGender(vals[0] || ''); setPage(1); }}
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {selectedIds.size > 0 && (
                <button onClick={handleBulkDelete} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/15 transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete ({selectedIds.size})
                </button>
              )}
              {!isRider && (
                <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-surface-container/60 rounded-xl text-sm text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/30">
                  <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
                </button>
              )}
              <Link href="/riders/create" className="flex items-center gap-2 px-4 sm:px-5 py-2.5 btn-cta rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex-1 sm:flex-initial justify-center">
                <Plus className="w-4 h-4" /> New Rider
              </Link>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bento-card overflow-hidden animate-slide-up-3">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary/50 via-primary/50 to-secondary/50" />
          {loading ? (
            <div className="py-6 px-4 flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl bg-border/20" />
              ))}
            </div>
          ) : riders.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground italic">
              {searchTerm || hasActiveFilters ? 'No riders match your search/filters' : 'No riders registered yet. Add one to get started!'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[750px]">
                  <thead>
                    <tr className="label-tech text-left bg-surface-container/40">
                      <th className="p-3 sm:p-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === riders.length && riders.length > 0}
                          onChange={toggleSelectAll}
                          className="accent-primary rounded"
                        />
                      </th>
                      <th className="p-3 sm:p-4">Athlete Identity</th>
                      <th className="p-3 sm:p-4">Affiliation</th>
                      <th className="p-3 sm:p-4">Contact Gateway</th>
                      <th className="p-3 sm:p-4">Registry Identifiers</th>
                      <th className="p-3 sm:p-4">Gender</th>
                      <th className="p-3 sm:p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {riders.map((rider) => (
                      <tr key={rider.id} className="group hover:bg-surface-container/20 transition-all duration-300">
                        <td className="p-3 sm:p-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(rider.id)}
                            onChange={() => toggleSelect(rider.id)}
                            className="accent-primary rounded"
                          />
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-container/50 flex items-center justify-center text-xs font-bold text-primary border border-primary/20">
                              {rider.firstName[0]}{(rider.lastName || '')[0] || ''}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-on-surface font-bold tracking-tight">{rider.firstName} {rider.lastName}</span>
                              <span className="text-[10px] text-muted-foreground">ID: {rider.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center gap-1.5">
                            <Tent className="w-3 h-3 text-secondary" />
                            <span className="text-on-surface-variant font-medium text-xs">{rider.clubName || 'Independent'}</span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-on-surface-variant">
                          <span className="text-xs font-mono">{rider.email}</span>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-[10px] text-secondary bg-secondary/5 px-2 py-0.5 rounded border border-secondary/20 w-fit">
                              EFI: {rider.efiRiderId || 'N/A'}
                            </span>
                            <span className="font-mono text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/20 w-fit">
                              EIRS: {rider.eId}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{rider.gender || '-'}</span>
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => router.push(`/riders/${rider.id}`)} title="Profile View" className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-all active:scale-95"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => router.push(`/riders/create?id=${rider.id}`)} title="Edit Record" className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-all active:scale-95"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(rider.id)} title="Archive" className="p-2 rounded-lg hover:bg-destructive/10 text-on-surface-variant hover:text-destructive transition-all active:scale-95"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-surface-container/20 px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Showing {showingStart}-{showingEnd} of {totalCount}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-on-surface hover:bg-surface-container disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                          page === pageNum
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-on-surface hover:bg-surface-container disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

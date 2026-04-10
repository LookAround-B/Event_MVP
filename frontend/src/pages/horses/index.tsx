import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Eye, Download, Shield, Trophy, Activity, Info, User, Building2 } from 'lucide-react';
import api from '@/lib/api';
import { exportBrandedExcel, exportCSV } from '@/utils/brandedExcel';
import ProtectedRoute from '@/lib/protected-route';
import ActionsDropdown from '@/components/ActionsDropdown';
import { KPICard } from '@/components/dashboard/KPICard';
import { KPIGrid } from '@/components/dashboard/KPIGrid';
import { FilterDropdown } from '@/components/FilterDropdown';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [filterGender, setFilterGender] = useState('');
  const [filterClubId, setFilterClubId] = useState('');
  const [filterRiderId, setFilterRiderId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 10;

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
      setTotalCount(response.data.data.pagination.total || response.data.data.horses.length);
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

  const handleExportCSV = () => {
    const { headers, rows } = getExportData();
    exportCSV(headers, rows, 'horses');
    toast.success('Horses exported as CSV');
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    void exportBrandedExcel({
      sheetTitle: 'Horses',
      subtitle: 'Horses Report',
      headers,
      rows,
      filename: 'horses',
      columnWidths: [20, 14, 10, 12, 12, 10, 16, 16, 20, 18, 14, 12, 14],
    }).then(() => toast.success('Horses exported as Excel'));
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

  const clearFilters = () => {
    setFilterGender('');
    setFilterClubId('');
    setFilterRiderId('');
    setFilterStatus('');
    setPage(1);
  };

  const activeFilterCount = [filterGender, filterClubId, filterRiderId, filterStatus].filter(Boolean).length;

  // KPI computations
  const clubOwned = horses.filter(h => h.userType === 'CLUB' || h.clubName).length;
  const activeCount = horses.filter(h => h.isActive).length;
  const showingStart = (page - 1) * perPage + 1;
  const showingEnd = Math.min(page * perPage, totalCount);

  return (
    <ProtectedRoute>
      <Head><title>Horses | Equestrian Events</title></Head>
      <div className="animate-fade-in max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl lg:text-5xl">
            Equine <span className="gradient-text">Catalogue</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Global registry of all competing equine assets and stable rosters. Monitor biological data, ownership details, and regulatory compliance.
          </p>
        </div>

        {error && (
          <div className="bento-card p-4 mb-4 border-l-4 border-destructive text-destructive text-sm animate-slide-up">{error}</div>
        )}

        {/* KPI Stats Cards */}
        <KPIGrid>
          <KPICard
            title="Equine Registry"
            value={totalCount}
            icon={Shield}
            variant="primary"
            trend={{ value: "+4", isUp: true }}
            subText="Verified assets"
            className="animate-slide-up-1"
          />
          <KPICard
            title="Elite Performance"
            value={clubOwned || clubs.length}
            icon={Trophy}
            variant="outline"
            subText="Club owned stables"
            className="animate-slide-up-2"
          />
          <KPICard
            title="Active Roster"
            value={activeCount || totalCount}
            icon={Activity}
            variant="outline"
            subText="Fit for competition"
            className="animate-slide-up-3"
          />
          <KPICard
            title="Global Health"
            value="Optimum"
            icon={Info}
            variant="secondary"
            subText="Check: 2h ago"
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
                  placeholder="Find asset..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="search-input-with-icon pr-4 py-2.5 bg-surface-container/50 rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-full sm:w-72 border border-border/30 transition-all focus:bg-surface-container"
                />
              </div>
              <FilterDropdown
                label="Gender"
                options={[
                  { label: "Stallion", value: "Stallion" },
                  { label: "Mare", value: "Mare" },
                  { label: "Gelding", value: "Gelding" },
                ]}
                selected={filterGender ? [filterGender] : []}
                onChange={(vals) => { setFilterGender(vals[0] || ''); setPage(1); }}
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {selectedIds.size > 0 && (
                <button onClick={async () => {
                  if (selectedIds.size === 0) return;
                  if (!confirm(`Delete ${selectedIds.size} selected horse(s)?`)) return;
                  try {
                    await Promise.all(Array.from(selectedIds).map(hid => api.delete(`/api/horses/${hid}`)));
                    toast.success(`${selectedIds.size} horse(s) deleted`);
                    setSelectedIds(new Set());
                    fetchHorses();
                  } catch { toast.error('Failed to delete some horses'); }
                }} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/15 transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete ({selectedIds.size})
                </button>
              )}
              <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-surface-container/60 rounded-xl text-sm text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/30">
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export Registry</span>
              </button>
              <Link href="/horses/create" className="flex items-center gap-2 px-4 sm:px-5 py-2.5 btn-cta rounded-xl text-sm font-bold flex-1 sm:flex-initial justify-center shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> Onboard Asset
              </Link>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bento-card overflow-hidden animate-slide-up-3">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary/40 via-primary/40 to-secondary/40" />
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl bg-border/20" />
              ))}
            </div>
          ) : horses.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground italic">
              {searchTerm || activeFilterCount ? 'No horses match your search/filters' : 'No equine assets registered yet. Add one to get started!'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[950px]">
                  <thead>
                    <tr className="label-tech text-left bg-surface-container/40">
                      <th className="p-3 sm:p-4 w-12">
                        <input type="checkbox" checked={selectedIds.size === horses.length && horses.length > 0} onChange={toggleSelectAll} className="accent-primary rounded" />
                      </th>
                      <th className="p-3 sm:p-4">Asset Identity</th>
                      <th className="p-3 sm:p-4">Ownership Map</th>
                      <th className="p-3 sm:p-4">Biological Data</th>
                      <th className="p-3 sm:p-4">Regulatory Meta</th>
                      <th className="p-3 sm:p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {horses.map((horse) => (
                      <tr key={horse.id} className="group hover:bg-surface-container/20 transition-all duration-300">
                        <td className="p-3 sm:p-4">
                          <input type="checkbox" checked={selectedIds.has(horse.id)} onChange={() => toggleSelect(horse.id)} className="accent-primary rounded" />
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform border border-border/30">
                              <Shield className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-on-surface font-bold tracking-tight">{horse.name}</span>
                              <span className="text-[10px] text-muted-foreground/70 uppercase tracking-widest">{horse.color || '—'} · {horse.yearOfBirth || '—'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 font-medium text-on-surface-variant">
                              {horse.userType === 'CLUB' ? <Building2 className="w-3 h-3 text-primary" /> : <User className="w-3 h-3 text-secondary" />}
                              <span className="truncate max-w-[180px]">
                                {horse.riderName || horse.clubName || 'Unassigned'}
                                {horse.riderName && horse.clubName ? ` / ${horse.clubName}` : ''}
                              </span>
                            </div>
                            <span className={`text-[9px] w-fit px-1.5 py-0.5 rounded font-black uppercase tracking-tighter mt-1 border ${
                              horse.userType === 'CLUB'
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : 'bg-secondary/10 text-secondary border-secondary/20'
                            }`}>
                              {horse.userType || (horse.riderName ? 'RIDER' : horse.clubName ? 'CLUB' : '—')}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex flex-col">
                            <span className="text-on-surface-variant font-medium">{horse.gender || '—'}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{horse.breed || 'Crossbreed'}</span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono text-secondary tracking-widest font-black uppercase">{horse.embassyId || '—'}</span>
                            <span className="text-[9px] text-muted-foreground/60">Passport: {horse.passportNumber || '—'}</span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => router.push(`/horses/${horse.id}`)} title="Deep View" className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-all active:scale-95"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => router.push(`/horses/create?id=${horse.id}`)} title="Configure" className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-all active:scale-95"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(horse.id)} title="Decommission" className="p-2 rounded-lg hover:bg-destructive/10 text-on-surface-variant hover:text-destructive transition-all active:scale-95"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-surface-container/20 px-4 py-3 flex items-center justify-between border-t border-border/10">
                <span className="text-xs text-muted-foreground">
                  Showing <strong>{showingStart}-{showingEnd}</strong> of <strong>{totalCount}</strong>
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

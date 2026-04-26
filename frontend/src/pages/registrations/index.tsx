import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Search, Download, Eye, Edit,
  ClipboardCheck, Activity, CreditCard, AlertCircle, Calendar, Trophy, Check,
} from 'lucide-react';
import api from '@/lib/api';
import { exportBrandedExcel, exportCSV } from '@/utils/brandedExcel';
import ProtectedRoute from '@/lib/protected-route';
import ExportModal from '@/components/ExportModal';
import ViewModal from '@/components/ViewModal';
import ConfirmModal from '@/components/ConfirmModal';
import AuditPagination from '@/components/AuditPagination';
import { FilterDropdown } from '@/components/FilterDropdown';
import { KPICard } from '@/components/dashboard/KPICard';
import { KPIGrid } from '@/components/dashboard/KPIGrid';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';
import { useAuth } from '@/hooks/useAuth';

/* ─── Types (preserved) ─── */
interface Registration {
  id: string;
  eventAmount: number;
  stableAmount: number;
  gstAmount: number;
  totalAmount: number;
  paymentStatus: string;
  rider: { firstName: string; lastName: string; email: string };
  horse: { id: string; name: string; color?: string; gender: string };
  event: { id: string; name: string; startDate: string; endDate: string };
  createdAt: string;
}

/* ─── CSV/Excel utilities (preserved) ─── */


/* ─── Badge helpers ─── */
const paymentBadge = (s: string) => {
  switch (s?.toUpperCase()) {
    case 'PAID': return 'bg-primary/10 text-primary border-primary/20';
    case 'UNPAID': return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'PARTIAL': return 'bg-secondary/10 text-secondary border-secondary/20';
    default: return 'bg-surface-container text-muted-foreground border-border/30';
  }
};

const PER_PAGE = 10;

export default function Registrations() {
  const { isAdmin } = useAuth();
  /* ─── State (all backend state preserved) ─── */
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /* ─── Modal state ─── */
  const [viewItem, setViewItem] = useState<Registration | null>(null);
  const [deleteItem, setDeleteItem] = useState<Registration | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  /* ─── Create modal state ─── */
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ eventId: '', riderId: '', horseId: '', categoryId: '' });
  const [createEvents, setCreateEvents] = useState<{ id: string; name: string }[]>([]);
  const [createRiders, setCreateRiders] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [createHorses, setCreateHorses] = useState<{ id: string; name: string }[]>([]);
  const [createCategories, setCreateCategories] = useState<{ id: string; name: string; price: number }[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createDataLoading, setCreateDataLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const openCreateModal = useCallback(async () => {
    setCreateOpen(true);
    setCreateForm({ eventId: '', riderId: '', horseId: '', categoryId: '' });
    setCreateCategories([]);
    setCreateError(null);
    try {
      setCreateDataLoading(true);
      const [eventsRes, ridersRes, horsesRes] = await Promise.all([
        api.get('/api/events?limit=100'),
        api.get('/api/riders?limit=100'),
        api.get('/api/horses?limit=100'),
      ]);
      setCreateEvents(Array.isArray(eventsRes.data?.data?.events) ? eventsRes.data.data.events : []);
      setCreateRiders(Array.isArray(ridersRes.data?.data?.riders) ? ridersRes.data.data.riders : []);
      setCreateHorses(Array.isArray(horsesRes.data?.data?.horses) ? horsesRes.data.data.horses : []);
    } catch (err: any) {
      setCreateError(err.response?.status === 401 ? 'Not authenticated. Please log in first.' : 'Failed to load dropdown data');
    } finally {
      setCreateDataLoading(false);
    }
  }, []);

  const handleCreateEventChange = async (eventId: string) => {
    setCreateForm(prev => ({ ...prev, eventId, categoryId: '' }));
    if (eventId) {
      try {
        const response = await api.get(`/api/events/${eventId}`);
        setCreateCategories(response.data.data.categories || []);
      } catch { setCreateCategories([]); }
    } else {
      setCreateCategories([]);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!createForm.eventId || !createForm.riderId || !createForm.horseId || !createForm.categoryId) {
      setCreateError('All fields are required');
      return;
    }
    try {
      setCreateLoading(true);
      await api.post('/api/registrations', createForm);
      toast.success('Registration created successfully!');
      setCreateOpen(false);
      fetchRegistrations();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create registration');
    } finally {
      setCreateLoading(false);
    }
  };

  /* ─── Data fetching (preserved) ─── */
  useEffect(() => {
    fetchRegistrations();
  }, [page, statusFilter]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/registrations', {
        params: {
          page,
          limit: PER_PAGE,
          status: statusFilter || (selectedStatuses.length === 1 ? selectedStatuses[0] : ''),
        },
      });
      setRegistrations(response.data.data.registrations);
      setTotalPages(response.data.data.pagination.pages);
      setTotalCount(response.data.data.pagination.total || response.data.data.registrations.length);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
      setError('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Selection handlers (preserved) ─── */
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

  /* ─── Export (preserved) ─── */
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

  const handleExport = (type: 'csv' | 'excel') => {
    const { headers, rows } = getExportData();
    if (type === 'csv') {
      exportCSV(headers, rows, 'registrations');
      toast.success('Registrations exported as CSV');
      setExportOpen(false);
    } else {
      void exportBrandedExcel({
        sheetTitle: 'Registrations',
        subtitle: 'Registrations Report',
        headers,
        rows,
        filename: 'registrations',
        columnWidths: [26, 22, 26, 14, 16],
      }).then(() => toast.success('Registrations exported as Excel'));
      setExportOpen(false);
    }
  };

  /* ─── Delete (preserved) ─── */
  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await api.delete(`/api/registrations/${deleteItem.id}`);
      setRegistrations(registrations.filter(r => r.id !== deleteItem.id));
      selectedIds.delete(deleteItem.id);
      setSelectedIds(new Set(selectedIds));
      toast.success('Registration deleted successfully');
    } catch (err) {
      console.error('Failed to delete registration:', err);
      toast.error('Failed to delete registration');
    }
  };

  /* ─── Client-side search filter ─── */
  const displayed = registrations.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${r.rider.firstName} ${r.rider.lastName}`.toLowerCase().includes(q) ||
      r.horse.name.toLowerCase().includes(q) ||
      r.event.name.toLowerCase().includes(q)
    );
  });

  /* ─── KPI calculations ─── */
  const paidCount = registrations.filter(r => r.paymentStatus === 'PAID').length;
  const unpaidRevenue = registrations.filter(r => r.paymentStatus !== 'PAID').reduce((s, r) => s + r.totalAmount, 0);

  return (
    <ProtectedRoute>
      <Head><title>Registrations | Equestrian Events</title></Head>
      <BoneyardSkeleton name="registrations-page" loading={false}>
      <div className="animate-fade-in max-w-[1600px] mx-auto">

        {/* ═══ Page Header ═══ */}
        <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl lg:text-5xl">
              Event <span className="gradient-text">Logistics</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Coordinate rider participation, horse logistics, and financial clearances for upcoming season events.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container/40 px-4 py-2 rounded-2xl border border-border/30">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-on-surface tracking-widest">REGISTRATION: OPEN</span>
          </div>
        </div>

        {/* ═══ KPI Cards ═══ */}
        <KPIGrid>
          <KPICard
            title="Total Entries"
            value={totalCount || registrations.length}
            icon={ClipboardCheck}
            variant="primary"
            subText="Current Season"
            className="animate-slide-up-1"
          />
          <KPICard
            title="Paid Entries"
            value={paidCount}
            icon={Activity}
            variant="outline"
            subText="Ready to compete"
            className="animate-slide-up-2"
          />
          <KPICard
            title="Pending Revenue"
            value={`₹${(unpaidRevenue / 1000).toFixed(1)}k`}
            icon={CreditCard}
            variant="outline"
            subText="Awaiting payment"
            className="animate-slide-up-3"
          />
          <KPICard
            title="This Page"
            value={registrations.length}
            icon={AlertCircle}
            variant="secondary"
            subText={`Page ${page} of ${totalPages}`}
            className="animate-slide-up-4"
          />
        </KPIGrid>

        {/* ═══ Filter / Action Bar ═══ */}
        <div className="bento-card p-4 mb-4 lg:mb-6 animate-slide-up-2 border-beam">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="search-input-icon pointer-events-none absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input-with-icon pr-4 py-3 bg-surface-container/50 rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-full sm:w-72 border border-border/30 transition-all focus:bg-surface-container"
                  placeholder="Find entry..."
                />
              </div>
              <FilterDropdown
                label="Payment Status"
                options={[
                  { label: 'Paid', value: 'PAID' },
                  { label: 'Unpaid', value: 'UNPAID' },
                  { label: 'Partial', value: 'PARTIAL' },
                  { label: 'Cancelled', value: 'CANCELLED' },
                ]}
                selected={selectedStatuses}
                onChange={(vals) => {
                  setSelectedStatuses(vals);
                  setStatusFilter(vals.length === 1 ? vals[0] : '');
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {isAdmin && (
                <button onClick={() => setExportOpen(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-surface-container/60 rounded-xl text-sm text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/30">
                  <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
                </button>
              )}
              <button onClick={openCreateModal} className="flex items-center gap-2 px-4 sm:px-5 py-2.5 btn-cta rounded-xl text-sm font-bold flex-1 sm:flex-initial justify-center shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> New Entry
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bento-card p-4 mb-4 border-l-4 border-destructive text-destructive text-sm animate-slide-up">
            {error}
          </div>
        )}

        {/* ═══ Table ═══ */}
        <div className="bento-card overflow-hidden animate-slide-up-3">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl bg-border/20" />
                ))}
              </div>
            ) : displayed.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground italic">
                {statusFilter ? 'No registrations with this status' : 'No event registrations found.'}
              </div>
            ) : (
              <table className="w-full text-sm min-w-[950px]">
                <thead>
                  <tr className="label-tech text-left bg-surface-container/40">
                    <th className="p-3 sm:p-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === registrations.length && registrations.length > 0}
                        onChange={toggleSelectAll}
                        className="accent-primary rounded"
                      />
                    </th>
                    <th className="p-3 sm:p-4">Event & Category</th>
                    <th className="p-3 sm:p-4">Competitor</th>
                    <th className="p-3 sm:p-4">Horse</th>
                    <th className="p-3 sm:p-4">Fee Details</th>
                    <th className="p-3 sm:p-4">Payment</th>
                    <th className="p-3 sm:p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {displayed.map((reg) => (
                    <tr key={reg.id} className="group hover:bg-surface-container/20 transition-all duration-300">
                      <td className="p-3 sm:p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(reg.id)}
                          onChange={() => toggleSelect(reg.id)}
                          className="accent-primary rounded"
                        />
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex flex-col">
                          <span className="text-on-surface font-bold tracking-tight line-clamp-1 text-xs">{reg.event.name}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Trophy className="w-3 h-3 text-secondary" />
                            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                              {new Date(reg.event.startDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 font-medium text-on-surface-variant">
                        {reg.rider.firstName} {reg.rider.lastName}
                      </td>
                      <td className="p-3 sm:p-4">
                        <span className="text-xs text-on-surface-variant font-mono">🐎 {reg.horse.name}</span>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-on-surface">₹{reg.totalAmount.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-muted-foreground/60 font-mono tracking-tighter">ID: {reg.id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${paymentBadge(reg.paymentStatus)}`}>
                          {reg.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setViewItem(reg)} title="Inspect" className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-all active:scale-95">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteItem(reg)} title="Cancel" className="p-2 rounded-lg hover:bg-destructive/10 text-on-surface-variant hover:text-destructive transition-all active:scale-95">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="bg-surface-container/20 p-2 border-t border-border/10">
            <AuditPagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-0" />
          </div>
        </div>

        {/* ═══ Modals (popup forms) ═══ */}
        <ViewModal
          open={!!viewItem}
          onClose={() => setViewItem(null)}
          title="Registration Details"
          fields={viewItem ? [
            { label: 'Registration ID', value: viewItem.id },
            { label: 'Event', value: viewItem.event.name },
            { label: 'Event Date', value: new Date(viewItem.event.startDate).toLocaleDateString() },
            { label: 'Rider', value: `${viewItem.rider.firstName} ${viewItem.rider.lastName}` },
            { label: 'Rider Email', value: viewItem.rider.email },
            { label: 'Horse', value: `${viewItem.horse.name} (${viewItem.horse.gender})` },
            { label: 'Event Amount', value: `₹${viewItem.eventAmount.toLocaleString('en-IN')}` },
            { label: 'Stable Amount', value: `₹${viewItem.stableAmount.toLocaleString('en-IN')}` },
            { label: 'GST Amount', value: `₹${viewItem.gstAmount.toLocaleString('en-IN')}` },
            { label: 'Total Amount', value: `₹${viewItem.totalAmount.toLocaleString('en-IN')}` },
            { label: 'Payment Status', value: viewItem.paymentStatus },
            { label: 'Created', value: new Date(viewItem.createdAt).toLocaleDateString() },
          ] : []}
        />
        <ConfirmModal
          open={!!deleteItem}
          onClose={() => setDeleteItem(null)}
          onConfirm={handleDelete}
          title="Cancel Registration"
          description={`Are you sure you want to cancel this registration for "${deleteItem?.rider.firstName} ${deleteItem?.rider.lastName}"? This action cannot be undone.`}
        />
        <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} onExport={handleExport} />

        {/* ═══ Create Registration Modal ═══ */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg bg-surface border-border/50">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ClipboardCheck className="w-4 h-4 text-primary" />
                </div>
                <DialogTitle className="text-base font-bold text-on-surface">New Registration</DialogTitle>
              </div>
            </DialogHeader>

            {createDataLoading ? (
              <div className="space-y-4 py-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl bg-border/20" />
                ))}
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="space-y-5 pt-2">
                {createError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                    {createError}
                  </div>
                )}

                {/* Event */}
                <div>
                  <label className="label-tech block mb-1.5">Event <span className="text-destructive">*</span></label>
                  <Select value={createForm.eventId} onValueChange={handleCreateEventChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {createEvents.map(ev => (
                        <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rider */}
                <div>
                  <label className="label-tech block mb-1.5">Rider <span className="text-destructive">*</span></label>
                  <Select value={createForm.riderId} onValueChange={v => setCreateForm(p => ({ ...p, riderId: v }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a rider" />
                    </SelectTrigger>
                    <SelectContent>
                      {createRiders.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.firstName} {r.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Horse */}
                <div>
                  <label className="label-tech block mb-1.5">Horse <span className="text-destructive">*</span></label>
                  <Select value={createForm.horseId} onValueChange={v => setCreateForm(p => ({ ...p, horseId: v }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a horse" />
                    </SelectTrigger>
                    <SelectContent>
                      {createHorses.map(h => (
                        <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div>
                  <label className="label-tech block mb-1.5">Category <span className="text-destructive">*</span></label>
                  <Select value={createForm.categoryId} onValueChange={v => setCreateForm(p => ({ ...p, categoryId: v }))} disabled={!createForm.eventId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={createForm.eventId ? 'Select a category' : 'Select an event first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {createCategories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} - ₹{c.price}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                  <button type="submit" disabled={createLoading} className="flex-1 py-2.5 btn-cta rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> {createLoading ? 'Creating...' : 'Create Registration'}
                  </button>
                  <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 py-2.5 bg-surface-container rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/50 text-center">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
      </BoneyardSkeleton>
    </ProtectedRoute>
  );
}

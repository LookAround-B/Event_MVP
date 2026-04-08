import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Download, X, Check,
  DollarSign, Clock, ShieldCheck, TrendingUp, CreditCard,
  Search, FileText, FileSpreadsheet,
} from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import AuditPagination from '@/components/AuditPagination';
import ExportModal from '@/components/ExportModal';
import { FilterDropdown } from '@/components/FilterDropdown';
import { KPICard } from '@/components/dashboard/KPICard';
import { KPIGrid } from '@/components/dashboard/KPIGrid';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

/* ─── Types (preserved) ─── */
interface FinanceRegistration {
  id: string;
  paymentStatus: string;
  eventAmount: number;
  totalAmount: number;
  event: { id: string; name: string; startDate: string };
  rider: { id: string; firstName: string; lastName: string };
  club: { id: string; name: string } | null;
  horse: { id: string; name: string };
  category: { id: string; name: string; price: number };
}

interface Transaction {
  id: string;
  registrationId: string;
  amount: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  transactionDate: string;
  status: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

interface Summary {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
}

interface FilterOption {
  id: string;
  name: string;
  startDate?: string;
}

type Tab = 'finance' | 'transactions';

/* ─── Utilities (preserved) ─── */
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

function exportToExcelFile(headers: string[], rows: (string | number)[][], filename: string) {
  const esc = (s: string | number) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const paymentBadge = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'PAID': return 'bg-primary/10 text-primary border-primary/20';
    case 'UNPAID': return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'PARTIAL': return 'bg-secondary/10 text-secondary border-secondary/20';
    default: return 'bg-surface-container text-muted-foreground border-border/30';
  }
};

/* ─── Component ─── */
export default function Financial() {
  const [activeTab, setActiveTab] = useState<Tab>('finance');

  // Finance tab state (preserved)
  const [registrations, setRegistrations] = useState<FinanceRegistration[]>([]);
  const [events, setEvents] = useState<FilterOption[]>([]);
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [eventFilter, setEventFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [financePage, setFinancePage] = useState(1);
  const [financeTotalPages, setFinanceTotalPages] = useState(1);
  const [financeLoading, setFinanceLoading] = useState(true);

  // Transaction tab state (preserved)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalRevenue: 0, totalTransactions: 0, averageTransaction: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [transPage, setTransPage] = useState(1);
  const [transTotalPages, setTransTotalPages] = useState(1);
  const [transLoading, setTransLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Edit modal state (preserved)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({
    amount: '', cgstAmount: '', sgstAmount: '', igstAmount: '',
    paymentMethod: '', referenceNumber: '', status: '', notes: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  // Search + filter dropdowns
  const [search, setSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [exportOpen, setExportOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /* ─── Data fetchers (ALL preserved) ─── */
  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/api/financial/summary');
      setSummary(res.data.data.summary);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, []);

  const fetchFinanceData = useCallback(async () => {
    try {
      setFinanceLoading(true);
      const res = await api.get('/api/financial/registrations', {
        params: {
          page: financePage,
          limit: 15,
          ...(eventFilter && { eventId: eventFilter }),
          ...(categoryFilter && { categoryId: categoryFilter }),
          ...(paymentFilter && { paymentStatus: paymentFilter }),
        },
      });
      setRegistrations(res.data.data.registrations);
      setEvents(res.data.data.events);
      setCategories(res.data.data.categories);
      setFinanceTotalPages(res.data.data.pagination.pages);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch finance data:', err);
      setError('Failed to load finance data');
    } finally {
      setFinanceLoading(false);
    }
  }, [financePage, eventFilter, categoryFilter, paymentFilter]);

  const fetchTransactionsData = useCallback(async () => {
    try {
      setTransLoading(true);
      const [transRes, summRes] = await Promise.all([
        api.get('/api/financial/transactions', {
          params: {
            page: transPage,
            limit: 15,
            ...(statusFilter && { status: statusFilter }),
          },
        }),
        api.get('/api/financial/summary'),
      ]);
      setTransactions(transRes.data.data.transactions);
      setSummary(summRes.data.data.summary);
      setTransTotalPages(transRes.data.data.pagination.pages);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setTransLoading(false);
    }
  }, [transPage, statusFilter]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => {
    if (activeTab === 'finance') fetchFinanceData();
  }, [activeTab, fetchFinanceData]);
  useEffect(() => {
    if (activeTab === 'transactions') fetchTransactionsData();
  }, [activeTab, fetchTransactionsData]);

  /* ─── Selection handlers (preserved) ─── */
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.size === transactions.length
        ? new Set()
        : new Set(transactions.map(t => t.id))
    );
  };

  /* ─── Export (preserved) ─── */
  const getExportData = () => {
    const headers = ['Ref #', 'Amount', 'CGST', 'SGST', 'IGST', 'Total', 'Method', 'Status', 'Date'];
    const source = selectedIds.size > 0 ? transactions.filter(t => selectedIds.has(t.id)) : transactions;
    const rows = source.map(t => [
      t.referenceNumber || t.id.slice(0, 8),
      t.amount,
      t.cgstAmount,
      t.sgstAmount,
      t.igstAmount,
      t.totalAmount,
      t.paymentMethod?.replace('_', ' ') || '-',
      t.status,
      new Date(t.createdAt).toLocaleDateString(),
    ]);
    return { headers, rows };
  };

  const handleExport = (type: 'csv' | 'excel') => {
    const { headers, rows } = getExportData();
    if (type === 'csv') {
      const csv = [headers.map(escapeCSVField).join(','), ...rows.map(r => r.map(escapeCSVField).join(','))].join('\n');
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'transactions.csv');
      toast.success('Exported as CSV');
    } else {
      exportToExcelFile(headers, rows, 'transactions.xls');
      toast.success('Exported as Excel');
    }
    setExportOpen(false);
  };

  /* ─── Edit handlers (preserved) ─── */
  const openEditModal = (t: Transaction) => {
    setEditingTransaction(t);
    setEditForm({
      amount: t.amount.toString(),
      cgstAmount: t.cgstAmount.toString(),
      sgstAmount: t.sgstAmount.toString(),
      igstAmount: t.igstAmount.toString(),
      paymentMethod: t.paymentMethod || '',
      referenceNumber: t.referenceNumber || '',
      status: t.status,
      notes: t.notes || '',
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    try {
      setEditLoading(true);
      await api.patch(`/api/financial/transactions/${editingTransaction.id}`, {
        amount: parseFloat(editForm.amount),
        cgstAmount: parseFloat(editForm.cgstAmount || '0'),
        sgstAmount: parseFloat(editForm.sgstAmount || '0'),
        igstAmount: parseFloat(editForm.igstAmount || '0'),
        paymentMethod: editForm.paymentMethod || null,
        referenceNumber: editForm.referenceNumber || null,
        status: editForm.status,
        notes: editForm.notes || null,
      });
      toast.success('Transaction updated successfully');
      setEditingTransaction(null);
      fetchTransactionsData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update transaction');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  /* ─── Computed ─── */
  const paidRevenue = registrations.filter(r => r.paymentStatus === 'PAID').reduce((acc, r) => acc + r.totalAmount, 0);
  const unpaidRevenue = registrations.filter(r => r.paymentStatus === 'UNPAID').reduce((acc, r) => acc + r.totalAmount, 0);
  const gstAccrued = transactions.reduce((acc, t) => acc + t.cgstAmount + t.sgstAmount + t.igstAmount, 0);

  return (
    <ProtectedRoute>
      <Head><title>Financial | Equestrian Events</title></Head>
      <div className="animate-fade-in max-w-[1600px] mx-auto">

        {/* ═══ Page Header ═══ */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl lg:text-5xl">
            Fiscal <span className="gradient-text">Ledger</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Comprehensive financial oversight of event championships, club settlements, and transaction histories.
          </p>
        </div>

        {/* ═══ KPI Cards ═══ */}
        <KPIGrid>
          <KPICard
            title="Total Collections"
            value={fmt(summary.totalRevenue || paidRevenue)}
            icon={DollarSign}
            variant="primary"
            subText="Current fiscal cycle"
            className="animate-slide-up-1"
          />
          <KPICard
            title="Pending Receivables"
            value={fmt(unpaidRevenue)}
            icon={Clock}
            variant="outline"
            subText="Awaiting processing"
            className="animate-slide-up-2"
          />
          <KPICard
            title="GST Compliance"
            value={fmt(gstAccrued)}
            icon={ShieldCheck}
            variant="outline"
            subText="Tax accrued"
            className="animate-slide-up-3"
          />
          <KPICard
            title="Transactions"
            value={summary.totalTransactions}
            icon={TrendingUp}
            variant="secondary"
            subText={`Avg: ${fmt(summary.averageTransaction)}`}
            className="animate-slide-up-4"
          />
        </KPIGrid>

        {/* ═══ Filter Bar ═══ */}
        <div className="bento-card p-4 mb-4 lg:mb-6 animate-slide-up-2 border-beam">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10 w-full">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {activeTab === 'finance' && (
                <>
                  <div>
                    <Select value={eventFilter || '__all__'} onValueChange={v => { setEventFilter(v === '__all__' ? '' : v); setFinancePage(1); }}>
                      <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Events" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Events</SelectItem>
                        {events.map(ev => (
                          <SelectItem key={ev.id} value={ev.id}>
                            {ev.name}{ev.startDate ? ` - ${new Date(ev.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select value={categoryFilter || '__all__'} onValueChange={v => { setCategoryFilter(v === '__all__' ? '' : v); setFinancePage(1); }}>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <FilterDropdown
                label="Status"
                options={[
                  { label: 'Paid', value: 'PAID' },
                  { label: 'Unpaid', value: 'UNPAID' },
                  { label: 'Partial', value: 'PARTIAL' },
                  { label: 'Cancelled', value: 'CANCELLED' },
                ]}
                selected={selectedStatuses}
                onChange={(vals) => {
                  setSelectedStatuses(vals);
                  if (activeTab === 'finance') {
                    setPaymentFilter(vals.length === 1 ? vals[0] : '');
                    setFinancePage(1);
                  } else {
                    setStatusFilter(vals.length === 1 ? vals[0] : '');
                    setTransPage(1);
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="search-input-icon pointer-events-none absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input-with-icon pr-4 py-3 bg-surface-container/50 rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-full sm:w-64 border border-border/30 transition-all focus:bg-surface-container"
                  placeholder="Find ledger entry..."
                />
              </div>
              <button onClick={() => setExportOpen(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-surface-container/60 rounded-xl text-sm text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/30">
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
              </button>
              {activeTab === 'transactions' && (
                <Link href="/financial/transactions/create" className="flex items-center gap-2 px-4 py-2.5 btn-cta rounded-xl text-sm font-bold shadow-lg shadow-primary/20">
                  <Plus className="w-4 h-4" /> Record
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ═══ Tabs ═══ */}
        <div className="mb-4 animate-slide-up-2">
          <div className="flex gap-1 bg-surface-container rounded-xl p-1 w-fit border border-border/30 shadow-inner">
            {(['finance', 'transactions'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-5 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${activeTab === tab ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-on-surface'}`}>
                {tab === 'finance' ? 'Revenue Stream' : 'Ledger Flow'}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bento-card p-4 mb-4 border-l-4 border-destructive text-destructive text-sm animate-slide-up">
            {error}
          </div>
        )}

        {/* ═══════════════ FINANCE TAB ═══════════════ */}
        {activeTab === 'finance' && (
          <div className="bento-card overflow-hidden animate-slide-up-3">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
            <div className="overflow-x-auto">
              {financeLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 rounded-xl bg-surface-container/40 animate-pulse" />
                  ))}
                </div>
              ) : registrations.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground italic">No financial artifacts detected.</div>
              ) : (
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="label-tech text-left bg-surface-container/40">
                      <th className="p-3 sm:p-4 w-12"><input type="checkbox" className="accent-primary rounded" /></th>
                      <th className="p-3 sm:p-4">Transaction Identity</th>
                      <th className="p-3 sm:p-4">Event Date</th>
                      <th className="p-3 sm:p-4">Entity Map</th>
                      <th className="p-3 sm:p-4 text-right">Fee Alpha</th>
                      <th className="p-3 sm:p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {registrations.map((item) => (
                      <tr key={item.id} className="group hover:bg-surface-container/20 transition-all duration-300">
                        <td className="p-3 sm:p-4"><input type="checkbox" className="accent-primary rounded" /></td>
                        <td className="p-3 sm:p-4">
                          <div className="flex flex-col">
                            <span className="text-on-surface font-bold tracking-tight">{item.event.name}</span>
                            <span className="text-[10px] text-muted-foreground/70 uppercase tracking-widest">{item.category.name}</span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-secondary font-mono text-xs">{new Date(item.event.startDate).toLocaleDateString()}</td>
                        <td className="p-3 sm:p-4">
                          <div className="flex flex-col">
                            <span className="text-on-surface-variant font-medium">{item.rider.firstName} {item.rider.lastName}</span>
                            <span className="text-[9px] text-muted-foreground uppercase">{item.club?.name || '—'}</span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-right text-on-surface font-black tracking-tighter text-base">{fmt(item.totalAmount)}</td>
                        <td className="p-3 sm:p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${paymentBadge(item.paymentStatus)}`}>
                            {item.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="bg-surface-container/20 p-3 border-t border-border/10">
              <AuditPagination page={financePage} totalPages={financeTotalPages} onPageChange={setFinancePage} className="mt-0" />
            </div>
          </div>
        )}

        {/* ═══════════════ TRANSACTIONS TAB ═══════════════ */}
        {activeTab === 'transactions' && (
          <div className="bento-card overflow-hidden animate-slide-up-3">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
            <div className="overflow-x-auto">
              {transLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 rounded-xl bg-surface-container/40 animate-pulse" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground italic">No transaction matrix detected.</div>
              ) : (
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="label-tech text-left bg-surface-container/40">
                      <th className="p-3 sm:p-4 w-12">
                        <input type="checkbox" checked={selectedIds.size === transactions.length && transactions.length > 0} onChange={toggleSelectAll} className="accent-primary rounded" />
                      </th>
                      <th className="p-3 sm:p-4">Reference Alpha</th>
                      <th className="p-3 sm:p-4">Base Quantum</th>
                      <th className="p-3 sm:p-4">GST Vector</th>
                      <th className="p-3 sm:p-4 font-bold">Total Aggregate</th>
                      <th className="p-3 sm:p-4 text-center">Protocol</th>
                      <th className="p-3 sm:p-4">Status</th>
                      <th className="p-3 sm:p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="group hover:bg-surface-container/20 transition-all duration-300">
                        <td className="p-3 sm:p-4">
                          <input type="checkbox" checked={selectedIds.has(txn.id)} onChange={() => toggleSelect(txn.id)} className="accent-primary rounded" />
                        </td>
                        <td className="p-3 sm:p-4 font-mono text-[10px] text-secondary font-black tracking-widest">{txn.referenceNumber || txn.id.slice(0, 8)}</td>
                        <td className="p-3 sm:p-4 text-on-surface/70 font-mono text-xs">{fmt(txn.amount)}</td>
                        <td className="p-3 sm:p-4">
                          <div className="text-[9px] text-muted-foreground flex flex-col gap-0.5">
                            <span>C: {fmt(txn.cgstAmount)}</span>
                            <span>S: {fmt(txn.sgstAmount)}</span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-on-surface font-black tracking-tighter text-base">{fmt(txn.totalAmount)}</td>
                        <td className="p-3 sm:p-4 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container/60 border border-border/20">
                            <CreditCard className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] font-bold uppercase">{txn.paymentMethod?.replace('_', ' ') || '—'}</span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${paymentBadge(txn.status)}`}>
                            {txn.status}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          <button onClick={() => openEditModal(txn)} className="p-2 rounded-lg hover:bg-surface-container text-muted-foreground hover:text-on-surface transition-all active:scale-95" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="bg-surface-container/20 p-3 border-t border-border/10">
              <AuditPagination page={transPage} totalPages={transTotalPages} onPageChange={setTransPage} className="mt-0" />
            </div>
          </div>
        )}
      </div>

      {/* ═══ Export Modal (popup) ═══ */}
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} onExport={handleExport} />

      {/* ═══ Edit Transaction Modal (popup form) ═══ */}
      {editingTransaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in" onClick={() => setEditingTransaction(null)} />
          <div className="relative z-10 w-full max-w-2xl flex flex-col rounded-2xl border border-border/60 bg-surface-low shadow-2xl shadow-black/40 animate-fade-in pointer-events-auto" style={{ maxHeight: 'min(90vh, 720px)' }}>
            {/* Sticky header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 flex-shrink-0">
              <h3 className="text-base font-bold text-on-surface">Edit Transaction</h3>
              <button onClick={() => setEditingTransaction(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Scrollable body */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto px-6 py-5 scrollbar-none">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                <div>
                  <label className="label-tech block mb-1.5">Amount <span className="text-destructive">*</span></label>
                  <input type="number" name="amount" step="0.01" value={editForm.amount} onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 placeholder:text-muted-foreground" required />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">Ref #</label>
                  <input type="text" name="referenceNumber" value={editForm.referenceNumber} onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 placeholder:text-muted-foreground" />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">CGST</label>
                  <input type="number" name="cgstAmount" step="0.01" value={editForm.cgstAmount} onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50" />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">SGST</label>
                  <input type="number" name="sgstAmount" step="0.01" value={editForm.sgstAmount} onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50" />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">IGST</label>
                  <input type="number" name="igstAmount" step="0.01" value={editForm.igstAmount} onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50" />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">Payment Method</label>
                  <Select value={editForm.paymentMethod || '__none__'} onValueChange={v => setEditForm(prev => ({ ...prev, paymentMethod: v === '__none__' ? '' : v }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Debit Card">Debit Card</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="label-tech block mb-1.5">Status</label>
                  <Select value={editForm.status} onValueChange={v => setEditForm(prev => ({ ...prev, status: v }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNPAID">Unpaid</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label-tech block mb-1.5">Notes</label>
                  <textarea name="notes" value={editForm.notes} onChange={handleEditChange} rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 resize-none placeholder:text-muted-foreground" />
                </div>
              </div>
            </form>
            {/* Sticky footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-border/40 flex-shrink-0">
              <button type="submit" disabled={editLoading} onClick={handleEditSubmit}
                className="flex-1 py-2.5 btn-cta rounded-xl text-sm font-bold disabled:opacity-50">
                <Check className="inline w-4 h-4 mr-2" /> {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditingTransaction(null)}
                className="flex-1 py-2.5 bg-surface-container rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, Pencil, Download, X, Check } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';

/* ─── Types ─── */
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
}

type Tab = 'finance' | 'transactions';

/* ─── Utilities ─── */
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

const STATUS_COLORS: Record<string, string> = {
  PAID: 'badge-success',
  PARTIAL: 'badge-warning',
  UNPAID: 'badge-danger',
  CANCELLED: 'badge-secondary',
};

const getStatusColor = (status: string) => STATUS_COLORS[status?.toUpperCase()] || 'badge-secondary';

/* ─── Component ─── */
export default function Financial() {
  const [activeTab, setActiveTab] = useState<Tab>('finance');

  // Finance tab state
  const [registrations, setRegistrations] = useState<FinanceRegistration[]>([]);
  const [events, setEvents] = useState<FilterOption[]>([]);
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [eventFilter, setEventFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [financePage, setFinancePage] = useState(1);
  const [financeTotalPages, setFinanceTotalPages] = useState(1);
  const [financeLoading, setFinanceLoading] = useState(true);

  // Transaction tab state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalRevenue: 0, totalTransactions: 0, averageTransaction: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [transPage, setTransPage] = useState(1);
  const [transTotalPages, setTransTotalPages] = useState(1);
  const [transLoading, setTransLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Edit modal state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({
    amount: '', cgstAmount: '', sgstAmount: '', igstAmount: '',
    paymentMethod: '', referenceNumber: '', status: '', notes: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /* ── Data fetchers ── */
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

  // Fetch summary on mount
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // Fetch tab-specific data
  useEffect(() => {
    if (activeTab === 'finance') fetchFinanceData();
  }, [activeTab, fetchFinanceData]);

  useEffect(() => {
    if (activeTab === 'transactions') fetchTransactionsData();
  }, [activeTab, fetchTransactionsData]);

  /* ── Selection handlers ── */
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

  /* ── Export handlers ── */
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

  const handleExportCSV = () => {
    const { headers, rows } = getExportData();
    const csv = [headers.map(escapeCSVField).join(','), ...rows.map(r => r.map(escapeCSVField).join(','))].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'transactions.csv');
    toast.success('Exported as CSV');
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    exportToExcel(headers, rows, 'transactions.xls');
    toast.success('Exported as Excel');
  };

  /* ── Edit handlers ── */
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

  /* ── Pagination ── */
  const Pagination = ({ page, total, setPage }: { page: number; total: number; setPage: (p: number) => void }) => {
    if (total <= 1) return null;
    return (
      <div className="flex justify-center gap-2 mt-4">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary disabled:opacity-50">Previous</button>
        <span className="px-4 py-2 text-muted-foreground">Page {page} of {total}</span>
        <button onClick={() => setPage(Math.min(total, page + 1))} disabled={page === total} className="btn-secondary disabled:opacity-50">Next</button>
      </div>
    );
  };

  /* ── Tab button ── */
  const TabButton = ({ tab, label }: { tab: Tab; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
    >
      {label}
    </button>
  );

  return (
    <ProtectedRoute>
      <Head><title>Financial | Equestrian Events</title></Head>
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl">Financial <span className="gradient-text">Overview</span></h1>
          {activeTab === 'transactions' && (
            <div className="flex flex-wrap gap-3">
              <button onClick={handleExportCSV} className="btn-secondary">
                <Download className="inline mr-2" /> Export CSV
              </button>
              <button onClick={handleExportExcel} className="btn-secondary">
                <Download className="inline mr-2" /> Export Excel
              </button>
              <Link href="/financial/transactions/create" className="btn-primary">
                <Plus className="inline mr-2" /> Record Transaction
              </Link>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="hero-kpi primary-card-glow animate-slide-up-1">
            <div className="hero-label">Total Revenue</div>
            <div className="hero-value">₹{summary.totalRevenue.toFixed(2)}</div>
          </div>
          <div className="stat-card animate-slide-up-2">
            <p className="text-[10px] font-bold uppercase tracking-widest" >Total Transactions</p>
            <p className="text-2xl font-bold mt-1" >{summary.totalTransactions}</p>
          </div>
          <div className="stat-card animate-slide-up-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" >Average Transaction</p>
            <p className="text-2xl font-bold mt-1" >₹{summary.averageTransaction.toFixed(2)}</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <TabButton tab="finance" label="Finance" />
          <TabButton tab="transactions" label="Transactions" />
        </div>

        {/* ═══════════════════ FINANCE TAB ═══════════════════ */}
        {activeTab === 'finance' && (
          <>
            {/* Filters */}
            <div className="bento-card mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Select Event</label>
                <select
                  value={eventFilter}
                  onChange={(e) => { setEventFilter(e.target.value); setFinancePage(1); }}
                  className="input"
                >
                  <option value="">All Events</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Select Event Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setFinancePage(1); }}
                  className="input"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Payment Status</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => { setPaymentFilter(e.target.value); setFinancePage(1); }}
                  className="input"
                >
                  <option value="">All Statuses</option>
                  <option value="PAID">Paid</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Finance Table */}
            <div className="bento-card table-container">
              {financeLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto" />
                  <p className="text-muted-foreground mt-2">Loading...</p>
                </div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No registrations found matching your filters.</div>
              ) : (
                <>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Event Name</th>
                        <th>Event Date</th>
                        <th>Rider Name</th>
                        <th>Club Name</th>
                        <th>Horse Name</th>
                        <th>Event Category</th>
                        <th>Price</th>
                        <th>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map(reg => (
                        <tr key={reg.id}>
                          <td className="font-medium">{reg.event.name}</td>
                          <td>{new Date(reg.event.startDate).toLocaleDateString()}</td>
                          <td>{reg.rider.firstName} {reg.rider.lastName}</td>
                          <td>{reg.club?.name || '-'}</td>
                          <td>{reg.horse.name}</td>
                          <td>{reg.category.name}</td>
                          <td className="font-bold">₹{reg.totalAmount.toFixed(2)}</td>
                          <td>
                            <span className={`badge ${getStatusColor(reg.paymentStatus)}`}>
                              {reg.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination page={financePage} total={financeTotalPages} setPage={setFinancePage} />
                </>
              )}
            </div>
          </>
        )}

        {/* ═══════════════════ TRANSACTIONS TAB ═══════════════════ */}
        {activeTab === 'transactions' && (
          <>
            {/* Status Filter */}
            <div className="bento-card mb-6">
              <div className="max-w-xs">
                <label className="form-label">Filter by Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setTransPage(1); }}
                  className="input"
                >
                  <option value="">All Statuses</option>
                  <option value="PAID">Paid</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bento-card table-container">
              {transLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto" />
                  <p className="text-muted-foreground mt-2">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No transactions found. Record one to get started!</div>
              ) : (
                <>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={selectedIds.size === transactions.length && transactions.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded border-border"
                          />
                        </th>
                        <th>Ref #</th>
                        <th>Amount</th>
                        <th>CGST</th>
                        <th>SGST</th>
                        <th>IGST</th>
                        <th>Total</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(trans => (
                        <tr key={trans.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(trans.id)}
                              onChange={() => toggleSelect(trans.id)}
                              className="rounded border-border"
                            />
                          </td>
                          <td className="font-medium text-sm">{trans.referenceNumber || trans.id.slice(0, 8)}</td>
                          <td>₹{trans.amount.toFixed(2)}</td>
                          <td className="text-sm">₹{trans.cgstAmount.toFixed(2)}</td>
                          <td className="text-sm">₹{trans.sgstAmount.toFixed(2)}</td>
                          <td className="text-sm">₹{trans.igstAmount.toFixed(2)}</td>
                          <td className="font-bold text-emerald-400">₹{trans.totalAmount.toFixed(2)}</td>
                          <td className="capitalize">{trans.paymentMethod?.replace('_', ' ') || '-'}</td>
                          <td>
                            <span className={`badge ${getStatusColor(trans.status)}`}>
                              {trans.status.charAt(0).toUpperCase() + trans.status.slice(1).toLowerCase()}
                            </span>
                          </td>
                          <td>{new Date(trans.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button
                              onClick={() => openEditModal(trans)}
                              className="transition-colors transition-colors p-1"
                              title="Edit Transaction"
                            >
                              <Pencil size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination page={transPage} total={transTotalPages} setPage={setTransPage} />
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ═══════════════════ EDIT MODAL ═══════════════════ */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{ background: 'hsl(var(--surface-card))', border: '1px solid hsl(var(--border) / 0.5)' }}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-border/30">
              <h3 className="text-xl font-bold" >Edit Transaction</h3>
              <button onClick={() => setEditingTransaction(null)} className="text-muted-foreground hover:text-on-surface transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Amount</label>
                  <input type="number" name="amount" step="0.01" value={editForm.amount} onChange={handleEditChange} className="input" required />
                </div>
                <div>
                  <label className="form-label">Ref #</label>
                  <input type="text" name="referenceNumber" value={editForm.referenceNumber} onChange={handleEditChange} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">CGST</label>
                  <input type="number" name="cgstAmount" step="0.01" value={editForm.cgstAmount} onChange={handleEditChange} className="input" />
                </div>
                <div>
                  <label className="form-label">SGST</label>
                  <input type="number" name="sgstAmount" step="0.01" value={editForm.sgstAmount} onChange={handleEditChange} className="input" />
                </div>
                <div>
                  <label className="form-label">IGST</label>
                  <input type="number" name="igstAmount" step="0.01" value={editForm.igstAmount} onChange={handleEditChange} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Payment Method</label>
                  <select name="paymentMethod" value={editForm.paymentMethod} onChange={handleEditChange} className="input">
                    <option value="">Select</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select name="status" value={editForm.status} onChange={handleEditChange} className="input">
                    <option value="UNPAID">Unpaid</option>
                    <option value="PAID">Paid</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea name="notes" value={editForm.notes} onChange={handleEditChange} rows={3} className="input" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={editLoading} className="flex-1 btn-primary">
                  <Check className="inline mr-2" /> {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditingTransaction(null)} className="flex-1 btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

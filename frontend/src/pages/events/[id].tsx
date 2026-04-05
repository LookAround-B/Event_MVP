import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { ArrowLeft, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface EventDetail {
  id: string;
  name: string;
  eventType: string;
  startDate: string;
  endDate: string;
  description: string;
  venueName: string;
  venueAddress: string;
  termsAndConditions: string;
  isPublished: boolean;
  categories?: { id: string; name: string; price: number }[];
}

interface Registration {
  id: string;
  rider: { firstName: string; lastName: string; email: string };
  horse: { name: string; color: string };
  club: { name: string };
  category: { name: string; price: number };
  paymentStatus: string;
  paymentMethod: string;
  eventAmount: number;
  stableAmount: number;
  gstAmount: number;
  totalAmount: number;
  registeredAt: string;
}

/* ===================== Utility: Export ===================== */
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

export default function EventDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registeredCount, setRegisteredCount] = useState(0);

  // Table filters
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 15;

  // Checkbox selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Action modal
  const [actionModal, setActionModal] = useState<{ isOpen: boolean; registration?: Registration }>({ isOpen: false });

  useEffect(() => {
    if (id) {
      Promise.all([fetchEventDetail(), fetchRegistrations()]);
    }
  }, [id]);

  const fetchEventDetail = async () => {
    try {
      const response = await api.get(`/api/events/${id}`);
      setEvent(response.data.data);
    } catch (err) {
      console.error('Failed to fetch event:', err);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const params = new URLSearchParams({ eventId: id as string, limit: '500' });
      const response = await api.get(`/api/registrations?${params}`);
      const allRegistrations = response.data.data?.registrations || [];
      setRegistrations(allRegistrations);
      setRegisteredCount(allRegistrations.length);
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
    }
  };

  // Filtered and paginated registrations
  const filtered = registrations.filter(r => {
    if (filterPaymentStatus && r.paymentStatus !== filterPaymentStatus) return false;
    if (filterCategory && r.category?.name !== filterCategory) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      const match = `${r.rider.firstName} ${r.rider.lastName}`.toLowerCase().includes(q)
        || r.horse.name.toLowerCase().includes(q)
        || (r.club?.name || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // Toggle checkbox
  const toggleAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(r => r.id)));
    }
  };
  const toggleOne = (rid: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(rid)) next.delete(rid); else next.add(rid);
      return next;
    });
  };

  // Unique categories for filter
  const uniqueCategories = Array.from(new Set(registrations.map(r => r.category?.name).filter(Boolean)));

  // Category amount summary
  const categoryAmounts = registrations.reduce((acc, r) => {
    const name = r.category?.name || 'Uncategorized';
    if (!acc[name]) acc[name] = { count: 0, total: 0 };
    acc[name].count++;
    acc[name].total += r.totalAmount;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Rider Name', 'Email', 'Club Name', 'Horse Name', 'Category', 'Event Amount (₹)', 'Stable Amount (₹)', 'GST Amount (₹)', 'Total Amount (₹)', 'Payment Method', 'Payment Status', 'Registration Date'];
    const rows = registrations.map(r => [
      `${r.rider.firstName} ${r.rider.lastName}`, r.rider.email, r.club?.name || '-',
      r.horse.name, r.category?.name || '-', r.eventAmount, r.stableAmount,
      r.gstAmount, r.totalAmount, r.paymentMethod || '-', r.paymentStatus,
      r.registeredAt ? new Date(r.registeredAt).toLocaleDateString() : '-',
    ]);
    const csv = [headers.map(escapeCSVField).join(','), ...rows.map(r => r.map(escapeCSVField).join(','))].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${event?.name || 'event'}-registrations.csv`);
  };

  // Export Excel
  const exportToExcel = () => {
    const esc = (s: string | number) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const headers = ['Rider Name', 'Email', 'Club Name', 'Horse Name', 'Category', 'Event Amount (₹)', 'Stable Amount (₹)', 'GST Amount (₹)', 'Total Amount (₹)', 'Payment Method', 'Payment Status', 'Registration Date'];
    const headerRow = headers.map(h => `<Cell><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('');
    const dataRows = registrations.map(r => {
      const cells = [
        { v: `${r.rider.firstName} ${r.rider.lastName}`, t: 'String' },
        { v: r.rider.email, t: 'String' },
        { v: r.club?.name || '-', t: 'String' },
        { v: r.horse.name, t: 'String' },
        { v: r.category?.name || '-', t: 'String' },
        { v: r.eventAmount, t: 'Number' },
        { v: r.stableAmount, t: 'Number' },
        { v: r.gstAmount, t: 'Number' },
        { v: r.totalAmount, t: 'Number' },
        { v: r.paymentMethod || '-', t: 'String' },
        { v: r.paymentStatus, t: 'String' },
        { v: r.registeredAt ? new Date(r.registeredAt).toLocaleDateString() : '-', t: 'String' },
      ];
      return `<Row>${cells.map(c => `<Cell><Data ss:Type="${c.t}">${esc(c.v)}</Data></Cell>`).join('')}</Row>`;
    });
    const xml = `<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Registrations"><Table><Row>${headerRow}</Row>${dataRows.join('')}</Table></Worksheet></Workbook>`;
    downloadBlob(new Blob([xml], { type: 'application/vnd.ms-excel' }), `${event?.name || 'event'}-registrations.xls`);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground mt-2">Loading event...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!event) {
    return (
      <ProtectedRoute>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Event not found</p>
          <Link href="/events" className="text-blue-600 hover:underline mt-4 inline-block">Back to Events</Link>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/events" className="text-blue-600 hover:text-blue-900 flex items-center gap-2">
            <ArrowLeft /> Back to Events
          </Link>
        </div>

        {/* Event Summary */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-32" />
          <div className="p-6 -mt-16 relative">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Event Name</p>
                  <p className="text-2xl font-bold text-on-surface">{event.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Event Type</p>
                  <p className="text-lg font-semibold text-on-surface">{event.eventType}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Event Start Date</p>
                  <p className="text-on-surface">{formatDate(event.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Event End Date</p>
                  <p className="text-on-surface">{formatDate(event.endDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${event.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {event.isPublished ? 'Published' : 'Not Published'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-on-surface-variant mt-1">{event.description || 'No description'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Venue</p>
                  <p className="text-on-surface">{event.venueName || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{event.venueAddress || 'No address'}</p>
                </div>
                <div className="flex items-end">
                  <Link href={`/events/${id}/stables`} className="px-4 py-2 bg-purple-600 text-on-surface rounded-lg hover:bg-purple-700 text-sm font-medium">
                    Manage Stables
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event Category Amount Summary */}
        {Object.keys(categoryAmounts).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-on-surface mb-4">Event Category Amounts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(categoryAmounts).map(([name, data]) => (
                <div key={name} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p className="text-lg font-semibold text-on-surface">{name}</p>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">Registrations: <span className="font-medium text-on-surface">{data.count}</span></span>
                    <span className="text-muted-foreground">Total: <span className="font-semibold text-blue-600">₹{data.total.toLocaleString('en-IN')}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Registered Members Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
            <div>
              <h2 className="text-lg font-semibold text-on-surface">Registered Members</h2>
              <p className="text-sm text-muted-foreground mt-1">{registeredCount} registrations</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-on-surface rounded-lg hover:bg-green-700 text-sm">
                <Download /> Export Excel
              </button>
              <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-on-surface rounded-lg hover:bg-blue-700 text-sm">
                <Download /> Export CSV
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <input
                type="text"
                placeholder="Search rider, horse, or club name..."
                value={filterSearch}
                onChange={e => { setFilterSearch(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <select
              value={filterPaymentStatus}
              onChange={e => { setFilterPaymentStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Payment Statuses</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={filterCategory}
              onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container border-b">
                <tr>
                  <th className="px-3 py-3 text-left">
                    <input type="checkbox" checked={paginated.length > 0 && selectedIds.size === paginated.length} onChange={toggleAll} className="rounded border-gray-400" />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Rider Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Club Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Horse Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Event Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Total Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Payment Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginated.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No registrations found</td></tr>
                ) : (
                  paginated.map(reg => (
                    <tr key={reg.id} className="hover:bg-surface-lowest">
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={selectedIds.has(reg.id)} onChange={() => toggleOne(reg.id)} className="rounded border-gray-400" />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium text-on-surface">{reg.rider.firstName} {reg.rider.lastName}</p>
                        <p className="text-xs text-muted-foreground">{reg.rider.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface">{reg.club?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <p className="text-on-surface">{reg.horse.name}</p>
                        <p className="text-xs text-muted-foreground">{reg.horse.color}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface">{reg.category?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-on-surface">₹{reg.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          reg.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                          reg.paymentStatus === 'PARTIAL' ? 'bg-blue-100 text-blue-800' :
                          reg.paymentStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {reg.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button onClick={() => setActionModal({ isOpen: true, registration: reg })} className="text-blue-600 hover:underline text-sm">
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg bg-surface-container hover:bg-surface-bright disabled:opacity-30 transition">
                <ChevronLeft />
              </button>
              <span className="text-sm text-muted-foreground px-3">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg bg-surface-container hover:bg-surface-bright disabled:opacity-30 transition">
                <ChevronRight />
              </button>
            </div>
          )}
        </div>

        {/* Prospectus Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-on-surface mb-4">Prospectus</h2>
          <div className="prose prose-sm max-w-none text-on-surface-variant">
            {event.description ? (
              <p>{event.description}</p>
            ) : (
              <p className="text-muted-foreground italic">No prospectus available for this event.</p>
            )}
          </div>
          {event.termsAndConditions && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-md font-semibold text-on-surface mb-2">Terms & Conditions</h3>
              <div className="prose prose-sm max-w-none text-on-surface-variant">{event.termsAndConditions}</div>
            </div>
          )}
        </div>

        {/* Action / Participating Members Details Modal */}
        {actionModal.isOpen && actionModal.registration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setActionModal({ isOpen: false })}>
            <div className="bento-card max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-on-surface">Participating Member Details</h3>
                  <button onClick={() => setActionModal({ isOpen: false })} className="text-muted-foreground hover:text-on-surface-variant text-lg">✕</button>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4 border-b pb-4">
                    <div>
                      <p className="text-muted-foreground">Event Name</p>
                      <p className="font-semibold text-on-surface">{event.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Event Date</p>
                      <p className="font-semibold text-on-surface">{formatDate(event.startDate)} - {formatDate(event.endDate)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-b pb-4">
                    <div>
                      <p className="text-muted-foreground">Rider Name</p>
                      <p className="font-semibold text-on-surface">{actionModal.registration.rider.firstName} {actionModal.registration.rider.lastName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Club Name</p>
                      <p className="font-semibold text-on-surface">{actionModal.registration.club?.name || '-'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-b pb-4">
                    <div>
                      <p className="text-muted-foreground">Horse Name</p>
                      <p className="font-semibold text-on-surface">{actionModal.registration.horse.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Event Category</p>
                      <p className="font-semibold text-on-surface">{actionModal.registration.category?.name || '-'}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Event Amount:</span><span className="font-semibold">₹{actionModal.registration.eventAmount.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Stable Amount:</span><span className="font-semibold">₹{actionModal.registration.stableAmount.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">GST Amount:</span><span className="font-semibold">₹{actionModal.registration.gstAmount.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="font-semibold text-on-surface">Total:</span>
                      <span className="font-bold text-lg text-blue-600">₹{actionModal.registration.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-muted-foreground">Payment Method</p>
                      <p className="font-medium text-on-surface">{actionModal.registration.paymentMethod || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        actionModal.registration.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                        actionModal.registration.paymentStatus === 'PARTIAL' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {actionModal.registration.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <button onClick={() => setActionModal({ isOpen: false })} className="w-full mt-6 px-4 py-2 bg-blue-600 text-on-surface rounded-lg hover:bg-blue-700">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

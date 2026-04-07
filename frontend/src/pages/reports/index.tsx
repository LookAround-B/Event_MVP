import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { Download, BarChart2, DollarSign, Users, Calendar } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { DatePicker } from '@/components/DatePicker';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface EventSummary {
  id: string;
  name: string;
  eventType: string;
  startDate: string;
  endDate: string;
  totalRegistrations: number;
  approved: number;
  pending: number;
  rejected: number;
  paid: number;
  unpaid: number;
  partial: number;
  totalRevenue: number;
  eventRevenue: number;
  stableRevenue: number;
  gstCollected: number;
}

interface RiderStat {
  id: string;
  name: string;
  email: string;
  club: string;
  totalRegistrations: number;
  totalEvents: number;
  totalSpent: number;
  horses: string[];
  approvedCount: number;
  paidCount: number;
}

interface FinancialReport {
  totalExpectedRevenue: number;
  totalCollected: number;
  totalOutstanding: number;
  transactionCount: number;
  registrationCount: number;
  byMethod: Record<string, { count: number; total: number }>;
  byStatus: Record<string, { count: number; total: number }>;
}

export default function Reports() {
  const [tab, setTab] = useState<'events' | 'financial' | 'riders' | 'attendance'>('events');
  const [loading, setLoading] = useState(false);
  const [eventSummaries, setEventSummaries] = useState<EventSummary[]>([]);
  const [riderStats, setRiderStats] = useState<RiderStat[]>([]);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [attendanceReport, setAttendanceReport] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [evPage, setEvPage] = useState(1);
  const [riderPage, setRiderPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    loadReport();
  }, [tab, selectedEvent]);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (tab === 'events') {
        const res = await api.get('/api/reports?type=event-summary');
        setEventSummaries(res.data.data?.events || []);
      } else if (tab === 'financial') {
        const params = new URLSearchParams({ type: 'financial' });
        if (dateRange.start) params.set('startDate', dateRange.start);
        if (dateRange.end) params.set('endDate', dateRange.end);
        const res = await api.get(`/api/reports?${params}`);
        setFinancialReport(res.data.data || null);
      } else if (tab === 'riders') {
        const res = await api.get('/api/reports?type=rider-stats');
        setRiderStats(res.data.data?.riders || []);
      } else if (tab === 'attendance') {
        const params = new URLSearchParams({ type: 'attendance' });
        if (selectedEvent) params.set('eventId', selectedEvent);
        const res = await api.get(`/api/reports?${params}`);
        setAttendanceReport(res.data.data?.report || []);
      }
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const downloadFinancialCSV = async () => {
    try {
      const params = new URLSearchParams({ type: 'financial', format: 'csv' });
      if (dateRange.start) params.set('startDate', dateRange.start);
      if (dateRange.end) params.set('endDate', dateRange.end);
      const res = await api.get(`/api/reports?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'financial-reconciliation.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download CSV');
    }
  };

  return (
    <ProtectedRoute>
      <Head><title>Reports | Equestrian</title></Head>
      <div className="animate-fade-in max-w-[1600px] mx-auto space-y-6">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl lg:text-5xl">
            Data <span className="gradient-text">Reports</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">Event summaries, financial reconciliation, and rider analytics.</p>
        </div>

        {/* Tabs */}
        <div className="mb-4 animate-slide-up-2">
          <div className="flex gap-1 bg-surface-container rounded-xl p-1 w-fit border border-border/30 shadow-inner flex-wrap">
            {[
              { key: 'events', label: 'Events', icon: Calendar },
              { key: 'financial', label: 'Financial', icon: DollarSign },
              { key: 'riders', label: 'Riders', icon: Users },
              { key: 'attendance', label: 'Attendance', icon: BarChart2 },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-4 sm:px-5 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all ${tab === t.key ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-on-surface'}`}>
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="bento-card p-6 space-y-3 animate-slide-up-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-surface-container/40 animate-pulse" />
            ))}
          </div>
        )}

        {/* Event Summary Report */}
        {!loading && tab === 'events' && (
          <div className="bento-card overflow-hidden animate-slide-up-3">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="label-tech text-left bg-surface-container/40">
                  <th>Event</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th className="text-right">Registrations</th>
                  <th className="text-right">Approved</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {eventSummaries.slice((evPage - 1) * perPage, evPage * perPage).map(ev => (
                  <tr key={ev.id}>
                    <td className="font-medium">{ev.name}</td>
                    <td className="text-muted-foreground">{ev.eventType}</td>
                    <td className="text-muted-foreground">{new Date(ev.startDate).toLocaleDateString()}</td>
                    <td className="text-right">{ev.totalRegistrations}</td>
                    <td className="text-right text-emerald-400">{ev.approved}</td>
                    <td className="text-right text-blue-400">{ev.paid}</td>
                    <td className="text-right font-semibold">₹{ev.totalRevenue.toLocaleString()}</td>
                  </tr>
                ))}
                {eventSummaries.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No events found</td></tr>
                )}
              </tbody>
              {eventSummaries.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={3} className="font-semibold">Totals</td>
                    <td className="text-right font-semibold">{eventSummaries.reduce((s, e) => s + e.totalRegistrations, 0)}</td>
                    <td className="text-right font-semibold text-emerald-400">{eventSummaries.reduce((s, e) => s + e.approved, 0)}</td>
                    <td className="text-right font-semibold text-blue-400">{eventSummaries.reduce((s, e) => s + e.paid, 0)}</td>
                    <td className="text-right font-bold">₹{eventSummaries.reduce((s, e) => s + e.totalRevenue, 0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
            </div>
            {eventSummaries.length > 0 && (
              <div className="flex justify-center items-center gap-2 py-3 border-t border-border/30">
                <button onClick={() => setEvPage(Math.max(1, evPage - 1))} disabled={evPage === 1} className="btn-secondary disabled:opacity-50 text-sm px-3 py-1.5">Previous</button>
                <span className="px-4 py-2 text-muted-foreground text-sm">Page {evPage} of {Math.ceil(eventSummaries.length / perPage) || 1} ({eventSummaries.length} total)</span>
                <button onClick={() => setEvPage(Math.min(Math.ceil(eventSummaries.length / perPage), evPage + 1))} disabled={evPage >= Math.ceil(eventSummaries.length / perPage)} className="btn-secondary disabled:opacity-50 text-sm px-3 py-1.5">Next</button>
              </div>
            )}
          </div>
        )}

        {/* Financial Reconciliation Report */}
        {!loading && tab === 'financial' && (
          <div className="space-y-4">
            <div className="bento-card p-4 flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1">Start Date</label>
                <DatePicker value={dateRange.start} onChange={(v) => setDateRange({ ...dateRange, start: v })} placeholder="Start date" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1">End Date</label>
                <DatePicker value={dateRange.end} onChange={(v) => setDateRange({ ...dateRange, end: v })} placeholder="End date" />
              </div>
              <button onClick={loadReport} className="px-4 py-2.5 btn-cta rounded-xl text-sm font-bold shadow-lg shadow-primary/20">Apply</button>
              <button onClick={downloadFinancialCSV} className="flex items-center gap-2 px-4 py-2.5 bg-surface-container/60 rounded-xl text-sm text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/30">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            {financialReport && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bento-card">
                    <p className="text-sm text-muted-foreground">Expected Revenue</p>
                    <p className="text-xl font-bold text-on-surface mt-1">₹{financialReport.totalExpectedRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bento-card">
                    <p className="text-sm text-muted-foreground">Collected</p>
                    <p className="text-xl font-bold text-emerald-400 mt-1">₹{financialReport.totalCollected.toLocaleString()}</p>
                  </div>
                  <div className="bento-card">
                    <p className="text-sm text-muted-foreground">Outstanding</p>
                    <p className="text-xl font-bold text-destructive mt-1">₹{financialReport.totalOutstanding.toLocaleString()}</p>
                  </div>
                  <div className="bento-card">
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="text-xl font-bold text-on-surface mt-1">{financialReport.transactionCount}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bento-card">
                    <h3 className="text-sm font-semibold text-on-surface mb-3">By Payment Method</h3>
                    {Object.entries(financialReport.byMethod).map(([method, data]) => (
                      <div key={method} className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
                        <span className="text-sm text-muted-foreground">{method}</span>
                        <span className="text-sm font-semibold text-on-surface">₹{data.total.toLocaleString()} ({data.count})</span>
                      </div>
                    ))}
                    {Object.keys(financialReport.byMethod).length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
                  </div>
                  <div className="bento-card">
                    <h3 className="text-sm font-semibold text-on-surface mb-3">By Status</h3>
                    {Object.entries(financialReport.byStatus).map(([status, data]) => (
                      <div key={status} className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
                        <span className="text-sm text-muted-foreground">{status}</span>
                        <span className="text-sm font-semibold text-on-surface">₹{data.total.toLocaleString()} ({data.count})</span>
                      </div>
                    ))}
                    {Object.keys(financialReport.byStatus).length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Rider Statistics Report */}
        {!loading && tab === 'riders' && (
          <div className="bento-card overflow-hidden animate-slide-up-3">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary/30 via-primary to-secondary/30" />
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="label-tech text-left bg-surface-container/40">
                  <th>Rider</th>
                  <th>Email</th>
                  <th>Club</th>
                  <th className="text-right">Events</th>
                  <th className="text-right">Registrations</th>
                  <th className="text-right">Horses</th>
                  <th className="text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {riderStats.slice((riderPage - 1) * perPage, riderPage * perPage).map(r => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.name}</td>
                    <td className="text-muted-foreground">{r.email}</td>
                    <td className="text-muted-foreground">{r.club}</td>
                    <td className="text-right">{r.totalEvents}</td>
                    <td className="text-right">{r.totalRegistrations}</td>
                    <td className="text-right">{r.horses.length}</td>
                    <td className="text-right font-semibold">₹{r.totalSpent.toLocaleString()}</td>
                  </tr>
                ))}
                {riderStats.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No rider data</td></tr>
                )}
              </tbody>
            </table>
            </div>
            {riderStats.length > 0 && (
              <div className="flex justify-center items-center gap-2 py-3 border-t border-border/30">
                <button onClick={() => setRiderPage(Math.max(1, riderPage - 1))} disabled={riderPage === 1} className="btn-secondary disabled:opacity-50 text-sm px-3 py-1.5">Previous</button>
                <span className="px-4 py-2 text-muted-foreground text-sm">Page {riderPage} of {Math.ceil(riderStats.length / perPage) || 1} ({riderStats.length} total)</span>
                <button onClick={() => setRiderPage(Math.min(Math.ceil(riderStats.length / perPage), riderPage + 1))} disabled={riderPage >= Math.ceil(riderStats.length / perPage)} className="btn-secondary disabled:opacity-50 text-sm px-3 py-1.5">Next</button>
              </div>
            )}
          </div>
        )}

        {/* Attendance Report */}
        {!loading && tab === 'attendance' && (
          <div className="space-y-4">
            <div className="bento-card p-4 flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1">Filter by Event</label>
                <Select value={selectedEvent || '__all__'} onValueChange={(v) => setSelectedEvent(v === '__all__' ? '' : v)}>
                  <SelectTrigger className="bg-surface-container border-border/30 text-sm mt-1 w-[220px]">
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Events</SelectItem>
                    {eventSummaries.map(ev => (
                      <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button onClick={loadReport} className="px-4 py-2.5 btn-cta rounded-xl text-sm font-bold shadow-lg shadow-primary/20">Load</button>
            </div>

            {attendanceReport.map((event: any) => (
              <div key={event.eventId} className="bento-card overflow-hidden">
                <div className="pb-4 mb-4 border-b border-white/10">
                  <h3 className="font-semibold text-on-surface">{event.eventName}</h3>
                  <p className="text-sm text-muted-foreground">{event.eventType} | {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm">
                    <span className="text-muted-foreground">Total: <strong>{event.totalRegistrations}</strong></span>
                    <span className="text-emerald-400">Approved: <strong>{event.approved}</strong></span>
                    <span className="text-yellow-400">Pending: <strong>{event.pending}</strong></span>
                    <span className="text-blue-400">Paid: <strong>{event.paid}</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">By Club</h4>
                    {Object.entries(event.clubBreakdown || {}).map(([club, count]) => (
                      <div key={club} className="flex justify-between py-1 text-sm">
                        <span className="text-muted-foreground">{club}</span>
                        <span className="font-semibold text-on-surface">{count as number}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">By Category</h4>
                    {Object.entries(event.categoryBreakdown || {}).map(([cat, count]) => (
                      <div key={cat} className="flex justify-between py-1 text-sm">
                        <span className="text-muted-foreground">{cat}</span>
                        <span className="font-semibold text-on-surface">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {attendanceReport.length === 0 && (
              <div className="bento-card p-8 text-center text-muted-foreground">No attendance data</div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

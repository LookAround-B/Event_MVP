import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { FiDownload, FiBarChart2, FiDollarSign, FiUsers, FiCalendar } from 'react-icons/fi';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';

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
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Reports</h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'events', label: 'Event Summary', icon: FiCalendar },
            { key: 'financial', label: 'Financial Reconciliation', icon: FiDollarSign },
            { key: 'riders', label: 'Rider Statistics', icon: FiUsers },
            { key: 'attendance', label: 'Attendance', icon: FiBarChart2 },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-8 text-gray-400">Loading report...</div>}

        {/* Event Summary Report */}
        {!loading && tab === 'events' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Event</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Registrations</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Approved</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Paid</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {eventSummaries.map(ev => (
                    <tr key={ev.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{ev.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ev.eventType}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(ev.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-right">{ev.totalRegistrations}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-700">{ev.approved}</td>
                      <td className="px-4 py-3 text-sm text-right text-blue-700">{ev.paid}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">₹{ev.totalRevenue.toLocaleString()}</td>
                    </tr>
                  ))}
                  {eventSummaries.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-600">No events found</td></tr>
                  )}
                </tbody>
                {eventSummaries.length > 0 && (
                  <tfoot className="bg-gray-50 border-t">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-900">Totals</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">{eventSummaries.reduce((s, e) => s + e.totalRegistrations, 0)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-green-700">{eventSummaries.reduce((s, e) => s + e.approved, 0)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-blue-700">{eventSummaries.reduce((s, e) => s + e.paid, 0)}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold">₹{eventSummaries.reduce((s, e) => s + e.totalRevenue, 0).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* Financial Reconciliation Report */}
        {!loading && tab === 'financial' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-sm font-medium text-gray-700 block">Start Date</label>
                <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block">End Date</label>
                <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <button onClick={loadReport} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Apply</button>
              <button onClick={downloadFinancialCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1">
                <FiDownload size={14} /> Export CSV
              </button>
            </div>

            {financialReport && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">Expected Revenue</p>
                    <p className="text-xl font-bold text-gray-900">₹{financialReport.totalExpectedRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">Collected</p>
                    <p className="text-xl font-bold text-green-700">₹{financialReport.totalCollected.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">Outstanding</p>
                    <p className="text-xl font-bold text-red-700">₹{financialReport.totalOutstanding.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-xl font-bold text-gray-900">{financialReport.transactionCount}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">By Payment Method</h3>
                    {Object.entries(financialReport.byMethod).map(([method, data]) => (
                      <div key={method} className="flex justify-between py-1 border-b last:border-0">
                        <span className="text-sm text-gray-700">{method}</span>
                        <span className="text-sm font-semibold">₹{data.total.toLocaleString()} ({data.count})</span>
                      </div>
                    ))}
                    {Object.keys(financialReport.byMethod).length === 0 && <p className="text-sm text-gray-500">No data</p>}
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">By Status</h3>
                    {Object.entries(financialReport.byStatus).map(([status, data]) => (
                      <div key={status} className="flex justify-between py-1 border-b last:border-0">
                        <span className="text-sm text-gray-700">{status}</span>
                        <span className="text-sm font-semibold">₹{data.total.toLocaleString()} ({data.count})</span>
                      </div>
                    ))}
                    {Object.keys(financialReport.byStatus).length === 0 && <p className="text-sm text-gray-500">No data</p>}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Rider Statistics Report */}
        {!loading && tab === 'riders' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rider</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Club</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Events</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Registrations</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Horses</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {riderStats.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.club}</td>
                      <td className="px-4 py-3 text-sm text-right">{r.totalEvents}</td>
                      <td className="px-4 py-3 text-sm text-right">{r.totalRegistrations}</td>
                      <td className="px-4 py-3 text-sm text-right">{r.horses.length}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">₹{r.totalSpent.toLocaleString()}</td>
                    </tr>
                  ))}
                  {riderStats.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-600">No rider data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Attendance Report */}
        {!loading && tab === 'attendance' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-sm font-medium text-gray-700 block">Filter by Event</label>
                <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)} className="px-3 py-2 border rounded-lg text-sm mt-1">
                  <option value="">All Events</option>
                  {eventSummaries.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
              </div>
              <button onClick={loadReport} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Load</button>
            </div>

            {attendanceReport.map((event: any) => (
              <div key={event.eventId} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900">{event.eventName}</h3>
                  <p className="text-sm text-gray-600">{event.eventType} | {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-gray-700">Total: <strong>{event.totalRegistrations}</strong></span>
                    <span className="text-green-700">Approved: <strong>{event.approved}</strong></span>
                    <span className="text-yellow-700">Pending: <strong>{event.pending}</strong></span>
                    <span className="text-blue-700">Paid: <strong>{event.paid}</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">By Club</h4>
                    {Object.entries(event.clubBreakdown || {}).map(([club, count]) => (
                      <div key={club} className="flex justify-between py-1 text-sm">
                        <span className="text-gray-700">{club}</span>
                        <span className="font-semibold">{count as number}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">By Category</h4>
                    {Object.entries(event.categoryBreakdown || {}).map(([cat, count]) => (
                      <div key={cat} className="flex justify-between py-1 text-sm">
                        <span className="text-gray-700">{cat}</span>
                        <span className="font-semibold">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {attendanceReport.length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">No attendance data</div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

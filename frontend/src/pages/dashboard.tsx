import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiCalendar, FiUsers, FiBarChart, FiDollarSign, FiTrendingUp, FiBox, FiDownload, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/* ===================== TYPES ===================== */

interface KpiCards {
  totalEvents: number;
  clubsRegistered: number;
  ridersRegistered: number;
  horseCount: number;
  totalRevenue: number;
  collectibleAmount: number;
  receivableAmount: number;
}

interface EventChartData {
  eventId: string;
  eventName: string;
  startDate: string;
  unpaidRegistrations: number;
  totalRiders: number;
  totalHorses: number;
}

interface EventListItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venueAddress?: string;
  venueName?: string;
  eventType?: string;
  isPublished?: boolean;
}

interface ParticipantRow {
  id: string;
  eventName: string;
  eventId: string;
  eventDate: string;
  riderName: string;
  clubName: string;
  horseName: string;
  eventCategory: string;
  categoryId: string;
  price: number;
  paymentMethod: string;
  paymentStatus: string;
}

interface FilterOption {
  id: string;
  name: string;
}

/* ===================== UTILITY: Export helpers ===================== */

function escapeCSVField(field: string | number): string {
  const s = String(field);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
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

function exportTableToCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const csv = [
    headers.map(escapeCSVField).join(','),
    ...rows.map(r => r.map(escapeCSVField).join(',')),
  ].join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename);
}

function exportTableToExcel(headers: string[], rows: (string | number)[][], filename: string) {
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

/* ===================== STAT CARD ===================== */

function StatCard({ icon: Icon, title, value, color }: { icon: React.ComponentType<any>; title: string; value: string | number; color: string }) {
  return (
    <div className="glass p-5 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== PAGINATION ===================== */

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20 disabled:opacity-30 transition">
        <FiChevronLeft />
      </button>
      <span className="text-sm text-gray-300 px-3">Page {page} of {totalPages}</span>
      <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20 disabled:opacity-30 transition">
        <FiChevronRight />
      </button>
    </div>
  );
}

/* ===================== MULTI SELECT ===================== */

function MultiSelect({ label, options, selected, onChange }: { label: string; options: { value: string; label: string }[]; selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter(s => s !== val) : [...selected, val]);
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 rounded-lg bg-white bg-opacity-10 text-sm text-gray-200 text-left border border-white border-opacity-20 hover:bg-opacity-15 transition flex justify-between items-center"
      >
        <span>{selected.length > 0 ? `${label} (${selected.length})` : label}</span>
        <FiFilter className="w-3 h-3 text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg bg-slate-800 border border-white border-opacity-20 shadow-xl">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500">No options</div>
          ) : (
            options.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 px-3 py-2 hover:bg-white hover:bg-opacity-10 cursor-pointer text-sm text-gray-200">
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className="rounded border-gray-600 text-primary-500 focus:ring-primary-500"
                />
                {opt.label}
              </label>
            ))
          )}
          <div className="border-t border-white border-opacity-10 p-2 flex gap-2">
            <button type="button" onClick={() => { onChange([]); setOpen(false); }} className="text-xs text-gray-400 hover:text-white">Clear</button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-primary-400 hover:text-primary-300 ml-auto">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== SECTION SPINNER ===================== */

function SectionSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto mb-3" />
        {label && <p className="text-gray-400 text-sm">{label}</p>}
      </div>
    </div>
  );
}

/* ===================== MAIN DASHBOARD ===================== */

function DashboardContent() {
  const router = useRouter();

  // KPI & Charts state
  const [kpiCards, setKpiCards] = useState<KpiCards>({
    totalEvents: 0, clubsRegistered: 0, ridersRegistered: 0, horseCount: 0,
    totalRevenue: 0, collectibleAmount: 0, receivableAmount: 0,
  });
  const [eventChartData, setEventChartData] = useState<EventChartData[]>([]);
  const [selectedChartEvent, setSelectedChartEvent] = useState<string>('');

  // Event lists (with pagination)
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [eventTab, setEventTab] = useState<'current' | 'all'>('current');
  const [eventPage, setEventPage] = useState(1);
  const [eventTotalPages, setEventTotalPages] = useState(1);
  const [eventCount, setEventCount] = useState(0);

  // Participants
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [participantPage, setParticipantPage] = useState(1);
  const [participantTotalPages, setParticipantTotalPages] = useState(1);
  const [participantCount, setParticipantCount] = useState(0);

  // Participant filters
  const [filterMonths, setFilterMonths] = useState<string[]>([]);
  const [filterEvents, setFilterEvents] = useState<string[]>([]);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterPayment, setFilterPayment] = useState<string[]>([]);

  // Checkbox selection
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());

  // Filter options from backend
  const [eventOptions, setEventOptions] = useState<FilterOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<FilterOption[]>([]);

  // Main event filter (top dropdown)
  const [mainEventFilter, setMainEventFilter] = useState<string>('');

  // Independent loading states
  const [kpiLoading, setKpiLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch KPIs + charts + filter options (fast)
  const fetchKpis = useCallback(async () => {
    try {
      setKpiLoading(true);
      const params: any = {};
      if (mainEventFilter) params.eventId = mainEventFilter;
      const res = await api.get('/api/dashboard', { params });
      const data = res.data.data;
      setKpiCards(data.kpiCards);
      setEventChartData(data.charts.eventBreakdown || []);
      setEventOptions(data.filterOptions.events || []);
      setCategoryOptions(data.filterOptions.categories || []);
    } catch (err) {
      console.error('Failed to fetch KPIs:', err);
      setError('Failed to load dashboard KPIs');
    } finally {
      setKpiLoading(false);
    }
  }, [mainEventFilter]);

  // Fetch events (with pagination)
  const fetchEvents = useCallback(async () => {
    try {
      setEventsLoading(true);
      const params: any = { tab: eventTab, page: eventPage, limit: 15 };
      const res = await api.get('/api/dashboard/events', { params });
      const data = res.data.data;
      setEvents(data.events || []);
      setEventCount(data.count || 0);
      setEventTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setEventsLoading(false);
    }
  }, [eventTab, eventPage]);

  // Fetch participants (with filters + pagination)
  const fetchParticipants = useCallback(async () => {
    try {
      setParticipantsLoading(true);
      const params: any = { page: participantPage, limit: 20 };
      if (mainEventFilter) params.eventId = mainEventFilter;
      if (filterMonths.length) params.months = filterMonths.join(',');
      if (filterEvents.length) params.events = filterEvents.join(',');
      if (filterCategories.length) params.categories = filterCategories.join(',');
      if (filterPayment.length) params.payment = filterPayment.join(',');
      const res = await api.get('/api/dashboard/participants', { params });
      const data = res.data.data;
      setParticipants(data.data || []);
      setParticipantCount(data.count || 0);
      setParticipantTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Failed to fetch participants:', err);
    } finally {
      setParticipantsLoading(false);
    }
  }, [mainEventFilter, participantPage, filterMonths, filterEvents, filterCategories, filterPayment]);

  // Load KPIs on mount / main event filter change
  useEffect(() => { fetchKpis(); }, [fetchKpis]);
  // Load events independently
  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  // Load participants independently
  useEffect(() => { fetchParticipants(); }, [fetchParticipants]);

  // Generate month options (last 24 months)
  const monthOptions = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { year: 'numeric', month: 'short' });
      opts.push({ value: val, label });
    }
    return opts;
  }, []);

  // Chart data - filtered by selectedChartEvent
  const chartDisplayData = useMemo(() => {
    if (selectedChartEvent) {
      return eventChartData.filter(e => e.eventId === selectedChartEvent);
    }
    return eventChartData;
  }, [eventChartData, selectedChartEvent]);

  // Toggle all participants checkbox
  const toggleAllParticipants = () => {
    if (selectedParticipants.size === participants.length) {
      setSelectedParticipants(new Set());
    } else {
      setSelectedParticipants(new Set(participants.map(p => p.id)));
    }
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Export participants
  const handleExportParticipantsCSV = () => {
    const headers = ['Event Name', 'Event Date', 'Rider Name', 'Club Name', 'Horse Name', 'Event Category', 'Price (₹)', 'Payment Method', 'Payment Status'];
    const rows = participants.map(p => [
      p.eventName, new Date(p.eventDate).toLocaleDateString(), p.riderName,
      p.clubName, p.horseName, p.eventCategory, p.price, p.paymentMethod, p.paymentStatus,
    ]);
    exportTableToCSV(headers, rows, 'participants.csv');
  };

  const handleExportParticipantsExcel = () => {
    const headers = ['Event Name', 'Event Date', 'Rider Name', 'Club Name', 'Horse Name', 'Event Category', 'Price (₹)', 'Payment Method', 'Payment Status'];
    const rows = participants.map(p => [
      p.eventName, new Date(p.eventDate).toLocaleDateString(), p.riderName,
      p.clubName, p.horseName, p.eventCategory, p.price, p.paymentMethod, p.paymentStatus,
    ]);
    exportTableToExcel(headers, rows, 'participants.xls');
  };

  // Export events
  const handleExportEventsCSV = () => {
    const headers = ['Event Name', 'Start Date', 'End Date', 'Venue', 'Address'];
    const rows = events.map(e => [
      e.name, new Date(e.startDate).toLocaleDateString(), new Date(e.endDate).toLocaleDateString(),
      e.venueName || 'N/A', e.venueAddress || 'N/A',
    ]);
    exportTableToCSV(headers, rows, `events-${eventTab}.csv`);
  };

  const handleExportEventsExcel = () => {
    const headers = ['Event Name', 'Start Date', 'End Date', 'Venue', 'Address'];
    const rows = events.map(e => [
      e.name, new Date(e.startDate).toLocaleDateString(), new Date(e.endDate).toLocaleDateString(),
      e.venueName || 'N/A', e.venueAddress || 'N/A',
    ]);
    exportTableToExcel(headers, rows, `events-${eventTab}.xls`);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <ProtectedRoute>
      <Head><title>Dashboard | Equestrian Events</title></Head>
      <div className="space-y-8">
        {/* Header + Main Event Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <div className="w-full md:w-72">
            <select
              value={mainEventFilter}
              onChange={e => { setMainEventFilter(e.target.value); setParticipantPage(1); }}
              className="w-full px-4 py-2.5 rounded-xl bg-white bg-opacity-10 text-white border border-white border-opacity-20 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="" className="bg-slate-800">All Events</option>
              {eventOptions.map(ev => (
                <option key={ev.id} value={ev.id} className="bg-slate-800">{ev.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-15 border border-red-400 border-opacity-30 text-red-300 backdrop-blur-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        {/* ==================== SECTION 1: KPI STAT CARDS ==================== */}
        {kpiLoading ? (
          <SectionSpinner label="Loading KPIs..." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard icon={FiCalendar} title="Total Events" value={kpiCards.totalEvents} color="bg-blue-500" />
            <StatCard icon={FiUsers} title="Clubs | Riders" value={`${kpiCards.clubsRegistered} | ${kpiCards.ridersRegistered}`} color="bg-teal-500" />
            <StatCard icon={FiBox} title="Horse Count" value={kpiCards.horseCount} color="bg-purple-500" />
            <StatCard icon={FiDollarSign} title="Total Amount" value={`₹${kpiCards.totalRevenue.toLocaleString('en-IN')}`} color="bg-pink-500" />
            <StatCard icon={FiTrendingUp} title="Collectible" value={`₹${kpiCards.collectibleAmount.toLocaleString('en-IN')}`} color="bg-orange-500" />
            <StatCard icon={FiBarChart} title="Receivable" value={`₹${kpiCards.receivableAmount.toLocaleString('en-IN')}`} color="bg-red-500" />
          </div>
        )}

        {/* ==================== SECTION 2: BAR CHART ==================== */}
        {kpiLoading ? (
          <SectionSpinner label="Loading charts..." />
        ) : (
          <div className="glass p-6 rounded-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold text-white">Event Stats</h3>
              <select
                value={selectedChartEvent}
                onChange={e => setSelectedChartEvent(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white bg-opacity-10 text-sm text-gray-200 border border-white border-opacity-20"
              >
                <option value="" className="bg-slate-800">All Events</option>
                {eventChartData.map(ev => (
                  <option key={ev.eventId} value={ev.eventId} className="bg-slate-800">{ev.eventName}</option>
                ))}
              </select>
            </div>
            {chartDisplayData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartDisplayData} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="eventName" angle={-35} textAnchor="end" height={80} tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }} />
                  <Legend wrapperStyle={{ color: '#fff' }} />
                  <Bar dataKey="unpaidRegistrations" fill="#f87171" name="Unpaid" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalRiders" fill="#34d399" name="Riders" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalHorses" fill="#60a5fa" name="Horses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-8">No event data</p>
            )}
          </div>
        )}

        {/* ==================== SECTION 3: EVENTS TABLE WITH TABS + PAGINATION ==================== */}
        <div className="glass p-6 rounded-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
            <div className="flex gap-1 bg-white bg-opacity-5 rounded-lg p-1">
              <button
                onClick={() => { setEventTab('current'); setEventPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${eventTab === 'current' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Current Events
              </button>
              <button
                onClick={() => { setEventTab('all'); setEventPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${eventTab === 'all' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                All Events ({eventCount})
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExportEventsCSV} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white bg-opacity-10 text-gray-300 text-xs hover:bg-opacity-20 transition">
                <FiDownload className="w-3 h-3" /> CSV
              </button>
              <button onClick={handleExportEventsExcel} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 bg-opacity-80 text-white text-xs hover:bg-opacity-100 transition">
                <FiDownload className="w-3 h-3" /> Excel
              </button>
            </div>
          </div>

          {eventsLoading ? (
            <SectionSpinner label="Loading events..." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white border-opacity-10">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Event Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Start Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">End Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Venue Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No events found</td></tr>
                    ) : (
                      events.map(ev => (
                        <tr
                          key={ev.id}
                          onClick={() => router.push(`/events/${ev.id}`)}
                          className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5 cursor-pointer transition"
                        >
                          <td className="px-4 py-3 text-white font-medium">{ev.name}</td>
                          <td className="px-4 py-3 text-gray-300">{formatDate(ev.startDate)}</td>
                          <td className="px-4 py-3 text-gray-300">{formatDate(ev.endDate)}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{ev.venueAddress || ev.venueName || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={eventPage} totalPages={eventTotalPages} onPageChange={setEventPage} />
            </>
          )}
        </div>

        {/* ==================== SECTION 4: PARTICIPANTS LIST ==================== */}
        <div className="glass p-6 rounded-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
            <h3 className="text-lg font-semibold text-white">Participants List <span className="text-sm font-normal text-gray-400">({participantCount} total)</span></h3>
            <div className="flex gap-2">
              <button onClick={handleExportParticipantsCSV} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white bg-opacity-10 text-gray-300 text-xs hover:bg-opacity-20 transition">
                <FiDownload className="w-3 h-3" /> CSV
              </button>
              <button onClick={handleExportParticipantsExcel} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 bg-opacity-80 text-white text-xs hover:bg-opacity-100 transition">
                <FiDownload className="w-3 h-3" /> Excel
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <MultiSelect
              label="Month & Year"
              options={monthOptions}
              selected={filterMonths}
              onChange={v => { setFilterMonths(v); setParticipantPage(1); }}
            />
            <MultiSelect
              label="Select Events"
              options={eventOptions.map(e => ({ value: e.id, label: e.name }))}
              selected={filterEvents}
              onChange={v => { setFilterEvents(v); setParticipantPage(1); }}
            />
            <MultiSelect
              label="Event Category"
              options={categoryOptions.map(c => ({ value: c.id, label: c.name }))}
              selected={filterCategories}
              onChange={v => { setFilterCategories(v); setParticipantPage(1); }}
            />
            <MultiSelect
              label="Payment Status"
              options={[
                { value: 'PAID', label: 'Paid' },
                { value: 'UNPAID', label: 'Unpaid' },
                { value: 'PARTIAL', label: 'Partial' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
              selected={filterPayment}
              onChange={v => { setFilterPayment(v); setParticipantPage(1); }}
            />
          </div>

          {participantsLoading ? (
            <SectionSpinner label="Loading participants..." />
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white border-opacity-10">
                      <th className="px-3 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={participants.length > 0 && selectedParticipants.size === participants.length}
                          onChange={toggleAllParticipants}
                          className="rounded border-gray-600 text-primary-500 focus:ring-primary-500"
                        />
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Event Name</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Event Date</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rider Name</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Club Name</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Horse Name</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Event Category</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Price (₹)</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment Method</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.length === 0 ? (
                      <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500">No participants found</td></tr>
                    ) : (
                      participants.map(p => (
                        <tr key={p.id} className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5 transition">
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={selectedParticipants.has(p.id)}
                              onChange={() => toggleParticipant(p.id)}
                              className="rounded border-gray-600 text-primary-500 focus:ring-primary-500"
                            />
                          </td>
                          <td className="px-3 py-3 text-white font-medium">{p.eventName}</td>
                          <td className="px-3 py-3 text-gray-300">{formatDate(p.eventDate)}</td>
                          <td className="px-3 py-3 text-gray-200">{p.riderName}</td>
                          <td className="px-3 py-3 text-gray-300">{p.clubName}</td>
                          <td className="px-3 py-3 text-gray-300">{p.horseName}</td>
                          <td className="px-3 py-3 text-gray-300">{p.eventCategory}</td>
                          <td className="px-3 py-3 text-gray-200 font-medium">₹{p.price.toLocaleString('en-IN')}</td>
                          <td className="px-3 py-3 text-gray-400 text-xs">{p.paymentMethod}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              p.paymentStatus === 'PAID' ? 'bg-green-500 bg-opacity-20 text-green-300' :
                              p.paymentStatus === 'PARTIAL' ? 'bg-yellow-500 bg-opacity-20 text-yellow-300' :
                              p.paymentStatus === 'CANCELLED' ? 'bg-red-500 bg-opacity-20 text-red-300' :
                              'bg-gray-500 bg-opacity-20 text-gray-300'
                            }`}>
                              {p.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={participantPage} totalPages={participantTotalPages} onPageChange={setParticipantPage} />
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}

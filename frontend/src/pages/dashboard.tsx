import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Calendar, Users, BarChart3, DollarSign, TrendingUp,
  Box, Download, Filter, ChevronLeft, ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
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

/* ===================== CUSTOM CHART TOOLTIP ===================== */

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="font-semibold text-sm mb-1" >{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

/* ===================== STAT CARD ===================== */

const iconColors: Record<string, { bg: string; text: string }> = {
  emerald: { bg: 'hsla(145,63%,42%,0.12)', text: 'hsl(145,63%,55%)' },
  violet: { bg: 'hsla(253,90%,73%,0.12)', text: 'hsl(253,90%,73%)' },
  sky: { bg: 'hsla(199,89%,48%,0.12)', text: 'hsl(199,89%,60%)' },
  rose: { bg: 'hsl(var(--primary) / 0.12)', text: 'hsl(var(--primary))' },
  amber: { bg: 'hsla(38,92%,50%,0.12)', text: 'hsl(38,92%,58%)' },
};

function StatCard({
  icon: Icon, title, value, colorKey, animClass,
}: {
  icon: React.ComponentType<any>;
  title: string;
  value: string | number;
  colorKey: string;
  animClass?: string;
}) {
  const c = iconColors[colorKey] || iconColors.emerald;
  return (
    <div className={`stat-card ${animClass || ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest"
            
          >
            {title}
          </p>
          <p className="text-2xl font-bold mt-1" >
            {value}
          </p>
        </div>
        <div className="p-2.5 rounded-lg" style={{ background: c.bg }}>
          <Icon size={20} style={{ color: c.text }} />
        </div>
      </div>
    </div>
  );
}

/* ===================== HERO KPI CARD ===================== */

function HeroKpiCard({ title, value, animClass }: { title: string; value: string; animClass?: string }) {
  return (
    <div className={`hero-kpi primary-card-glow ${animClass || ''}`}>
      <div className="hero-value">{value}</div>
      <div className="hero-label">{title}</div>
    </div>
  );
}

/* ===================== PAGINATION ===================== */

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="btn btn-ghost p-2 disabled:opacity-30"
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm px-3" >
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="btn btn-ghost p-2 disabled:opacity-30"
        aria-label="Next page"
      >
        <ChevronRight size={16} />
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
        className="input w-full text-left flex justify-between items-center cursor-pointer"
      >
        <span className="text-sm">{selected.length > 0 ? `${label} (${selected.length})` : label}</span>
        <Filter size={14}  />
      </button>
      {open && (
        <div
          className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg shadow-xl"
          style={{
            background: 'hsl(var(--surface-container))',
            border: '1px solid hsl(var(--border) / 0.5)',
          }}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs" >No options</div>
          ) : (
            options.map(opt => (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors"
                
                onMouseOver={(e) => (e.currentTarget.style.background = 'hsl(var(--surface-bright))')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className="rounded"
                  style={{ accentColor: 'hsl(var(--primary))' }}
                />
                {opt.label}
              </label>
            ))
          )}
          <div
            className="p-2 flex gap-2 border-t border-border/30"
          >
            <button
              type="button"
              onClick={() => { onChange([]); setOpen(false); }}
              className="text-xs transition-colors"
              
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs ml-auto transition-colors"
              style={{ color: 'hsl(var(--primary))' }}
            >
              Done
            </button>
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
        <div
          className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 mx-auto mb-3"
          style={{ borderColor: 'hsl(var(--primary))' }}
        />
        {label && <p className="text-sm" >{label}</p>}
      </div>
    </div>
  );
}

/* ===================== MAIN DASHBOARD ===================== */

function DashboardContent() {
  const router = useRouter();

  const [kpiCards, setKpiCards] = useState<KpiCards>({
    totalEvents: 0, clubsRegistered: 0, ridersRegistered: 0, horseCount: 0,
    totalRevenue: 0, collectibleAmount: 0, receivableAmount: 0,
  });
  const [eventChartData, setEventChartData] = useState<EventChartData[]>([]);
  const [selectedChartEvent, setSelectedChartEvent] = useState<string>('');

  const [events, setEvents] = useState<EventListItem[]>([]);
  const [eventTab, setEventTab] = useState<'current' | 'all'>('current');
  const [eventPage, setEventPage] = useState(1);
  const [eventTotalPages, setEventTotalPages] = useState(1);
  const [eventCount, setEventCount] = useState(0);

  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [participantPage, setParticipantPage] = useState(1);
  const [participantTotalPages, setParticipantTotalPages] = useState(1);
  const [participantCount, setParticipantCount] = useState(0);

  const [filterMonths, setFilterMonths] = useState<string[]>([]);
  const [filterEvents, setFilterEvents] = useState<string[]>([]);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterPayment, setFilterPayment] = useState<string[]>([]);

  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());

  const [eventOptions, setEventOptions] = useState<FilterOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<FilterOption[]>([]);

  const [mainEventFilter, setMainEventFilter] = useState<string>('');

  const [kpiLoading, setKpiLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => { fetchKpis(); }, [fetchKpis]);
  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { fetchParticipants(); }, [fetchParticipants]);

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

  const chartDisplayData = useMemo(() => {
    if (selectedChartEvent) {
      return eventChartData.filter(e => e.eventId === selectedChartEvent);
    }
    return eventChartData;
  }, [eventChartData, selectedChartEvent]);

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

  const paymentBadge = (status: string) => {
    const map: Record<string, string> = {
      PAID: 'badge-emerald',
      PARTIAL: 'badge-warning',
      CANCELLED: 'badge-danger',
      UNPAID: 'badge-muted',
    };
    return map[status] || 'badge-muted';
  };

  return (
    <ProtectedRoute>
      <Head><title>Dashboard | Equestrian Events</title></Head>
      <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
        {/* Header + Main Event Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl lg:text-5xl">
              Command <span className="gradient-text">Center</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Real-time platform analytics and event intelligence.</p>
          </div>
          <div className="w-full md:w-72">
            <select
              value={mainEventFilter}
              onChange={e => { setMainEventFilter(e.target.value); setParticipantPage(1); }}
              className="input w-full"
            >
              <option value="">All Events</option>
              {eventOptions.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{
              background: 'hsl(var(--error) / 0.1)',
              border: '1px solid hsl(var(--error) / 0.3)',
              color: 'hsl(var(--error))',
            }}
          >
            {error}
          </div>
        )}

        {/* ═══════ SECTION 1: KPI STAT CARDS ═══════ */}
        {kpiLoading ? (
          <SectionSpinner label="Loading KPIs..." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <HeroKpiCard
              title="Total Revenue"
              value={`₹${kpiCards.totalRevenue.toLocaleString('en-IN')}`}
              animClass="animate-slide-up-1"
            />
            <StatCard icon={Calendar} title="Total Events" value={kpiCards.totalEvents} colorKey="emerald" animClass="animate-slide-up-2" />
            <StatCard icon={Users} title="Clubs | Riders" value={`${kpiCards.clubsRegistered} | ${kpiCards.ridersRegistered}`} colorKey="violet" animClass="animate-slide-up-3" />
            <StatCard icon={Box} title="Horse Count" value={kpiCards.horseCount} colorKey="violet" animClass="animate-slide-up-4" />
            <StatCard icon={TrendingUp} title="Collectible" value={`₹${kpiCards.collectibleAmount.toLocaleString('en-IN')}`} colorKey="sky" animClass="animate-slide-up-5" />
            <StatCard icon={BarChart3} title="Receivable" value={`₹${kpiCards.receivableAmount.toLocaleString('en-IN')}`} colorKey="rose" animClass="animate-slide-up-6" />
          </div>
        )}

        {/* ═══════ SECTION 2: BAR CHART ═══════ */}
        {kpiLoading ? (
          <SectionSpinner label="Loading charts..." />
        ) : (
          <div className="bento-card">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold" >Event Stats</h3>
              <select
                value={selectedChartEvent}
                onChange={e => setSelectedChartEvent(e.target.value)}
                className="input w-auto"
              >
                <option value="">All Events</option>
                {eventChartData.map(ev => (
                  <option key={ev.eventId} value={ev.eventId}>{ev.eventName}</option>
                ))}
              </select>
            </div>
            {chartDisplayData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartDisplayData} barCategoryGap="28%" margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsla(224,20%,20%,0.3)" />
                  <XAxis
                    dataKey="eventName"
                    angle={-35}
                    textAnchor="end"
                    height={80}
                    tick={{ fill: 'hsl(224,8%,50%)', fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis tick={{ fill: 'hsl(224,8%,50%)', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: 'hsl(224,10%,80%)' }} />
                  <Bar dataKey="unpaidRegistrations" fill="hsl(0,85%,60%)" name="Unpaid" radius={[5, 5, 2, 2]} />
                  <Bar dataKey="totalRiders" fill="hsl(145,63%,55%)" name="Riders" radius={[5, 5, 2, 2]} />
                  <Bar dataKey="totalHorses" fill="hsl(253,90%,73%)" name="Horses" radius={[5, 5, 2, 2]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-8" >No event data</p>
            )}
          </div>
        )}

        {/* ═══════ SECTION 3: EVENTS TABLE ═══════ */}
        <div className="bento-card">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
            {/* Tab toggles */}
            <div
              className="flex gap-1 rounded-lg p-1"
              style={{ background: 'hsl(var(--surface-container))' }}
            >
              <button
                onClick={() => { setEventTab('current'); setEventPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  eventTab === 'current' ? 'btn-primary' : ''
                }`}
                style={eventTab !== 'current' ? { color: 'hsl(var(--muted-foreground))' } : {}}
              >
                Current Events
              </button>
              <button
                onClick={() => { setEventTab('all'); setEventPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  eventTab === 'all' ? 'btn-primary' : ''
                }`}
                style={eventTab !== 'all' ? { color: 'hsl(var(--muted-foreground))' } : {}}
              >
                All Events ({eventCount})
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExportEventsCSV} className="btn btn-ghost text-xs">
                <Download size={14} /> CSV
              </button>
              <button onClick={handleExportEventsExcel} className="btn btn-secondary text-xs">
                <Download size={14} /> Excel
              </button>
            </div>
          </div>

          {eventsLoading ? (
            <SectionSpinner label="Loading events..." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Venue Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8" >
                          No events found
                        </td>
                      </tr>
                    ) : (
                      events.map(ev => (
                        <tr
                          key={ev.id}
                          onClick={() => router.push(`/events/${ev.id}`)}
                          className="cursor-pointer"
                        >
                          <td className="font-medium" >{ev.name}</td>
                          <td>{formatDate(ev.startDate)}</td>
                          <td>{formatDate(ev.endDate)}</td>
                          <td className="text-xs" >
                            {ev.venueAddress || ev.venueName || 'N/A'}
                          </td>
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

        {/* ═══════ SECTION 4: PARTICIPANTS LIST ═══════ */}
        <div className="bento-card">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
            <h3 className="text-lg font-semibold" >
              Participants List{' '}
              <span className="text-sm font-normal" >
                ({participantCount} total)
              </span>
            </h3>
            <div className="flex gap-2">
              <button onClick={handleExportParticipantsCSV} className="btn btn-ghost text-xs">
                <Download size={14} /> CSV
              </button>
              <button onClick={handleExportParticipantsExcel} className="btn btn-secondary text-xs">
                <Download size={14} /> Excel
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="w-10">
                        <input
                          type="checkbox"
                          checked={participants.length > 0 && selectedParticipants.size === participants.length}
                          onChange={toggleAllParticipants}
                          style={{ accentColor: 'hsl(var(--primary))' }}
                        />
                      </th>
                      <th>Event Name</th>
                      <th>Event Date</th>
                      <th>Rider Name</th>
                      <th>Club Name</th>
                      <th>Horse Name</th>
                      <th>Event Category</th>
                      <th>Price (₹)</th>
                      <th>Payment Method</th>
                      <th>Payment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-8" >
                          No participants found
                        </td>
                      </tr>
                    ) : (
                      participants.map(p => (
                        <tr key={p.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedParticipants.has(p.id)}
                              onChange={() => toggleParticipant(p.id)}
                              style={{ accentColor: 'hsl(var(--primary))' }}
                            />
                          </td>
                          <td className="font-medium" >{p.eventName}</td>
                          <td>{formatDate(p.eventDate)}</td>
                          <td>{p.riderName}</td>
                          <td>{p.clubName}</td>
                          <td>{p.horseName}</td>
                          <td>{p.eventCategory}</td>
                          <td className="font-medium" >
                            ₹{p.price.toLocaleString('en-IN')}
                          </td>
                          <td className="text-xs" >{p.paymentMethod}</td>
                          <td>
                            <span className={`badge ${paymentBadge(p.paymentStatus)}`}>
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

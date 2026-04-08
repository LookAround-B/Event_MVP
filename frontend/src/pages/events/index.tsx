import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Eye, Download, Calendar, Check, Layers, Activity, Clock, MapPin, LayoutGrid, Table as TableIcon, Copy, ToggleLeft, ToggleRight, Ban } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import Pagination from '@/components/Pagination';
import { KPICard } from '@/components/dashboard/KPICard';
import { KPIGrid } from '@/components/dashboard/KPIGrid';
import { FilterDropdown } from '@/components/FilterDropdown';
import { CalendarView } from '@/components/CalendarView';
import { cn } from '@/lib/utils';import CreateEventModal from '@/components/CreateEventModal';import EditEventModal from '@/components/EditEventModal';import { ActionItem } from '@/components/ActionsDropdown';

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venueName: string;
  description: string;
  isPublished: boolean;
  registrationCount: number;
  eventType?: string;
  categoryCount?: number;
}

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

export default function Events() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [activeTab, setActiveTab] = useState<'current' | 'all'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/events', {
        params: { page, limit: 10, search: searchTerm },
      });
      if (!response.data.success) {
        toast.error(response.data.message || 'Failed to load events');
        return;
      }
      setEvents(response.data.data.events);
      setTotalPages(response.data.data.pagination.pages);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === events.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(events.map(e => e.id)));
    }
  };

  const getExportData = () => {
    const headers = ['Event Name', 'Venue Name', 'Event Start Date', 'Event End Date', 'Published', 'Registrations'];
    const source = selectedIds.size > 0 ? events.filter(e => selectedIds.has(e.id)) : events;
    const rows = source.map(e => [
      e.name, e.venueName || 'N/A',
      new Date(e.startDate).toLocaleDateString(),
      new Date(e.endDate).toLocaleDateString(),
      e.isPublished ? 'Yes' : 'No', e.registrationCount,
    ]);
    return { headers, rows };
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await api.delete(`/api/events/${id}`);
      if (res.data && !res.data.success) {
        toast.error(res.data.message || 'Failed to delete event');
        return;
      }
      setEvents(prev => prev.filter(e => e.id !== id));
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
      toast.success('Event deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await api.post(`/api/events/${id}/duplicate`);
      if (res.data && !res.data.success) {
        toast.error(res.data.message || 'Failed to duplicate event');
        return;
      }
      fetchEvents();
      toast.success('Event duplicated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to duplicate event');
    }
  };

  const handleExportCSV = () => {
    const { headers, rows } = getExportData();
    const csv = [
      headers.map(escapeCSVField).join(','),
      ...rows.map(r => r.map(escapeCSVField).join(',')),
    ].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'events.csv');
    toast.success('Events exported as CSV');
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    exportToExcel(headers, rows, 'events.xls');
    toast.success('Events exported as Excel');
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const res = await api.patch(`/api/events/${id}/publish`, { isPublished: !currentStatus });
      if (res.data && !res.data.success) {
        toast.error(res.data.message || 'Failed to update publish status');
        return;
      }
      setEvents(prev => prev.map(e => e.id === id ? { ...e, isPublished: !currentStatus } : e));
      toast.success(`Event ${!currentStatus ? 'published' : 'unpublished'}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update publish status');
    }
  };

  const displayEvents = (() => {
    let result = events;
    if (activeTab === 'current') result = result.filter(e => e.isPublished);
    if (selectedTypes.length > 0) result = result.filter(e => selectedTypes.includes(e.eventType || ''));
    return result;
  })();

  return (
    <ProtectedRoute>
      <Head><title>Events | Equestrian Events</title></Head>
      <div className="animate-fade-in max-w-[1600px] mx-auto">

        {/* Page heading */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl lg:text-5xl">
            National <span className="gradient-text">Registry</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Master list of all equestrian championships and regional qualifiers. Manage venues, timelines, and registration tiers.
          </p>
        </div>

        {/* KPI Stats */}
        <KPIGrid>
          <KPICard title="Scheduled Events" value={events.length} icon={Calendar} variant="primary" trend={{ value: '+2', isUp: true }} subText="Current season" className="animate-slide-up-1" />
          <KPICard title="Published Status" value={events.filter(e => e.isPublished).length} icon={Check} variant="outline" subText="Live on portal" className="animate-slide-up-2" />
          <KPICard title="Global Categories" value={events.reduce((a, e) => a + (e.categoryCount || 0), 0)} icon={Layers} variant="outline" subText="Across all shows" className="animate-slide-up-3" />
          <KPICard title="Platform Load" value="Normal" icon={Activity} variant="secondary" subText="Latency: 14ms" className="animate-slide-up-4" />
        </KPIGrid>

        {/* Action bar */}
        <div className="bento-card p-4 mb-4 lg:mb-6 animate-slide-up-2 border-beam" style={{ overflow: 'visible' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10 w-full">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Find championship..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="pl-10 pr-4 py-3 bg-surface-container/50 rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-full sm:w-72 border border-border/30 transition-all focus:bg-surface-container"
                />
              </div>
              <FilterDropdown
                label="Event Logic"
                options={[
                  { label: 'KSEC', value: 'KSEC' },
                  { label: 'EPL', value: 'EPL' },
                  { label: 'EIRS Show', value: 'EIRS Show' },
                ]}
                selected={selectedTypes}
                onChange={(vals) => { setSelectedTypes(vals); setPage(1); }}
              />
              <div className="flex items-center gap-1 bg-surface-container/40 p-1 rounded-xl border border-border/30 ml-auto sm:ml-0">
                <button
                  onClick={() => setViewMode('table')}
                  className={cn('p-1.5 rounded-lg transition-all', viewMode === 'table' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-on-surface')}
                  title="Table View"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={cn('p-1.5 rounded-lg transition-all', viewMode === 'calendar' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-on-surface')}
                  title="Calendar View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-surface-container/60 rounded-xl text-sm text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/30">
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export Manifest</span>
              </button>
              <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-4 sm:px-5 py-2.5 btn-cta rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex-1 sm:flex-initial justify-center transition-all active:scale-95">
                <Plus className="w-4 h-4" /> Define Event
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 animate-slide-up-2">
          <div className="flex gap-1 bg-surface-container rounded-xl p-1 w-fit border border-border/30 shadow-inner">
            {(['current', 'all'] as const).map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); }}
                className={`px-4 sm:px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === tab ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-on-surface'}`}>
                {tab === 'current' ? 'Global Public' : 'Entire Roster'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {viewMode === 'calendar' ? (
          <div className="bento-card p-4 animate-slide-up-3">
            <CalendarView events={displayEvents.map(e => ({ ...e, id: parseInt(e.id) || 0, eventType: e.eventType || '' }))} />
          </div>
        ) : (
        <div className="bento-card overflow-hidden animate-slide-up-3">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary/40 via-primary/40 to-secondary/40" />
          {loading ? (
            <div className="py-8">
              <div className="flex flex-col gap-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 rounded-lg animate-pulse"
                    style={{ background: 'hsl(var(--surface-container))' }}
                  />
                ))}
              </div>
            </div>
          ) : displayEvents.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground italic">
              No championship events detected in this frequency.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="label-tech text-left bg-surface-container/40">
                    <th className="p-3 sm:p-4 w-12"><input type="checkbox" checked={selectedIds.size === displayEvents.length && displayEvents.length > 0} onChange={toggleSelectAll} className="accent-primary rounded" /></th>
                    <th className="p-3 sm:p-4">Championship Manifest</th>
                    <th className="p-3 sm:p-4">Timeline Alpha</th>
                    <th className="p-3 sm:p-4">Operational Node</th>
                    <th className="p-3 sm:p-4 text-center">Registrations</th>
                    <th className="p-3 sm:p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {displayEvents.map((event) => (
                    <tr key={event.id} className="group hover:bg-surface-container/20 transition-all duration-300">
                      <td className="p-3 sm:p-4"><input type="checkbox" checked={selectedIds.has(event.id)} onChange={() => toggleSelect(event.id)} className="accent-primary rounded" /></td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-border/30 shadow-inner group-hover:scale-110 transition-transform ${event.isPublished ? 'bg-primary/10 text-primary' : 'bg-surface-container text-muted-foreground'}`}>
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-on-surface font-bold tracking-tight">{event.name}</span>
                            <div className="flex items-center gap-2">
                              {event.eventType && <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">{event.eventType}</span>}
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border w-fit ${event.isPublished ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-container text-muted-foreground border-border/30'}`}>
                                {event.isPublished ? 'PUBLISHED' : 'DRAFT'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 text-xs font-mono text-on-surface-variant">
                            <Clock className="w-3 h-3 text-secondary" /> {new Date(event.startDate).toLocaleDateString()}
                          </div>
                          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest ml-4">End: {new Date(event.endDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex flex-col">
                          <span className="text-on-surface-variant font-medium flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-muted-foreground" /> {event.venueName || 'TBD'}
                          </span>
                          {event.categoryCount != null && (
                            <span className="text-[10px] text-muted-foreground uppercase ml-4">{event.categoryCount} Categories</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{event.registrationCount}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Athletes</span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => router.push(`/events/${event.id}`)} title="View" className="p-2 rounded-lg hover:bg-surface-container text-muted-foreground hover:text-on-surface transition-all active:scale-95"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => setEditEventId(event.id)} title="Edit" className="p-2 rounded-lg hover:bg-surface-container text-muted-foreground hover:text-on-surface transition-all active:scale-95"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(event.id)} title="Delete" className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all active:scale-95"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              <div className="bg-surface-container/20 p-2 border-t border-border/10">
                <Pagination total={displayEvents.length} page={page} perPage={10} onChange={setPage} />
              </div>
            </>
          )}
        </div>
        )}
      </div>

      <CreateEventModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={fetchEvents} />
      <EditEventModal open={!!editEventId} eventId={editEventId} onClose={() => setEditEventId(null)} onUpdated={fetchEvents} />
    </ProtectedRoute>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Eye, Copy, ToggleLeft, ToggleRight, Download } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import ActionsDropdown from '@/components/ActionsDropdown';
import type { ActionItem } from '@/components/ActionsDropdown';

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venueName: string;
  description: string;
  isPublished: boolean;
  registrationCount: number;
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

  const getEventActions = (event: Event): ActionItem[] => [
    { label: 'View', icon: <Eye size={16} />, onClick: () => router.push(`/events/${event.id}`) },
    { label: 'Edit', icon: <Edit size={16} />, onClick: () => router.push(`/events/create?id=${event.id}`), className: 'text-amber-400 hover:text-amber-300' },
    { label: 'Duplicate', icon: <Copy size={16} />, onClick: () => handleDuplicate(event.id), className: 'text-blue-400 hover:text-blue-300' },
    {
      label: event.isPublished ? 'Unpublish' : 'Publish',
      icon: event.isPublished ? <ToggleLeft size={16} /> : <ToggleRight size={16} />,
      onClick: () => handleTogglePublish(event.id, event.isPublished),
      className: event.isPublished ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300',
    },
    { label: 'Delete', icon: <Trash2 size={16} />, onClick: () => handleDelete(event.id), className: 'text-red-400 hover:text-red-300' },
  ];

  return (
    <ProtectedRoute>
      <Head><title>Events | Equestrian Events</title></Head>
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--on-surface))' }}>Events</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleExportCSV} className="btn btn-ghost text-sm">
              <Download size={16} /> CSV
            </button>
            <button onClick={handleExportExcel} className="btn btn-secondary text-sm">
              <Download size={16} /> Excel
            </button>
            <Link href="/events/create" className="btn btn-primary text-sm">
              <Plus size={16} /> New Event
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bento-card mb-6">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <input
              type="text"
              placeholder="Search events by name, location..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bento-card overflow-x-auto">
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
          ) : events.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {searchTerm ? 'No events match your search' : 'No events yet. Create one to get started!'}
            </div>
          ) : (
            <>
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr>
                    <th className="w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === events.length && events.length > 0}
                        onChange={toggleSelectAll}
                        style={{ accentColor: 'hsl(var(--primary))' }}
                      />
                    </th>
                    <th>Event Name</th>
                    <th>Venue</th>
                    <th>Start Date</th>
                    <th>Status</th>
                    <th>Registrations</th>
                    <th className="w-16 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(event.id)}
                          onChange={() => toggleSelect(event.id)}
                          style={{ accentColor: 'hsl(var(--primary))' }}
                        />
                      </td>
                      <td className="font-medium" style={{ color: 'hsl(var(--on-surface))' }}>{event.name}</td>
                      <td>{event.venueName || 'N/A'}</td>
                      <td>{new Date(event.startDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${event.isPublished ? 'badge-emerald' : 'badge-muted'}`}>
                          {event.isPublished ? <ToggleRight size={12} className="mr-1" /> : <ToggleLeft size={12} className="mr-1" />}
                          {event.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-success">{event.registrationCount}</span>
                      </td>
                      <td className="text-center">
                        <ActionsDropdown actions={getEventActions(event)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="btn btn-ghost disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="btn btn-ghost disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

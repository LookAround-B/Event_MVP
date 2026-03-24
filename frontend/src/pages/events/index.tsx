import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiEye, FiCopy, FiToggleLeft, FiToggleRight, FiDownload } from 'react-icons/fi';
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

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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
      e.name,
      e.venueName || 'N/A',
      new Date(e.startDate).toLocaleDateString(),
      new Date(e.endDate).toLocaleDateString(),
      e.isPublished ? 'Yes' : 'No',
      e.registrationCount,
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
    {
      label: 'View',
      icon: <FiEye className="w-4 h-4" />,
      onClick: () => router.push(`/events/${event.id}`),
    },
    {
      label: 'Edit',
      icon: <FiEdit className="w-4 h-4" />,
      onClick: () => router.push(`/events/create?id=${event.id}`),
      className: 'text-amber-400 hover:text-amber-300',
    },
    {
      label: 'Duplicate',
      icon: <FiCopy className="w-4 h-4" />,
      onClick: () => handleDuplicate(event.id),
      className: 'text-blue-400 hover:text-blue-300',
    },
    {
      label: event.isPublished ? 'Unpublish' : 'Publish',
      icon: event.isPublished ? <FiToggleLeft className="w-4 h-4" /> : <FiToggleRight className="w-4 h-4" />,
      onClick: () => handleTogglePublish(event.id, event.isPublished),
      className: event.isPublished ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300',
    },
    {
      label: 'Delete',
      icon: <FiTrash2 className="w-4 h-4" />,
      onClick: () => handleDelete(event.id),
      className: 'text-red-400 hover:text-red-300',
    },
  ];

  return (
    <ProtectedRoute>
      <Head><title>Events | Equestrian Events</title></Head>
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h2 className="text-3xl font-bold text-white">Events</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleExportCSV} className="btn-secondary text-sm">
              <FiDownload className="inline mr-1.5" /> CSV
            </button>
            <button onClick={handleExportExcel} className="btn-secondary text-sm">
              <FiDownload className="inline mr-1.5" /> Excel
            </button>
            <Link href="/events/create" className="btn-primary text-sm">
              <FiPlus className="inline mr-1.5" /> New Event
            </Link>
          </div>
        </div>

        <div className="mb-6 card">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search events by name, location..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="form-input pl-10"
            />
          </div>
        </div>

        <div className="card overflow-x-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              {searchTerm ? 'No events match your search' : 'No events yet. Create one to get started!'}
            </div>
          ) : (
            <>
              <table className="table min-w-[800px] w-full">
                <thead>
                  <tr>
                    <th className="w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === events.length && events.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-600"
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
                          className="rounded border-gray-600"
                        />
                      </td>
                      <td className="font-medium">{event.name}</td>
                      <td>{event.venueName || 'N/A'}</td>
                      <td>{new Date(event.startDate).toLocaleDateString()}</td>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${
                            event.isPublished
                              ? 'bg-green-500 bg-opacity-20 text-green-300'
                              : 'bg-gray-500 bg-opacity-20 text-gray-400'
                          }`}
                        >
                          {event.isPublished ? <FiToggleRight className="w-3.5 h-3.5" /> : <FiToggleLeft className="w-3.5 h-3.5" />}
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
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-300">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary disabled:opacity-50"
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

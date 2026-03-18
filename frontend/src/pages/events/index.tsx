import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiEye, FiCopy, FiToggleLeft, FiToggleRight, FiDownload } from 'react-icons/fi';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';

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

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEvents();
  }, [page, searchTerm]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/events', {
        params: {
          page,
          limit: 10,
          search: searchTerm,
        },
      });

      setEvents(response.data.data.events);
      setTotalPages(response.data.data.pagination.pages);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await api.delete(`/api/events/${id}`);
      setEvents(events.filter(e => e.id !== id));
      toast.success('Event deleted successfully');
    } catch (err) {
      console.error('Failed to delete event:', err);
      toast.error('Failed to delete event');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.post(`/api/events/${id}/duplicate`);
      fetchEvents();
      toast.success('Event duplicated successfully');
    } catch (err) {
      console.error('Failed to duplicate event:', err);
      toast.error('Failed to duplicate event');
    }
  };

  const handleExportCSV = async () => {
    try {
      const params: any = { format: 'csv' };
      if (searchTerm) params.search = searchTerm;
      const res = await api.get('/api/events', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'events.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Events exported successfully');
    } catch (err) {
      console.error('Failed to export CSV:', err);
      toast.error('Failed to export CSV');
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/api/events/${id}/publish`, { isPublished: !currentStatus });
      setEvents(events.map(e => e.id === id ? { ...e, isPublished: !currentStatus } : e));
      toast.success(`Event ${!currentStatus ? 'published' : 'unpublished'}`);
    } catch (err) {
      console.error('Failed to toggle publish:', err);
      toast.error('Failed to update publish status');
    }
  };

  return (
    <ProtectedRoute>
      <Head><title>Events | Equestrian Events</title></Head>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">Events</h2>
          <div className="flex gap-3">
            <button onClick={handleExportCSV} className="btn-secondary">
              <FiDownload className="inline mr-2" /> Export CSV
            </button>
            <Link href="/events/create" className="btn-primary">
              <FiPlus className="inline mr-2" /> New Event
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-15 border border-red-400 border-opacity-30 text-red-300 backdrop-blur-sm px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

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

        <div className="card table-container">
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
              <table className="table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Venue</th>
                    <th>Start Date</th>
                    <th>Published</th>
                    <th>Registrations</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className="font-medium">{event.name}</td>
                      <td>{event.venueName || 'N/A'}</td>
                      <td>{new Date(event.startDate).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => handleTogglePublish(event.id, event.isPublished)}
                          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${
                            event.isPublished
                              ? 'bg-green-500 bg-opacity-20 text-green-300'
                              : 'bg-gray-500 bg-opacity-20 text-gray-400'
                          }`}
                          title={event.isPublished ? 'Click to unpublish' : 'Click to publish'}
                        >
                          {event.isPublished ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                          {event.isPublished ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td>
                        <span className="badge badge-success">
                          {event.registrationCount}
                        </span>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <Link href={`/events/${event.id}`} className="text-purple-400 hover:text-purple-300" title="View">
                            <FiEye className="w-4 h-4" />
                          </Link>
                          <Link href={`/events/create?id=${event.id}`} className="text-amber-400 hover:text-amber-300" title="Edit">
                            <FiEdit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDuplicate(event.id)}
                            className="text-blue-400 hover:text-blue-300"
                            title="Duplicate"
                          >
                            <FiCopy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
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

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiEye } from 'react-icons/fi';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  capacity: number;
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
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert('Failed to delete event');
    }
  };

  return (
    <ProtectedRoute>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">Events</h2>
          <Link href="/events/create" className="btn-primary">
            <FiPlus className="inline mr-2" /> New Event
          </Link>
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
                    <th>Location</th>
                    <th>Date</th>
                    <th>Capacity</th>
                    <th>Registrations</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className="font-medium">{event.name}</td>
                      <td>{event.location}</td>
                      <td>{new Date(event.date).toLocaleDateString()}</td>
                      <td>{event.capacity}</td>
                      <td>
                        <span className="badge badge-info">
                          {event.registrationCount}/{event.capacity}
                        </span>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <Link href={`/events/${event.id}`} className="text-blue-600 hover:text-blue-900">
                            <FiEye className="w-4 h-4" title="View" />
                          </Link>
                          <Link href={`/events/${event.id}/edit`} className="text-green-600 hover:text-green-900">
                            <FiEdit className="w-4 h-4" title="Edit" />
                          </Link>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="text-red-600 hover:text-red-900"
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

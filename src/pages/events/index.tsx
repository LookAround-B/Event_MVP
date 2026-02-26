import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiEye } from 'react-icons/fi';

interface Event {
  id: string;
  name: string;
  eventType: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock data for demonstration
    setEvents([
      {
        id: '1',
        name: 'Spring Championship',
        eventType: 'KSEC',
        startDate: '2026-03-15',
        endDate: '2026-03-17',
        isPublished: true,
      },
      {
        id: '2',
        name: 'Regional Qualifier',
        eventType: 'EPL',
        startDate: '2026-04-10',
        endDate: '2026-04-12',
        isPublished: false,
      },
    ]);
    setLoading(false);
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`/api/events/${id}`);
        setEvents(events.filter(e => e.id !== id));
      } catch (error) {
        alert('Failed to delete event');
      }
    }
  };

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Events</h2>
        <Link href="/events/create" className="btn-primary">
          <FiPlus className="inline mr-2" /> New Event
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6 card">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="card table-container">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No events found</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id}>
                  <td className="font-medium">{event.name}</td>
                  <td>{event.eventType}</td>
                  <td>{new Date(event.startDate).toLocaleDateString()}</td>
                  <td>{new Date(event.endDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${event.isPublished ? 'badge-success' : 'badge-warning'}`}>
                      {event.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <Link href={`/events/${event.id}`} className="text-blue-600 hover:text-blue-900">
                        <FiEye className="w-4 h-4" />
                      </Link>
                      <Link href={`/events/${event.id}/edit`} className="text-green-600 hover:text-green-900">
                        <FiEdit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

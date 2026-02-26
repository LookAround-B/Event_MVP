import React, { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

export default function CreateEvent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    eventType: 'KSEC',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    venueName: '',
    venueAddress: '',
    termsAndConditions: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      await axios.post('/api/events/create', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push('/events');
    } catch (error) {
      alert('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/events" className="text-indigo-600 hover:text-indigo-900">
          <FiArrowLeft className="w-6 h-6" />
        </Link>
        <h2 className="text-3xl font-bold text-gray-900">Create Event</h2>
      </div>

      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="form-group col-span-2">
              <label className="form-label">Event Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Spring Championship"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Event Type</label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                className="form-input"
              >
                <option value="KSEC">KSEC</option>
                <option value="EPL">EPL</option>
                <option value="EIRS">EIRS Show</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-input"
                placeholder="Event description"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Venue Name</label>
              <input
                type="text"
                name="venueName"
                value={formData.venueName}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Delhi Riding Club"
              />
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">Venue Address</label>
              <textarea
                name="venueAddress"
                value={formData.venueAddress}
                onChange={handleChange}
                className="form-input"
                placeholder="Complete venue address"
                rows={3}
              />
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">Terms and Conditions</label>
              <textarea
                name="termsAndConditions"
                value={formData.termsAndConditions}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter T&C for this event"
                rows={4}
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create Event'}
            </button>
            <Link href="/events" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

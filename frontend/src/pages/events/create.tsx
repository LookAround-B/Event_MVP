import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { FiArrowLeft, FiMapPin } from 'react-icons/fi';

export default function CreateEventPage() {
  const router = useRouter();
  const { id } = router.query;
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    eventType: 'KSEC',
    name: '',
    description: '',
    startDate: '',
    startTime: '06:00',
    endDate: '',
    endTime: '18:00',
    venueName: '',
    venueAddress: '',
    venueLat: '',
    venueLng: '',
    termsAndConditions: '',
    categoryIds: [] as string[],
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    if (isEdit && id) {
      fetchEvent();
    }
  }, [id, isEdit]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/settings/event-categories');
      setCategories(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/api/events/${id}`);
      const event = response.data.data;
      setFormData({
        eventType: event.eventType || 'KSEC',
        name: event.name,
        description: event.description || '',
        startDate: event.startDate?.split('T')[0] || '',
        startTime: event.startTime || '06:00',
        endDate: event.endDate?.split('T')[0] || '',
        endTime: event.endTime || '18:00',
        venueName: event.venueName || '',
        venueAddress: event.venueAddress || '',
        venueLat: event.venueLat?.toString() || '',
        venueLng: event.venueLng?.toString() || '',
        termsAndConditions: event.termsAndConditions || '',
        categoryIds: event.categories?.map((c: any) => c.id) || [],
      });
    } catch (err) {
      console.error('Failed to fetch event:', err);
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validation
    if (!formData.eventType || !formData.name) {
      setError('Event type and name are required');
      setSubmitting(false);
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('Start date and end date are required');
      setSubmitting(false);
      return;
    }

    try {
      if (isEdit && id) {
        await api.put(`/api/events/${id}`, formData);
        alert('Event updated successfully!');
      } else {
        await api.post('/api/events', formData);
        alert('Event created successfully!');
      }
      router.push('/events');
    } catch (err: any) {
      console.error('Failed to save event:', err);
      setError(err.response?.data?.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-300 mt-2">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/events" className="text-purple-400 hover:text-purple-300 flex items-center gap-2">
            <FiArrowLeft /> Back to Events
          </Link>
          <h2 className="text-3xl font-bold text-white">
            {isEdit ? 'Edit Event' : 'Create New Event'}
          </h2>
        </div>

        <div className="space-y-8">
          {/* SECTION 1: Event Information */}
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-6">Event Information</h3>

            {error && (
              <div className="bg-red-500 bg-opacity-20 border border-red-400 text-red-200 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Type (Mandatory) */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Event Type <span className="text-red-400">*</span>
                </label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="KSEC" className="bg-slate-800 text-white">KSEC</option>
                  <option value="EPL" className="bg-slate-800 text-white">EPL</option>
                  <option value="EIRS Show" className="bg-slate-800 text-white">EIRS Show</option>
                </select>
              </div>

              {/* Event Name (Mandatory) */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Event Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Spring Championship 2026"
                  className="form-input"
                />
              </div>

              {/* Description (Mandatory) */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Event details and requirements..."
                  rows={4}
                  className="form-input"
                />
              </div>

              {/* Start Date & Time (Mandatory) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Start Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Start Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              {/* End Date & Time (Mandatory) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    End Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    End Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              {/* Venue Section */}
              <div className="border-t border-white border-opacity-10 pt-6">
                <h4 className="text-md font-semibold text-white mb-4">Event Venue</h4>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    name="venueName"
                    value={formData.venueName}
                    onChange={handleChange}
                    placeholder="e.g., County Fairgrounds"
                    className="form-input"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <FiMapPin /> Venue Address
                  </label>
                  <input
                    type="text"
                    name="venueAddress"
                    value={formData.venueAddress}
                    onChange={handleChange}
                    placeholder="Full address for venue"
                    className="form-input"
                  />
                  <p className="text-xs text-gray-400 mt-1">Note: Google Maps integration coming soon</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Latitude</label>
                    <input
                      type="number"
                      name="venueLat"
                      value={formData.venueLat}
                      onChange={handleChange}
                      placeholder="e.g., 40.7128"
                      step="0.0001"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Longitude</label>
                    <input
                      type="number"
                      name="venueLng"
                      value={formData.venueLng}
                      onChange={handleChange}
                      placeholder="e.g., -74.0060"
                      step="0.0001"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Terms & Conditions Section */}
              <div className="border-t border-white border-opacity-10 pt-6">
                <h4 className="text-md font-semibold text-white mb-4">Terms & Conditions</h4>
                <textarea
                  name="termsAndConditions"
                  value={formData.termsAndConditions}
                  onChange={handleChange}
                  placeholder="Enter event terms and conditions (optional)"
                  rows={6}
                  className="form-input"
                />
                <p className="text-xs text-gray-400 mt-1">Note: Rich-text editor coming soon</p>
              </div>

              {/* Event Categories Section */}
              {categories.length > 0 && (
                <div className="border-t border-white border-opacity-10 pt-6">
                  <h4 className="text-md font-semibold text-white mb-4">Event Categories</h4>
                  <div className="space-y-3">
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
                        <input
                          type="checkbox"
                          checked={formData.categoryIds.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id)}
                          className="w-4 h-4 border border-white border-opacity-20 rounded"
                        />
                        <span className="text-sm">
                          {category.name} - ₹{category.price}
                          {category.cgst > 0 && ` (CGST: ${category.cgst}%)`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6 border-t border-white border-opacity-10">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
                </button>
                <Link
                  href="/events"
                  className="btn-secondary"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

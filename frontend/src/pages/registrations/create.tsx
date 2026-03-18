import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { FiArrowLeft } from 'react-icons/fi';

interface Event {
  id: string;
  name: string;
}

interface Rider {
  id: string;
  firstName: string;
  lastName: string;
}

interface Horse {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  price: number;
}

export default function CreateRegistration() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    eventId: '',
    riderId: '',
    horseId: '',
    categoryId: '',
  });

  const [events, setEvents] = useState<Event[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      const [eventsRes, ridersRes, horsesRes] = await Promise.all([
        api.get('/api/events?limit=100'),
        api.get('/api/riders?limit=100'),
        api.get('/api/horses?limit=100'),
      ]);

      setEvents(eventsRes.data.data.events || []);
      setRiders(ridersRes.data.data.riders || []);
      setHorses(horsesRes.data.data.horses || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load dropdown data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleEventChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = e.target.value;
    setFormData(prev => ({
      ...prev,
      eventId,
      categoryId: '',
    }));

    if (eventId) {
      try {
        const response = await api.get(`/api/events/${eventId}`);
        const event = response.data.data;
        setCategories(event.categories || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setCategories([]);
      }
    } else {
      setCategories([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.eventId || !formData.riderId || !formData.horseId || !formData.categoryId) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    try {
      await api.post('/api/registrations', formData);
      alert('Registration created successfully!');
      router.push('/registrations');
    } catch (err: any) {
      console.error('Failed to create registration:', err);
      setError(err.response?.data?.message || 'Failed to create registration');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-gray-300 mt-4">Loading...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-8">
            <Link href="/registrations" className="text-purple-400 hover:text-purple-300 flex items-center gap-2">
              <FiArrowLeft /> Back to Registrations
            </Link>
          </div>

          <div className="card overflow-hidden">
            {/* Title Section */}
            <div className="px-8 py-6 border-b border-white border-opacity-10">
              <h1 className="text-3xl font-bold text-white">Register for Event</h1>
              <p className="text-gray-300 mt-2">Create a new event registration</p>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {error && (
                <div className="bg-red-900 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg p-4">
                  <p className="text-red-300 font-medium">{error}</p>
                </div>
              )}

              {/* Event - Mandatory */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Event <span className="text-red-400">*</span>
                </label>
                <select
                  name="eventId"
                  value={formData.eventId}
                  onChange={handleEventChange}
                  required
                  className="form-input"
                >
                  <option value="">Select an event</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id} className="bg-slate-800 text-white">
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rider - Mandatory */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Rider <span className="text-red-400">*</span>
                </label>
                <select
                  name="riderId"
                  value={formData.riderId}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="">Select a rider</option>
                  {riders.map(rider => (
                    <option key={rider.id} value={rider.id} className="bg-slate-800 text-white">
                      {rider.firstName} {rider.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Horse - Mandatory */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Horse <span className="text-red-400">*</span>
                </label>
                <select
                  name="horseId"
                  value={formData.horseId}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="">Select a horse</option>
                  {horses.map(horse => (
                    <option key={horse.id} value={horse.id} className="bg-slate-800 text-white">
                      {horse.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category - Mandatory */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  disabled={!formData.eventId}
                  className="form-input"
                >
                  <option value="">
                    {formData.eventId ? 'Select a category' : 'Select an event first'}
                  </option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id} className="bg-slate-800 text-white">
                      {category.name} - ₹{category.price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-6 border-t border-white border-opacity-10">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary"
                >
                  {loading ? 'Creating...' : 'Create Registration'}
                </button>
                <Link
                  href="/registrations"
                  className="flex-1 text-center btn-secondary"
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

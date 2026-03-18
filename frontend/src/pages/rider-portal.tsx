import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiCalendar, FiTrendingUp, FiAward, FiChevronRight, FiBox } from 'react-icons/fi';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';

interface DashboardWidgets {
  horseCount: number;
  eventsCount: number;
  eventsParticipated: number;
  registeredEvents: number;
}

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  registrationCount?: number;
}

interface Registration {
  id: string;
  event: Event;
  paymentStatus: string;
  totalAmount: number;
}

interface Horse {
  id: string;
  name: string;
  color: string;
  gender: string;
}

export default function RiderPortal() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'myEvents' | 'myHorses' | 'events' | 'featured'>('dashboard');
  const [widgets, setWidgets] = useState<DashboardWidgets>({
    horseCount: 0,
    eventsCount: 0,
    eventsParticipated: 0,
    registeredEvents: 0,
  });
  const [myEvents, setMyEvents] = useState<Registration[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [termsConditions, setTermsConditions] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    } else if (activeTab === 'myEvents') {
      fetchMyEvents();
    } else if (activeTab === 'myHorses') {
      fetchMyHorses();
    } else if (activeTab === 'events') {
      fetchAllEvents();
    } else if (activeTab === 'featured') {
      fetchFeaturedEvents();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [horsesRes, registrationsRes, eventsRes] = await Promise.all([
        api.get('/api/horses?limit=1').catch(() => ({ data: { data: { pagination: { total: 0 } } } })),
        api.get('/api/registrations?limit=1').catch(() => ({ data: { data: { pagination: { total: 0 } } } })),
        api.get('/api/events?limit=1').catch(() => ({ data: { data: { pagination: { total: 0 } } } })),
      ]);

      setWidgets({
        horseCount: horsesRes.data.data?.pagination?.total || 0,
        registeredEvents: registrationsRes.data.data?.pagination?.total || 0,
        eventsParticipated: registrationsRes.data.data?.pagination?.total || 0, // Could be filtered by userId
        eventsCount: eventsRes.data.data?.pagination?.total || 0,
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/registrations?limit=10');
      setMyEvents(response.data.data?.registrations || []);
    } catch (err) {
      console.error('Failed to fetch my events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyHorses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/horses?limit=10');
      setHorses(response.data.data?.horses || response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch horses:', err);
      setError('Failed to load horses');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/events?limit=20');
      setAllEvents(response.data.data?.events || response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedEvents = async () => {
    try {
      setLoading(true);
      const [eventsRes, settingsRes] = await Promise.all([
        api.get('/api/events?limit=10'),
        api.get('/api/settings').catch(() => ({ data: { data: [] } })),
      ]);
      const events = eventsRes.data.data?.events || eventsRes.data.data || [];
      // Show published upcoming events as featured
      const now = new Date();
      const upcoming = events.filter((e: Event) => new Date(e.startDate) >= now);
      setFeaturedEvents(upcoming.length > 0 ? upcoming : events.slice(0, 5));

      // Get T&C from settings
      const settings = settingsRes.data.data || [];
      const tc = settings.find((s: any) => s.key === 'terms_and_conditions');
      setTermsConditions(tc?.value || '');
    } catch (err) {
      console.error('Failed to fetch featured events:', err);
      setError('Failed to load featured events');
    } finally {
      setLoading(false);
    }
  };

  const Widget = ({ icon: Icon, title, value, color }: any) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-4 rounded-lg ${color}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );

  const TabButton = ({ name, label }: { name: typeof activeTab; label: string }) => (
    <button
      onClick={() => setActiveTab(name)}
      className={`px-4 py-2 font-medium rounded-lg transition ${
        activeTab === name
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rider Portal</h1>
          <p className="text-gray-600 mt-1">Manage your events and horses</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <TabButton name="dashboard" label="📊 Dashboard" />
          <TabButton name="myEvents" label="📅 My Events" />
          <TabButton name="myHorses" label="🐴 My Horses" />
          <TabButton name="events" label="🎪 Browse Events" />
          <TabButton name="featured" label="⭐ Featured" />
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Widget
                icon={FiBox}
                title="Total Horses"
                value={widgets.horseCount}
                color="bg-amber-500"
              />
              <Widget
                icon={FiCalendar}
                title="Events on Platform"
                value={widgets.eventsCount}
                color="bg-blue-500"
              />
              <Widget
                icon={FiTrendingUp}
                title="Events Participated"
                value={widgets.eventsParticipated}
                color="bg-green-500"
              />
              <Widget
                icon={FiAward}
                title="Registered Events"
                value={widgets.registeredEvents}
                color="bg-purple-500"
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/horses/create"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <FiPlus className="text-blue-600 text-xl" />
                    <div>
                      <p className="font-semibold text-gray-900">Add New Horse</p>
                      <p className="text-sm text-gray-600">Register your horse</p>
                    </div>
                  </div>
                  <FiChevronRight className="text-gray-400" />
                </Link>

                <Link
                  href="/events"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <FiCalendar className="text-green-600 text-xl" />
                    <div>
                      <p className="font-semibold text-gray-900">Browse Events</p>
                      <p className="text-sm text-gray-600">Find upcoming events</p>
                    </div>
                  </div>
                  <FiChevronRight className="text-gray-400" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* My Events Tab */}
        {activeTab === 'myEvents' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">My Event Registrations</h2>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : myEvents.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
                No event registrations yet. <Link href="/events" className="font-semibold underline">Browse events</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myEvents.map(reg => (
                  <div key={reg.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{reg.event?.name}</p>
                      <p className="text-sm text-gray-600">
                        {reg.event?.startDate && new Date(reg.event.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        reg.paymentStatus === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {reg.paymentStatus}
                      </span>
                      <p className="font-semibold text-gray-900">₹{reg.totalAmount}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Horses Tab */}
        {activeTab === 'myHorses' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">My Horses</h2>
              <Link
                href="/horses/create"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FiPlus /> Add Horse
              </Link>
            </div>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : horses.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
                No horses registered yet. Add your first horse to get started!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {horses.map(horse => (
                  <div key={horse.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{horse.name}</p>
                        <p className="text-sm text-gray-600">Color: {horse.color}</p>
                        <p className="text-sm text-gray-600">Gender: {horse.gender}</p>
                      </div>
                      <FiBox className="text-amber-600 text-3xl" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Browse All Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">All Available Events</h2>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : allEvents.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded">
                No events available at this time.
              </div>
            ) : (
              <div className="space-y-3">
                {allEvents.map(event => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block bg-white rounded-lg shadow p-4 hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{event.name}</p>
                        <p className="text-sm text-gray-600">
                          {event.startDate && new Date(event.startDate).toLocaleDateString()} - {event.endDate && new Date(event.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        View Details
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Featured Events Tab */}
        {activeTab === 'featured' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Featured Events</h2>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : featuredEvents.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 text-gray-800 px-4 py-6 rounded text-center">
                <p>No featured events at this time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {featuredEvents.map(event => (
                  <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                      <h3 className="text-xl font-bold text-white">{event.name}</h3>
                      <p className="text-blue-100 text-sm mt-1">
                        {new Date(event.startDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        {event.endDate && ` — ${new Date(event.endDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
                      </p>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {event.registrationCount !== undefined && (
                            <span className="flex items-center gap-1">
                              <FiTrendingUp className="text-green-500" /> {event.registrationCount} registrations
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/events/${event.id}`}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                        >
                          View & Register
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {termsConditions && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Terms & Conditions</h3>
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {termsConditions}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

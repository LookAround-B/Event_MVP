import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { Plus, Calendar, TrendingUp, Award, ChevronRight, Box, Clock } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { KPICard } from '@/components/dashboard/KPICard';
import { KPIGrid } from '@/components/dashboard/KPIGrid';

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

  const TabButton = ({ name, label }: { name: typeof activeTab; label: string }) => (
    <button
      onClick={() => setActiveTab(name)}
      className={`px-4 sm:px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
        activeTab === name
          ? 'bg-primary text-primary-foreground shadow-lg'
          : 'text-muted-foreground hover:text-on-surface'
      }`}
    >
      {label}
    </button>
  );

  return (
    <ProtectedRoute>
      <Head><title>Rider Portal | Equestrian Events</title></Head>
      <div className="animate-fade-in max-w-[1600px] mx-auto">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl lg:text-5xl">
            Rider <span className="gradient-text">Portal</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Manage your events and horses</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4 animate-slide-up-1">
          <div className="flex gap-1 bg-surface-container rounded-xl p-1 w-fit border border-border/30 shadow-inner overflow-x-auto">
            <TabButton name="dashboard" label="📊 Dashboard" />
            <TabButton name="myEvents" label="📅 My Events" />
            <TabButton name="myHorses" label="🐴 My Horses" />
            <TabButton name="events" label="🎪 Browse Events" />
            <TabButton name="featured" label="⭐ Featured" />
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <KPIGrid>
              <KPICard title="Total Horses" value={widgets.horseCount} icon={Box} variant="primary" subText="Your stable" className="animate-slide-up-1" />
              <KPICard title="Events on Platform" value={widgets.eventsCount} icon={Calendar} variant="outline" subText="Available now" className="animate-slide-up-2" />
              <KPICard title="Participated" value={widgets.eventsParticipated} icon={TrendingUp} variant="outline" subText="Your history" className="animate-slide-up-3" />
              <KPICard title="Registered" value={widgets.registeredEvents} icon={Award} variant="secondary" subText="Current season" className="animate-slide-up-4" />
            </KPIGrid>

            <div className="bento-card p-6 animate-slide-up-3">
              <h2 className="text-lg font-bold text-on-surface mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/horses/create"
                  className="flex items-center justify-between p-4 rounded-xl border border-border/30 hover:bg-surface-container/50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-sm">Add New Horse</p>
                      <p className="text-xs text-muted-foreground">Register your horse</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>

                <Link
                  href="/events"
                  className="flex items-center justify-between p-4 rounded-xl border border-border/30 hover:bg-surface-container/50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Calendar className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-sm">Browse Events</p>
                      <p className="text-xs text-muted-foreground">Find upcoming events</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* My Events Tab */}
        {activeTab === 'myEvents' && (
          <div className="space-y-4 animate-slide-up-2">
            <div className="bento-card overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/40" />
              <div className="p-5">
                <h2 className="text-lg font-bold text-on-surface mb-4">My Event Registrations</h2>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'hsl(var(--primary))' }} />
                </div>
              ) : myEvents.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground italic">
                  No event registrations yet. <Link href="/events" className="text-primary font-semibold">Browse events</Link>
                </div>
              ) : (
                <div className="space-y-2 p-4 pt-0">
                  {myEvents.map(reg => (
                    <div key={reg.id} className="flex justify-between items-center p-4 rounded-xl border border-border/20 hover:bg-surface-container/30 transition-all group">
                      <div>
                        <p className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">{reg.event?.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Clock className="w-3 h-3 text-secondary" />
                          {reg.event?.startDate && new Date(reg.event.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter border ${
                          reg.paymentStatus === 'PAID'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-secondary/10 text-secondary border-secondary/20'
                        }`}>
                          {reg.paymentStatus}
                        </span>
                        <p className="font-bold text-on-surface text-sm">₹{reg.totalAmount?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Horses Tab */}
        {activeTab === 'myHorses' && (
          <div className="space-y-4 animate-slide-up-2">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-on-surface">My Horses</h2>
              <Link
                href="/horses/create"
                className="flex items-center gap-2 px-4 py-2.5 btn-cta rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add Horse
              </Link>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'hsl(var(--primary))' }} />
              </div>
            ) : horses.length === 0 ? (
              <div className="bento-card p-12 text-center text-sm text-muted-foreground italic">
                No horses registered yet. Add your first horse to get started!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {horses.map(horse => (
                  <Link key={horse.id} href={`/horses/${horse.id}`} className="bento-card p-4 hover:border-primary/25 transition-colors group">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-on-surface group-hover:text-primary transition-colors">{horse.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">Color: {horse.color}</p>
                        <p className="text-xs text-muted-foreground">Gender: {horse.gender}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Box className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Browse All Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-4 animate-slide-up-2">
            <h2 className="text-lg font-bold text-on-surface">All Available Events</h2>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'hsl(var(--primary))' }} />
              </div>
            ) : allEvents.length === 0 ? (
              <div className="bento-card p-12 text-center text-sm text-muted-foreground italic">
                No events available at this time.
              </div>
            ) : (
              <div className="space-y-3">
                {allEvents.map(event => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block bento-card p-4 hover:border-primary/25 transition-colors group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-on-surface group-hover:text-primary transition-colors">{event.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Clock className="w-3 h-3 text-secondary" />
                          {event.startDate && new Date(event.startDate).toLocaleDateString()} - {event.endDate && new Date(event.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1.5 btn-cta rounded-lg text-xs font-bold">
                        View Details
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Featured Events Tab */}
        {activeTab === 'featured' && (
          <div className="space-y-6 animate-slide-up-2">
            <h2 className="text-lg font-bold text-on-surface">Featured Events</h2>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'hsl(var(--primary))' }} />
              </div>
            ) : featuredEvents.length === 0 ? (
              <div className="bento-card p-12 text-center text-sm text-muted-foreground italic">
                No featured events at this time.
              </div>
            ) : (
              <div className="space-y-4">
                {featuredEvents.map(event => (
                  <div key={event.id} className="bento-card overflow-hidden group hover:border-primary/25 transition-colors">
                    <div className="bg-gradient-to-r from-primary/20 via-secondary/15 to-primary/20 px-6 py-4 border-b border-border/10">
                      <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">{event.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-secondary" />
                        {new Date(event.startDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        {event.endDate && ` — ${new Date(event.endDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
                      </p>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {event.registrationCount !== undefined && (
                            <span className="flex items-center gap-1.5 text-xs">
                              <TrendingUp className="w-3.5 h-3.5 text-primary" /> {event.registrationCount} registrations
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/events/${event.id}`}
                          className="px-4 py-2 btn-cta rounded-xl text-sm font-bold transition-all active:scale-95"
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
              <div className="bento-card p-6">
                <h3 className="text-lg font-bold text-on-surface mb-3">Terms & Conditions</h3>
                <div className="prose prose-sm max-w-none text-on-surface-variant whitespace-pre-wrap text-xs leading-relaxed">
                  {termsConditions}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm mt-4"
            style={{
              background: 'hsl(var(--error) / 0.1)',
              border: '1px solid hsl(var(--error) / 0.3)',
              color: 'hsl(var(--error))',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

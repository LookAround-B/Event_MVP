import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { ArrowLeft, ClipboardCheck, Check, X } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface Event { id: string; name: string; }
interface Rider { id: string; firstName: string; lastName: string; }
interface Horse { id: string; name: string; }
interface Category { id: string; name: string; price: number; }

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

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      const [eventsRes, ridersRes, horsesRes] = await Promise.all([
        api.get('/api/events?limit=100'),
        api.get('/api/riders?limit=100'),
        api.get('/api/horses?limit=100'),
      ]);
      const eventsData = eventsRes.data?.data?.events;
      const ridersData = ridersRes.data?.data?.riders;
      const horsesData = horsesRes.data?.data?.horses;
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setRiders(Array.isArray(ridersData) ? ridersData : []);
      setHorses(Array.isArray(horsesData) ? horsesData : []);
    } catch (err: any) {
      const message = err.response?.status === 401
        ? 'Not authenticated. Please log in first.'
        : 'Failed to load dropdown data';
      setError(message);
      setEvents([]); setRiders([]); setHorses([]);
    } finally {
      setDataLoading(false);
    }
  };

  const handleEventChange = async (eventId: string) => {
    setFormData(prev => ({ ...prev, eventId, categoryId: '' }));
    if (eventId) {
      try {
        const response = await api.get(`/api/events/${eventId}`);
        const event = response.data.data;
        setCategories(event.categories || []);
      } catch { setCategories([]); }
    } else {
      setCategories([]);
    }
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
      toast.success('Registration created successfully!');
      router.push('/registrations');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create registration');
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 placeholder:text-muted-foreground appearance-none";

  return (
    <ProtectedRoute>
      <Head><title>New Registration | Equestrian Events</title></Head>
      <div className="animate-fade-in max-w-[1600px] mx-auto">

        {/* Back link */}
        <Link href="/registrations" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-on-surface transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Registrations
        </Link>

        {/* Page title */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl lg:text-5xl">
            New <span className="gradient-text">Registration</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Register a rider and horse for an upcoming championship event.
          </p>
        </div>

        {/* Form Card */}
        <div className="bento-card overflow-hidden max-w-2xl animate-slide-up-2">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-base font-bold text-on-surface">Register for Event</h2>
            </div>
          </div>

          {dataLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-surface-container/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Event */}
              <div>
                <label className="label-tech block mb-1.5">Event <span className="text-destructive">*</span></label>
                <Select value={formData.eventId || '__none__'} onValueChange={v => handleEventChange(v === '__none__' ? '' : v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select an event" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select an event</SelectItem>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rider */}
              <div>
                <label className="label-tech block mb-1.5">Rider <span className="text-destructive">*</span></label>
                <Select value={formData.riderId || '__none__'} onValueChange={v => setFormData(prev => ({ ...prev, riderId: v === '__none__' ? '' : v }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select a rider" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select a rider</SelectItem>
                    {riders.map(rider => (
                      <SelectItem key={rider.id} value={rider.id}>{rider.firstName} {rider.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Horse */}
              <div>
                <label className="label-tech block mb-1.5">Horse <span className="text-destructive">*</span></label>
                <Select value={formData.horseId || '__none__'} onValueChange={v => setFormData(prev => ({ ...prev, horseId: v === '__none__' ? '' : v }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select a horse" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select a horse</SelectItem>
                    {horses.map(horse => (
                      <SelectItem key={horse.id} value={horse.id}>{horse.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div>
                <label className="label-tech block mb-1.5">Category <span className="text-destructive">*</span></label>
                <Select value={formData.categoryId || '__none__'} onValueChange={v => setFormData(prev => ({ ...prev, categoryId: v === '__none__' ? '' : v }))} disabled={!formData.eventId}>
                  <SelectTrigger className="w-full"><SelectValue placeholder={formData.eventId ? 'Select a category' : 'Select an event first'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{formData.eventId ? 'Select a category' : 'Select an event first'}</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>{category.name} - ₹{category.price}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                <button type="submit" disabled={loading} className="flex-1 py-2.5 btn-cta rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> {loading ? 'Creating...' : 'Create Registration'}
                </button>
                <Link href="/registrations" className="flex-1 py-2.5 bg-surface-container rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/50 text-center">
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

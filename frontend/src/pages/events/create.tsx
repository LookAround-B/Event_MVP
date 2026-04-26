import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import VenueMapPicker from '@/components/VenueMapPicker';
import { ArrowLeft, MapPin, Upload, Plus, Trash2, Calendar, Clock, FileText, Tag, Save } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DatePicker } from '@/components/DatePicker';
import { PageSkeleton } from '@/components/PageSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';

// Dynamic import — TipTap uses browser APIs (document/window) for editor DOM
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border border-border/30 min-h-[260px] flex items-center justify-center text-muted-foreground text-sm bg-surface-container/30">
      <div className="w-full space-y-3 p-4">
        <Skeleton className="h-8 w-40 bg-border/20" />
        <Skeleton className="h-24 w-full rounded-xl bg-border/15" />
        <Skeleton className="h-24 w-full rounded-xl bg-border/15" />
      </div>
    </div>
  ),
});

interface CategorySelection {
  categoryId: string;
  date: string;
}

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
    startEndTime: '18:00',
    endDate: '',
    endStartTime: '06:00',
    endTime: '18:00',
    venueName: '',
    venueAddress: '',
    venueLat: '',
    venueLng: '',
    termsAndConditions: '',
  });

  const [selectedCategories, setSelectedCategories] = useState<CategorySelection[]>([]);

  const [fileUrl, setFileUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const handleEditorChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, termsAndConditions: value }));
  }, []);

  useEffect(() => {
    Promise.all([
      fetchCategories(),
      ...(isEdit && id ? [fetchEvent()] : []),
    ]);
  }, [id, isEdit]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/settings/event-categories');
      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load categories');
    }
  };

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/api/events/${id}`);
      if (!response.data.success) {
        toast.error(response.data.message || 'Failed to load event');
        return;
      }
      const event = response.data.data;
      setFormData({
        eventType: event.eventType || 'KSEC',
        name: event.name,
        description: event.description || '',
        startDate: event.startDate?.split('T')[0] || '',
        startTime: event.startTime || '06:00',
        startEndTime: event.startEndTime || '18:00',
        endDate: event.endDate?.split('T')[0] || '',
        endStartTime: event.endStartTime || '06:00',
        endTime: event.endTime || '18:00',
        venueName: event.venueName || '',
        venueAddress: event.venueAddress || '',
        venueLat: event.venueLat?.toString() || '',
        venueLng: event.venueLng?.toString() || '',
        termsAndConditions: event.termsAndConditions || '',
      });
      setFileUrl(event.fileUrl || '');
      if (event.categories?.length > 0) {
        setSelectedCategories(
          event.categories.map((c: any) => ({ categoryId: c.id, date: '' }))
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/api/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setFileUrl(res.data.data.fileUrl);
        toast.success('File uploaded successfully');
      } else {
        toast.error(res.data.message || 'File upload failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAddCategory = () => {
    setSelectedCategories(prev => [...prev, { categoryId: '', date: '' }]);
  };

  const handleRemoveCategory = (idx: number) => {
    setSelectedCategories(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCategoryChange = (idx: number, field: keyof CategorySelection, value: string) => {
    setSelectedCategories(prev =>
      prev.map((cat, i) => i === idx ? { ...cat, [field]: value } : cat)
    );
  };

  // Get list of already-selected category IDs to prevent duplicates
  const usedCategoryIds = selectedCategories.map(c => c.categoryId).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Validation
    if (!formData.eventType || !formData.name.trim()) {
      toast.error('Event type and name are required');
      setSubmitting(false);
      return;
    }

    if (formData.name.trim().length < 3) {
      toast.error('Event name must be at least 3 characters');
      setSubmitting(false);
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error('Start date and end date are required');
      setSubmitting(false);
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date must be on or after the start date');
      setSubmitting(false);
      return;
    }

    if (!formData.startTime || !formData.startEndTime) {
      toast.error('Start date requires both start time and end time');
      setSubmitting(false);
      return;
    }

    if (!formData.endStartTime || !formData.endTime) {
      toast.error('End date requires both start time and end time');
      setSubmitting(false);
      return;
    }

    // Validate category selections
    const validCategories = selectedCategories.filter(c => c.categoryId);
    const categoryIds = validCategories.map(c => c.categoryId);
    if (new Set(categoryIds).size !== categoryIds.length) {
      toast.error('Duplicate categories selected');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        fileUrl,
        categoryIds,
      };

      if (isEdit && id) {
        const res = await api.put(`/api/events/${id}`, payload);
        if (res.data && !res.data.success) {
          toast.error(res.data.message || 'Failed to update event');
          setSubmitting(false);
          return;
        }
        toast.success('Event updated successfully!');
      } else {
        const res = await api.post('/api/events', payload);
        if (res.data && !res.data.success) {
          toast.error(res.data.message || 'Failed to create event');
          setSubmitting(false);
          return;
        }
        toast.success('Event created successfully!');
      }
      router.push('/events');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <PageSkeleton variant="form" />
      </ProtectedRoute>
    );
  }

  return (
    <BoneyardSkeleton name="events-create-page" loading={false}>
    <ProtectedRoute allowedRoles={['admin']}>
      <Head><title>{isEdit ? 'Edit Event' : 'Create Event'} | Equestrian Events</title></Head>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <Link href="/events" className="transition-colors flex items-center gap-2 text-sm">
            <ArrowLeft /> Back to Events
          </Link>
          <h2 className="text-2xl sm:text-2xl font-bold">
            {isEdit ? 'Edit Event' : 'Create New Event'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: Event Information */}
          <div className="bento-card">
            <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <FileText className="text-purple-400" /> Event Information
            </h3>

            <div className="space-y-5">
              {/* Event Type */}
              <div>
                <label className="form-label">
                  Event Type <span className="text-destructive">*</span>
                </label>
                <Select value={formData.eventType} onValueChange={(v) => setFormData(prev => ({ ...prev, eventType: v }))}>
                  <SelectTrigger className="bg-surface-container border-border/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KSEC">KSEC</SelectItem>
                    <SelectItem value="EPL">EPL</SelectItem>
                    <SelectItem value="EIRS Show">EIRS Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Event Name */}
              <div>
                <label className="form-label">
                  Event Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  minLength={3}
                  maxLength={200}
                  placeholder="e.g., Spring Championship 2026"
                  className="input"
                />
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="form-label">
                  Description <span className="text-muted-foreground text-xs">(optional)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Event details and requirements..."
                  rows={3}
                  maxLength={2000}
                  className="input"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="form-label">
                  Event File / Banner <span className="text-muted-foreground text-xs">(optional)</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-surface-container/60 text-on-surface rounded-lg hover:bg-surface-bright cursor-pointer transition text-sm">
                    <Upload />
                    {uploading ? 'Uploading...' : 'Choose File'}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  {fileUrl && (
                    <span className="text-sm text-green-300">
                      File uploaded: {fileUrl.split('/').pop()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Accepted: Images (JPG, PNG, GIF) and PDF. Max 10MB.</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: Schedule */}
          <div className="bento-card">
            <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <Calendar className="text-purple-400" /> Schedule
            </h3>

            <div className="space-y-6">
              {/* Start Date Row */}
              <div>
                <label className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                  <Clock className="text-emerald-400 w-4 h-4" /> Start Date <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Date</label>
                    <DatePicker
                      value={formData.startDate}
                      onChange={(v) => setFormData(prev => ({ ...prev, startDate: v }))}
                      placeholder="Select start date"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Start Time</label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      required
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">End Time</label>
                    <input
                      type="time"
                      name="startEndTime"
                      value={formData.startEndTime}
                      onChange={handleChange}
                      required
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* End Date Row */}
              <div>
                <label className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                  <Clock className="text-destructive w-4 h-4" /> End Date <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Date</label>
                    <DatePicker
                      value={formData.endDate}
                      onChange={(v) => setFormData(prev => ({ ...prev, endDate: v }))}
                      placeholder="Select end date"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Start Time</label>
                    <input
                      type="time"
                      name="endStartTime"
                      value={formData.endStartTime}
                      onChange={handleChange}
                      required
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">End Time</label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      required
                      className="input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Venue */}
          <div className="bento-card">
            <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <MapPin className="text-purple-400" /> Event Venue
            </h3>

            <div className="space-y-4">
              <div>
                <label className="form-label">Venue Name</label>
                <input
                  type="text"
                  name="venueName"
                  value={formData.venueName}
                  onChange={handleChange}
                  placeholder="e.g., County Fairgrounds"
                  maxLength={200}
                  className="input"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-on-surface mb-2 flex items-center gap-2">
                  Venue Address
                </label>
                <input
                  type="text"
                  name="venueAddress"
                  value={formData.venueAddress}
                  onChange={handleChange}
                  placeholder="Full address for venue"
                  maxLength={500}
                  className="input"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-on-surface mb-2 flex items-center gap-2">
                  <MapPin /> Venue Location
                </label>
                <VenueMapPicker
                  lat={formData.venueLat}
                  lng={formData.venueLng}
                  onLocationChange={(lat, lng) =>
                    setFormData(prev => ({ ...prev, venueLat: lat, venueLng: lng }))
                  }
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Terms & Conditions (Rich Text Editor) */}
          <div className="bento-card">
            <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <FileText className="text-purple-400" /> Terms & Conditions
            </h3>
            <RichTextEditor
              value={formData.termsAndConditions}
              onChange={handleEditorChange}
              placeholder="Enter event terms and conditions..."
            />
            <p className="text-xs text-muted-foreground mt-2">Use the toolbar above to format your terms & conditions.</p>
          </div>

          {/* SECTION 5: Event Categories (Dropdown + Date) */}
          <div className="bento-card">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <Tag className="text-purple-400" /> Event Categories
              </h3>
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={categories.length === 0 || selectedCategories.length >= categories.length}
                className="btn-secondary text-sm flex items-center gap-1.5 disabled:opacity-40"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>

            {categories.length === 0 ? (
              <p className="text-muted-foreground text-sm">No categories available. Create categories in Settings first.</p>
            ) : selectedCategories.length === 0 ? (
              <p className="text-muted-foreground text-sm">No categories added. Click &quot;Add Category&quot; to add one.</p>
            ) : (
              <div className="space-y-3">
                {selectedCategories.map((sel, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-end gap-3 p-3  rounded-lg">
                    <div className="flex-1 w-full sm:w-auto">
                      <label className="block text-xs text-muted-foreground mb-1">Category</label>
                      <Select value={sel.categoryId || '__none__'} onValueChange={(v) => handleCategoryChange(idx, 'categoryId', v === '__none__' ? '' : v)}>
                        <SelectTrigger className="bg-surface-container border-border/30 text-sm">
                          <SelectValue placeholder="Select category..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select category...</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem
                              key={cat.id}
                              value={cat.id}
                              disabled={usedCategoryIds.includes(cat.id) && sel.categoryId !== cat.id}
                            >
                              {cat.name} - ₹{cat.price}
                              {cat.cgst > 0 ? ` (CGST: ${cat.cgst}%)` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full sm:w-44">
                      <label className="block text-xs text-muted-foreground mb-1">Date</label>
                      <DatePicker
                        value={sel.date}
                        onChange={(v) => handleCategoryChange(idx, 'date', v)}
                        placeholder="Select date"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(idx)}
                      className="p-2 text-destructive hover:text-destructive hover:bg-red-500 hover:bg-opacity-10 rounded-lg transition"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
            </button>
            <Link href="/events" className="btn-secondary text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </ProtectedRoute>
    </BoneyardSkeleton>
  );
}

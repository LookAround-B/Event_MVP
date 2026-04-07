"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import VenueMapPicker from '@/components/VenueMapPicker';
import { X, MapPin, Upload, Plus, Trash2, Calendar, Clock, FileText, Tag, Save } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DatePicker } from '@/components/DatePicker';
import { cn } from '@/lib/utils';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border border-white/[0.12] min-h-[160px] flex items-center justify-center text-muted-foreground text-sm bg-white/[0.02]">
      <div className="flex flex-col items-center gap-2">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        Loading editor...
      </div>
    </div>
  ),
});

interface CategorySelection {
  categoryId: string;
  date: string;
}

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateEventModal({ open, onClose, onCreated }: CreateEventModalProps) {
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [fileUrl, setFileUrl] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<CategorySelection[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) {
      // reset form
      setFormData({
        eventType: 'KSEC', name: '', description: '',
        startDate: '', startTime: '06:00', startEndTime: '18:00',
        endDate: '', endStartTime: '06:00', endTime: '18:00',
        venueName: '', venueAddress: '', venueLat: '', venueLng: '',
        termsAndConditions: '',
      });
      setFileUrl('');
      setSelectedCategories([]);
      fetchCategories();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/settings/event-categories');
      if (res.data.success) setCategories(res.data.data || []);
    } catch { /* non-blocking */ }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditorChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, termsAndConditions: value }));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File size must be under 10MB'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) { setFileUrl(res.data.data.fileUrl); toast.success('File uploaded'); }
      else toast.error(res.data.message || 'Upload failed');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleAddCategory = () => setSelectedCategories(prev => [...prev, { categoryId: '', date: '' }]);
  const handleRemoveCategory = (idx: number) => setSelectedCategories(prev => prev.filter((_, i) => i !== idx));
  const handleCategoryChange = (idx: number, field: keyof CategorySelection, value: string) => {
    setSelectedCategories(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };
  const usedCategoryIds = selectedCategories.map(c => c.categoryId).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventType || !formData.name.trim()) { toast.error('Event type and name are required'); return; }
    if (formData.name.trim().length < 3) { toast.error('Event name must be at least 3 characters'); return; }
    if (!formData.startDate || !formData.endDate) { toast.error('Start date and end date are required'); return; }
    if (new Date(formData.endDate) < new Date(formData.startDate)) { toast.error('End date must be on or after start date'); return; }
    if (!formData.startTime || !formData.startEndTime) { toast.error('Start date requires both start time and end time'); return; }
    if (!formData.endStartTime || !formData.endTime) { toast.error('End date requires both start time and end time'); return; }

    const validCategories = selectedCategories.filter(c => c.categoryId);
    const categoryIds = validCategories.map(c => c.categoryId);
    if (new Set(categoryIds).size !== categoryIds.length) { toast.error('Duplicate categories selected'); return; }

    setSubmitting(true);
    try {
      const res = await api.post('/api/events', { ...formData, fileUrl, categoryIds });
      if (res.data && !res.data.success) { toast.error(res.data.message || 'Failed to create event'); return; }
      toast.success('Event created successfully!');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally { setSubmitting(false); }
  };

  if (!mounted || !open) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal shell */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border/50 bg-surface-low shadow-2xl shadow-black/50 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 flex-shrink-0">
          <h2 className="text-lg font-bold text-on-surface">Create New Event</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div ref={bodyRef} className="overflow-y-auto flex-1 px-6 py-5 space-y-6 scrollbar-none">
          <form id="create-event-form" onSubmit={handleSubmit}>

            {/* ─── Event Information ─────────────────────────── */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary/70">
                <FileText className="w-4 h-4" /> Event Information
              </h3>

              {/* Row: Name + Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-tech mb-1.5 block">Event Name <span className="text-destructive">*</span></label>
                  <input
                    type="text" name="name" value={formData.name} onChange={handleChange}
                    required minLength={3} maxLength={200} placeholder="Enter event name"
                    className="w-full px-4 py-2.5 bg-surface-container text-on-surface text-sm rounded-xl border border-border/50 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40"
                  />
                </div>
                <div>
                  <label className="label-tech mb-1.5 block">Event Type <span className="text-destructive">*</span></label>
                  <Select value={formData.eventType} onValueChange={(v) => setFormData(prev => ({ ...prev, eventType: v }))}>
                    <SelectTrigger className="bg-surface-container border-border/50 h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KSEC">KSEC</SelectItem>
                      <SelectItem value="EPL">EPL</SelectItem>
                      <SelectItem value="EIRS Show">EIRS Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label-tech mb-1.5 block">Description <span className="text-[10px] text-muted-foreground normal-case font-normal">(optional)</span></label>
                <textarea
                  name="description" value={formData.description} onChange={handleChange}
                  placeholder="Event description..." rows={3} maxLength={2000}
                  className="w-full px-4 py-2.5 bg-surface-container text-on-surface text-sm rounded-xl border border-border/50 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="label-tech mb-1.5 block">Event File / Banner <span className="text-[10px] text-muted-foreground normal-case font-normal">(optional)</span></label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-surface-container/80 text-on-surface-variant rounded-xl hover:bg-surface-bright cursor-pointer transition text-sm border border-border/50">
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Choose File'}
                    <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                  </label>
                  {fileUrl && <span className="text-xs text-primary truncate max-w-[200px]">{fileUrl.split('/').pop()}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Images (JPG, PNG, GIF) and PDF. Max 10MB.</p>
              </div>
            </div>

            {/* ─── Schedule ──────────────────────────────────── */}
            <div className="space-y-4 pt-4 border-t border-border/20">
              <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary/70">
                <Calendar className="w-4 h-4" /> Schedule
              </h3>

              {/* Start Date */}
              <div>
                <label className="text-xs font-semibold text-on-surface mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" /> Start Date <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Date</label>
                    <DatePicker value={formData.startDate} onChange={(v) => setFormData(prev => ({ ...prev, startDate: v }))} placeholder="Pick a date..." />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Start Time</label>
                    <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required
                      className="w-full px-3 py-2.5 bg-surface-container text-on-surface text-sm rounded-xl border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">End Time</label>
                    <input type="time" name="startEndTime" value={formData.startEndTime} onChange={handleChange} required
                      className="w-full px-3 py-2.5 bg-surface-container text-on-surface text-sm rounded-xl border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  </div>
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="text-xs font-semibold text-on-surface mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-destructive" /> End Date <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Date</label>
                    <DatePicker value={formData.endDate} onChange={(v) => setFormData(prev => ({ ...prev, endDate: v }))} placeholder="Pick a date..." />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Start Time</label>
                    <input type="time" name="endStartTime" value={formData.endStartTime} onChange={handleChange} required
                      className="w-full px-3 py-2.5 bg-surface-container text-on-surface text-sm rounded-xl border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">End Time</label>
                    <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required
                      className="w-full px-3 py-2.5 bg-surface-container text-on-surface text-sm rounded-xl border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Venue ─────────────────────────────────────── */}
            <div className="space-y-4 pt-4 border-t border-border/20">
              <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary/70">
                <MapPin className="w-4 h-4" /> Venue
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-tech mb-1.5 block">Venue Name</label>
                  <input type="text" name="venueName" value={formData.venueName} onChange={handleChange}
                    placeholder="Venue name" maxLength={200}
                    className="w-full px-4 py-2.5 bg-surface-container text-on-surface text-sm rounded-xl border border-border/50 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="label-tech mb-1.5 block">Venue Address</label>
                  <input type="text" name="venueAddress" value={formData.venueAddress} onChange={handleChange}
                    placeholder="Full address" maxLength={500}
                    className="w-full px-4 py-2.5 bg-surface-container text-on-surface text-sm rounded-xl border border-border/50 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
              </div>

              <div>
                <label className="label-tech mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Venue Location
                </label>
                <VenueMapPicker
                  lat={formData.venueLat}
                  lng={formData.venueLng}
                  onLocationChange={(lat, lng) => setFormData(prev => ({ ...prev, venueLat: lat, venueLng: lng }))}
                />
              </div>
            </div>

            {/* ─── Terms & Conditions ─────────────────────────── */}
            <div className="space-y-3 pt-4 border-t border-border/20">
              <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary/70">
                <FileText className="w-4 h-4" /> Terms & Conditions
              </h3>
              <RichTextEditor
                value={formData.termsAndConditions}
                onChange={handleEditorChange}
                placeholder="Enter event terms and conditions..."
              />
              <p className="text-xs text-muted-foreground">Use the toolbar to format your terms & conditions.</p>
            </div>

            {/* ─── Event Categories ───────────────────────────── */}
            <div className="space-y-3 pt-4 border-t border-border/20">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary/70">
                  <Tag className="w-4 h-4" /> Event Categories
                </h3>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={categories.length === 0 || selectedCategories.length >= categories.length}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-bright border border-border/50 text-xs transition disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Category
                </button>
              </div>

              {categories.length === 0 ? (
                <p className="text-xs text-muted-foreground">No categories available. Create categories in Settings first.</p>
              ) : selectedCategories.length === 0 ? (
                <p className="text-xs text-muted-foreground">No categories added. Click "Add Category" to add one.</p>
              ) : (
                <div className="space-y-2">
                  {selectedCategories.map((sel, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-end gap-2 p-3 rounded-xl bg-surface-container/40 border border-border/20">
                      <div className="flex-1 w-full">
                        <label className="block text-xs text-muted-foreground mb-1">Category</label>
                        <Select value={sel.categoryId || '__none__'} onValueChange={(v) => handleCategoryChange(idx, 'categoryId', v === '__none__' ? '' : v)}>
                          <SelectTrigger className="bg-surface-container border-border/30 text-sm h-9">
                            <SelectValue placeholder="Select category..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Select category...</SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id} disabled={usedCategoryIds.includes(cat.id) && sel.categoryId !== cat.id}>
                                {cat.name} - ₹{cat.price}{cat.cgst > 0 ? ` (CGST: ${cat.cgst}%)` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full sm:w-40">
                        <label className="block text-xs text-muted-foreground mb-1">Date</label>
                        <DatePicker value={sel.date} onChange={(v) => handleCategoryChange(idx, 'date', v)} placeholder="Select date" />
                      </div>
                      <button type="button" onClick={() => handleRemoveCategory(idx)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition" title="Remove">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-border/30 flex-shrink-0">
          <button
            form="create-event-form"
            type="submit"
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 btn-cta rounded-xl text-sm font-bold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Creating...' : 'Create Event'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-5 py-2.5 bg-surface-container/60 rounded-xl text-sm text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/30"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

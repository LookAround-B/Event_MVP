"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import VenueMapPicker from '@/components/VenueMapPicker';
import { X, MapPin, Upload, Plus, Trash2, Calendar, Clock, FileText, Tag, Save, Download } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DatePicker } from '@/components/DatePicker';
import { Skeleton } from '@/components/ui/skeleton';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border border-white/[0.12] min-h-[160px] flex items-center justify-center text-muted-foreground text-sm bg-white/[0.02]">
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

interface EditEventModalProps {
  open: boolean;
  eventId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

interface ManifestRegistration {
  id: string;
  startNumber?: number | null;
  paymentStatus?: string;
  rider?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    dob?: string | Date | null;
  };
  horse?: {
    name?: string;
    horseCode?: string | null;
  };
  category?: {
    id?: string;
    name?: string;
  };
  club?: {
    name?: string;
  };
}

const ROUND_ROBIN_GAP = 7;
const MANIFEST_START_HOUR = 14;
const MANIFEST_START_MINUTE = 0;
const MANIFEST_INTERVAL_MINUTES = 3;
const BLUE_ACCENT_LIGHT_80 = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBF7' } } as const;
const BLUE_ACCENT_LIGHT_60 = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB4C6E7' } } as const;

function getOrdinalSuffix(day: number) {
  if (day % 100 >= 11 && day % 100 <= 13) return 'th';
  if (day % 10 === 1) return 'st';
  if (day % 10 === 2) return 'nd';
  if (day % 10 === 3) return 'rd';
  return 'th';
}

function formatManifestHeaderDate(rawDate: string) {
  if (!rawDate) return '';
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.getDate();
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase();
  const month = date.toLocaleDateString('en-GB', { month: 'long' }).toUpperCase();
  return `${weekday},${day}${getOrdinalSuffix(day)} ${month}`;
}

function formatManifestFileDate(rawDate: string) {
  const date = rawDate ? new Date(rawDate) : new Date();
  if (Number.isNaN(date.getTime())) return 'Unknown Date';
  const day = date.getDate();
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const month = date.toLocaleDateString('en-GB', { month: 'long' });
  return `${weekday} ${day}${getOrdinalSuffix(day)} ${month}-${date.getFullYear()}`;
}

function getManifestYear(rawDate: string) {
  const date = rawDate ? new Date(rawDate) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
}

function getRiderDisplayName(entry: ManifestRegistration) {
  return `${entry.rider?.firstName || ''} ${entry.rider?.lastName || ''}`.trim() || 'Unknown Rider';
}

function toUpperDisplay(value: string | null | undefined) {
  return String(value || '').trim().toUpperCase();
}

function getFirstGroupedRiderName(entries: ManifestRegistration[] | undefined, fallbackKey: string) {
  if (!entries || entries.length === 0) return fallbackKey;
  return getRiderDisplayName(entries[0]);
}

function getRiderKey(entry: ManifestRegistration) {
  return entry.rider?.id || getRiderDisplayName(entry).toLowerCase();
}

function getHcValue(entry: ManifestRegistration) {
  return entry.horse?.horseCode ? 'Yes' : 'No';
}

function getRiderCategoryLabel(entry: ManifestRegistration, referenceDateRaw: string) {
  const dob = entry.rider?.dob ? new Date(entry.rider.dob) : null;
  if (!dob || Number.isNaN(dob.getTime()) || !referenceDateRaw) return entry.category?.name || '-';
  const referenceDate = new Date(referenceDateRaw);
  if (Number.isNaN(referenceDate.getTime())) return entry.category?.name || '-';

  let age = referenceDate.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    referenceDate.getMonth() < dob.getMonth() ||
    (referenceDate.getMonth() === dob.getMonth() && referenceDate.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;

  if (age <= 14) return 'SUB-JUNIOR (Age 14 and Below)';
  if (age <= 18) return 'JUNIOR (Age 15 to 18)';
  return 'OPEN (Age 19 and Above)';
}

async function fetchLogoBase64() {
  try {
    const response = await fetch('/images/embassy-logo.png');
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  } catch {
    return null;
  }
}

function buildManifestRows(entries: ManifestRegistration[]) {
  const sortedByStartNumber = [...entries].sort((a, b) => {
    const aStart = typeof a.startNumber === 'number' ? a.startNumber : Number.MAX_SAFE_INTEGER;
    const bStart = typeof b.startNumber === 'number' ? b.startNumber : Number.MAX_SAFE_INTEGER;
    if (aStart !== bStart) return aStart - bStart;
    return getRiderDisplayName(a).localeCompare(getRiderDisplayName(b));
  });

  if (sortedByStartNumber.length > 0 && sortedByStartNumber.every((entry) => typeof entry.startNumber === 'number')) {
    return sortedByStartNumber;
  }

  const grouped = new Map<string, ManifestRegistration[]>();
  for (const entry of entries) {
    const key = getRiderKey(entry);
    const bucket = grouped.get(key) || [];
    bucket.push(entry);
    grouped.set(key, bucket);
  }

  const riderOrder = Array.from(grouped.keys()).sort((a, b) => {
    return getFirstGroupedRiderName(grouped.get(a), a).localeCompare(getFirstGroupedRiderName(grouped.get(b), b));
  });

  const recentRiders: string[] = [];
  const ordered: ManifestRegistration[] = [];

  while (ordered.length < entries.length) {
    const candidates = riderOrder.filter((key) => {
      const remaining = grouped.get(key);
      return remaining && remaining.length > 0 && !recentRiders.includes(key);
    });

    const pool = candidates.length > 0
      ? candidates
      : riderOrder.filter((key) => (grouped.get(key)?.length || 0) > 0);

    if (pool.length === 0) break;

    pool.sort((a, b) => {
      const aRemaining = grouped.get(a)?.length || 0;
      const bRemaining = grouped.get(b)?.length || 0;
      if (aRemaining !== bRemaining) return bRemaining - aRemaining;
      return getFirstGroupedRiderName(grouped.get(a), a).localeCompare(getFirstGroupedRiderName(grouped.get(b), b));
    });

    const chosenKey = pool[0];
    const nextEntry = grouped.get(chosenKey)?.shift();
    if (!nextEntry) continue;

    ordered.push(nextEntry);
    recentRiders.push(chosenKey);
    if (recentRiders.length > ROUND_ROBIN_GAP) {
      recentRiders.shift();
    }
  }

  return ordered;
}

export default function EditEventModal({ open, eventId, onClose, onUpdated }: EditEventModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [fileUrl, setFileUrl] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<CategorySelection[]>([]);
  const [editorReady, setEditorReady] = useState(false);
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
    if (open && eventId) {
      setEditorReady(false);
      setLoading(true);
      document.body.style.overflow = 'hidden';
      Promise.all([fetchEvent(), fetchCategories()]).finally(() => {
        setLoading(false);
        // Delay editor mount to ensure value is loaded
        setTimeout(() => setEditorReady(true), 100);
      });
    } else if (!open) {
      document.body.style.overflow = '';
      setEditorReady(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open, eventId]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/api/events/${eventId}`);
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
      } else {
        setSelectedCategories([]);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load event');
    }
  };

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
  const [exporting, setExporting] = useState(false);

  const handleExportManifest = async () => {
    if (!eventId) return;
    setExporting(true);
    try {
      // Fetch registrations for this event
      const regRes = await api.get(`/api/registrations?eventId=${eventId}&limit=500`);
      const registrations: ManifestRegistration[] = regRes.data.data?.registrations || [];
      if (registrations.length === 0) {
        toast.error('No registrations found for this event');
        return;
      }

      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      const startDateLabel = formatManifestHeaderDate(formData.startDate);
      const bannerTitle = `EQUESTRIAN PREMIER LEAGUE-${getManifestYear(formData.startDate)}`;
      const logoBase64 = await fetchLogoBase64();

      // Group registrations by category
      const grouped: Record<string, { categoryName: string; entries: ManifestRegistration[] }> = {};
      for (const reg of registrations) {
        const catName = reg.category?.name || 'Uncategorized';
        const catId = reg.category?.id || 'uncategorized';
        if (!grouped[catId]) grouped[catId] = { categoryName: catName, entries: [] };
        grouped[catId].entries.push(reg);
      }

      const categoryKeys = Object.keys(grouped);

      for (const catKey of categoryKeys) {
        const { categoryName, entries } = grouped[catKey];
        const orderedEntries = buildManifestRows(entries);
        const sheetName = categoryName.substring(0, 31); // Excel sheet name max 31 chars
        const ws = wb.addWorksheet(sheetName);

        // Column widths (A through G)
        ws.getColumn(1).width = 11.8; // A - Time / logo square
        ws.getColumn(2).width = 7.2;  // B - Sr.No
        ws.getColumn(3).width = 26.5; // C - Rider Name
        ws.getColumn(4).width = 20.5; // D - Horse
        ws.getColumn(5).width = 30.5; // E - Rider Category
        ws.getColumn(6).width = 19.5; // F - Club
        ws.getColumn(7).width = 8.5;  // G - HC

        const thinBorder = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        } as const;
        const orangeFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF08C00' } } as const;

        // Row 1: Logo in A1 and title banner in B1:G1
        ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        ws.getCell('A1').border = thinBorder;
        ws.mergeCells('B1:G1');
        const titleCell = ws.getCell('B1');
        titleCell.value = bannerTitle;
        titleCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = orangeFill;
        titleCell.border = thinBorder;
        ws.getRow(1).height = 78;
        for (let col = 2; col <= 7; col++) {
          ws.getCell(1, col).fill = orangeFill;
          ws.getCell(1, col).border = thinBorder;
        }

        if (logoBase64) {
          const imageId = wb.addImage({
            base64: logoBase64,
            extension: 'png',
          });
          ws.addImage(imageId, {
            tl: { col: 0.08, row: 0.1 } as any,
            ext: { width: 76, height: 58 },
            editAs: 'oneCell',
          });
        }

        // Row 2: Date + Category info (merged A2:G2)
        ws.mergeCells('A2:G2');
        const subtitleCell = ws.getCell('A2');
        subtitleCell.value = `${startDateLabel}  -    ${categoryName.toUpperCase()}                                              CLASS : ${categoryName.toUpperCase()},OPEN`;
        subtitleCell.font = { name: 'Arial', size: 14, bold: true };
        subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        subtitleCell.fill = BLUE_ACCENT_LIGHT_80;
        subtitleCell.border = thinBorder;
        ws.getRow(2).height = 28;

        // Row 3: Course walk info (merged A3:G3)
        ws.mergeCells('A3:G3');
        const infoCell = ws.getCell('A3');
        infoCell.value = 'Course Walk - 13:30Hrs   First Rider - 1400 HRS';
        infoCell.font = { name: 'Arial', size: 14, bold: true };
        infoCell.alignment = { horizontal: 'center', vertical: 'middle' };
        infoCell.fill = BLUE_ACCENT_LIGHT_60;
        infoCell.border = thinBorder;
        ws.getRow(3).height = 28;

        // Row 4: Headers
        const headers = ['Time', 'Sr.No', 'Rider Name', 'Horse ', 'Rider Category', 'Club ', 'HC'];
        headers.forEach((h, i) => {
          const cell = ws.getCell(4, i + 1); // A4 through G4
          cell.value = h;
          cell.font = { name: 'Arial', size: 14, bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = thinBorder;
        });
        ws.getRow(4).height = 26;

        // Data rows starting at row 5
        orderedEntries.forEach((reg, index) => {
          const rowNum = 5 + index;
          const totalMinutes = MANIFEST_START_HOUR * 60 + MANIFEST_START_MINUTE + index * MANIFEST_INTERVAL_MINUTES;
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;

          // B: Time
          const timeCell = ws.getCell(rowNum, 1);
          timeCell.value = new Date(1899, 11, 30, hours, minutes);
          timeCell.numFmt = 'HH:MM';
          timeCell.font = { name: 'Arial', size: 14 };
          timeCell.alignment = { horizontal: 'center', vertical: 'middle' };

          // B: Sr.No
          const srCell = ws.getCell(rowNum, 2);
          srCell.value = index + 1;
          srCell.font = { name: 'Arial', size: 11 };
          srCell.alignment = { horizontal: 'center', vertical: 'middle' };
          // C: Rider Name
          const riderCell = ws.getCell(rowNum, 3);
          riderCell.value = toUpperDisplay(getRiderDisplayName(reg));
          riderCell.font = { name: 'Arial', size: 11 };
          riderCell.alignment = { horizontal: 'center', vertical: 'middle' };

          // D: Horse
          const horseCell = ws.getCell(rowNum, 4);
          horseCell.value = toUpperDisplay(reg.horse?.name);
          horseCell.font = { name: 'Arial', size: 11 };
          horseCell.alignment = { horizontal: 'center', vertical: 'middle' };

          // E: Rider Category
          const catCell = ws.getCell(rowNum, 5);
          catCell.value = getRiderCategoryLabel(reg, formData.startDate);
          catCell.font = { name: 'Arial', size: 11 };
          catCell.alignment = { horizontal: 'center', vertical: 'middle' };

          // F: Club
          const clubCell = ws.getCell(rowNum, 6);
          clubCell.value = toUpperDisplay(reg.club?.name || '-');
          clubCell.font = { name: 'Arial', size: 11 };
          clubCell.alignment = { horizontal: 'center', vertical: 'middle' };

          // G: HC
          const hcCell = ws.getCell(rowNum, 7);
          hcCell.value = getHcValue(reg);
          hcCell.font = { name: 'Arial', size: 11 };
          hcCell.alignment = { horizontal: 'center', vertical: 'middle' };

          for (let col = 1; col <= 7; col++) {
            const cell = ws.getCell(rowNum, col);
            cell.border = thinBorder;
          }
          ws.getRow(rowNum).height = 26;
        });
      }

      // Generate and download
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Start List  ${formData.name || 'Event'}- ${formatManifestFileDate(formData.startDate)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Manifest exported successfully!');
    } catch (err: any) {
      console.error('Export failed:', err);
      toast.error(err.response?.data?.message || 'Failed to export manifest');
    } finally {
      setExporting(false);
    }
  };

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
      const res = await api.put(`/api/events/${eventId}`, { ...formData, fileUrl, categoryIds });
      if (res.data && !res.data.success) { toast.error(res.data.message || 'Failed to update event'); return; }
      toast.success('Event updated successfully!');
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update event');
    } finally { setSubmitting(false); }
  };

  if (!mounted || !open || !eventId) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal shell */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-border/50 bg-surface-low shadow-2xl shadow-black/50 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 flex-shrink-0">
          <h2 className="text-lg font-bold text-on-surface">Edit Event</h2>
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
          {loading ? (
            <div className="space-y-5 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-11 w-full rounded-xl bg-border/20" />
                <Skeleton className="h-11 w-full rounded-xl bg-border/20" />
              </div>
              <Skeleton className="h-24 w-full rounded-xl bg-border/15" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Skeleton className="h-11 w-full rounded-xl bg-border/20" />
                <Skeleton className="h-11 w-full rounded-xl bg-border/20" />
                <Skeleton className="h-11 w-full rounded-xl bg-border/20" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-11 w-full rounded-xl bg-border/20" />
                <Skeleton className="h-11 w-full rounded-xl bg-border/20" />
              </div>
              <Skeleton className="h-48 w-full rounded-2xl bg-border/15" />
            </div>
          ) : (
          <form id="edit-event-form" onSubmit={handleSubmit}>

            {/* ─── Event Information ─────────────────────────── */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary/70">
                <FileText className="w-4 h-4" /> Event Information
              </h3>

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

              <div>
                <label className="label-tech mb-1.5 block">Description <span className="text-[10px] text-muted-foreground normal-case font-normal">(optional)</span></label>
                <textarea
                  name="description" value={formData.description} onChange={handleChange}
                  placeholder="Event description..." rows={3} maxLength={2000}
                  className="w-full px-4 py-2.5 bg-surface-container text-on-surface text-sm rounded-xl border border-border/50 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                />
              </div>

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
              {editorReady ? (
                <RichTextEditor
                  key={`editor-${eventId}`}
                  value={formData.termsAndConditions}
                  onChange={handleEditorChange}
                  placeholder="Enter event terms and conditions..."
                />
              ) : (
                <div className="rounded-lg border border-white/[0.12] min-h-[160px] flex items-center justify-center text-muted-foreground text-sm bg-white/[0.02]">
                  <div className="w-full space-y-3 p-4">
                    <Skeleton className="h-8 w-40 bg-border/20" />
                    <Skeleton className="h-24 w-full rounded-xl bg-border/15" />
                    <Skeleton className="h-24 w-full rounded-xl bg-border/15" />
                  </div>
                </div>
              )}
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
                <p className="text-xs text-muted-foreground">No categories added. Click &quot;Add Category&quot; to add one.</p>
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
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-border/30 flex-shrink-0">
          <button
            form="edit-event-form"
            type="submit"
            disabled={submitting || loading}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 btn-cta rounded-xl text-sm font-bold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleExportManifest}
            disabled={exporting || loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-surface-container/60 rounded-xl text-sm text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export Manifest'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-surface-container/60 rounded-xl text-sm text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/30"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

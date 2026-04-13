import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { ArrowLeft, Download, ChevronLeft, ChevronRight, MapPin, Clock, Search, X, Eye, ListOrdered, Zap, Loader2 } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { PageSkeleton } from '@/components/PageSkeleton';
import { useAuth } from '@/hooks/useAuth';

interface EventDetail {
  id: string;
  name: string;
  eventType: string;
  startDate: string;
  endDate: string;
  description: string;
  venueName: string;
  venueAddress: string;
  termsAndConditions: string;
  isPublished: boolean;
  categories?: { id: string; name: string; price: number }[];
}

interface Registration {
  id: string;
  rider: { firstName: string; lastName: string; email: string };
  horse: { name: string; color: string };
  club: { name: string };
  category: { name: string; price: number };
  paymentStatus: string;
  paymentMethod: string;
  eventAmount: number;
  stableAmount: number;
  gstAmount: number;
  totalAmount: number;
  registeredAt: string;
}

interface ScheduleEntry {
  id: string;
  startPosition: number | null;
  riderId: string;
  horseId: string;
  rider: { firstName: string; lastName: string };
  horse: { name: string };
}

/* ===================== Utility: Export ===================== */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildTimestampedFileName(prefix: string, extension: string) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${prefix}-${stamp}.${extension}`;
}

async function fetchLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch('/images/embassy-logo.png');
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin);
  } catch {
    return null;
  }
}

export default function EventDetail() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const canManageEvent = isAdmin;
  const canDownload = isAdmin;
  const { id } = router.query;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registeredCount, setRegisteredCount] = useState(0);

  // Table filters
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 15;

  // Checkbox selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Action modal
  const [actionModal, setActionModal] = useState<{ isOpen: boolean; registration?: Registration }>({ isOpen: false });

  // Start list / schedule
  const [scheduleCategory, setScheduleCategory] = useState<string>('');
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      Promise.all([fetchEventDetail(), fetchRegistrations()]);
    }
  }, [id]);

  const fetchEventDetail = async () => {
    try {
      const response = await api.get(`/api/events/${id}`);
      setEvent(response.data.data);
    } catch (err) {
      console.error('Failed to fetch event:', err);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const params = new URLSearchParams({ eventId: id as string, limit: '500' });
      const response = await api.get(`/api/registrations?${params}`);
      const allRegistrations = response.data.data?.registrations || [];
      setRegistrations(allRegistrations);
      setRegisteredCount(allRegistrations.length);
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
    }
  };

  const fetchSchedule = async (categoryId: string) => {
    if (!categoryId || !id) return;
    setScheduleLoading(true);
    setScheduleError(null);
    try {
      const response = await api.get(`/api/schedules/${categoryId}?eventId=${id}`);
      setScheduleData(response.data.data || []);
    } catch {
      setScheduleError('Failed to load start list');
    } finally {
      setScheduleLoading(false);
    }
  };

  const generateSchedule = async () => {
    if (!scheduleCategory || !id) return;
    setGenerating(true);
    setScheduleError(null);
    try {
      await api.post('/api/schedules/generate', { eventId: id, categoryId: scheduleCategory });
      await fetchSchedule(scheduleCategory);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to generate schedule';
      setScheduleError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleScheduleCategoryChange = (categoryId: string) => {
    setScheduleCategory(categoryId);
    setScheduleData([]);
    if (categoryId) fetchSchedule(categoryId);
  };

  // Filtered and paginated registrations
  const filtered = registrations.filter(r => {
    if (filterPaymentStatus && r.paymentStatus !== filterPaymentStatus) return false;
    if (filterCategory && r.category?.name !== filterCategory) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      const match = `${r.rider.firstName} ${r.rider.lastName}`.toLowerCase().includes(q)
        || r.horse.name.toLowerCase().includes(q)
        || (r.club?.name || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // Toggle checkbox
  const toggleAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(r => r.id)));
    }
  };
  const toggleOne = (rid: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(rid)) next.delete(rid); else next.add(rid);
      return next;
    });
  };

  // Unique categories for filter
  const uniqueCategories = Array.from(new Set(registrations.map(r => r.category?.name).filter(Boolean)));

  // Category amount summary
  const categoryAmounts = registrations.reduce((acc, r) => {
    const name = r.category?.name || 'Uncategorized';
    if (!acc[name]) acc[name] = { count: 0, total: 0 };
    acc[name].count++;
    acc[name].total += r.totalAmount;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Time', 'Sr.No', 'Rider Name', 'Horse', 'Rider Category', 'Club', 'HC'];
    const rows = registrations.map((r, index) => [
      '',
      index + 1,
      `${r.rider.firstName} ${r.rider.lastName}`,
      r.horse.name,
      r.category?.name || '-',
      r.club?.name || '-',
      'No',
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadBlob(new Blob([csvContent], { type: 'text/csv;charset=utf-8' }), buildTimestampedFileName(`${event?.name || 'event'}-start-list`, 'csv'));
  };

  // Export Excel
  const exportToExcel = async () => {
    const formatTemplateDate = (rawDate?: string) => {
      if (!rawDate) return '';
      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return '';
      const day = date.getDate();
      const suffix = day % 10 === 1 && day !== 11 ? 'st'
        : day % 10 === 2 && day !== 12 ? 'nd'
        : day % 10 === 3 && day !== 13 ? 'rd'
        : 'th';
      const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase();
      const month = date.toLocaleDateString('en-GB', { month: 'long' }).toUpperCase();
      return `${weekday},${day}${suffix} ${month}-${date.getFullYear()}`;
    };

    const startDateLabel = formatTemplateDate(event?.startDate);
    const classLabel = (event?.categories || []).map(c => c.name.toUpperCase()).join(',') || 'OPEN';
    const eventTypeLabel = event?.eventType?.toUpperCase() || 'SHOW JUMPING';
    const dateText = startDateLabel ? `${startDateLabel}  -  ${eventTypeLabel}` : eventTypeLabel;
    const classText = `CLASS : ${classLabel}`;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Event MVP';
    const sheet = workbook.addWorksheet('Start List');

    // Column widths (A–G)
    sheet.columns = [
      { key: 'time',     width: 10 },
      { key: 'srno',     width: 7  },
      { key: 'rider',    width: 28 },
      { key: 'horse',    width: 22 },
      { key: 'category', width: 26 },
      { key: 'club',     width: 22 },
      { key: 'hc',       width: 7  },
    ];

    const orangeFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF08C00' } };
    const whiteFill:  ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F1F1F' } };
    const altFill:    ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };

    const thinBorder: ExcelJS.Borders = {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      diagonal: { style: 'thin', color: { argb: 'FFCCCCCC' } }
    };

    const applyToRow = (row: ExcelJS.Row, fill: ExcelJS.Fill, fontColor: string, fontSize: number, bold: boolean, align: ExcelJS.Alignment['horizontal'] = 'center') => {
      row.eachCell({ includeEmpty: true }, cell => {
        cell.fill = fill;
        cell.font = { name: 'Arial', size: fontSize, bold, color: { argb: fontColor } };
        cell.alignment = { horizontal: align, vertical: 'middle', wrapText: false };
        cell.border = thinBorder;
      });
    };

    // Row 1 — Logo (A1:B1, white) + Orange title (C1:G1)
    const logoBase64 = await fetchLogoBase64();
    sheet.addRow(['', '', '', '', '', '', '']);
    sheet.mergeCells('A1:G1');
    sheet.getRow(1).height = 60;
    if (logoBase64) {
      const logoId = workbook.addImage({ base64: logoBase64, extension: 'png' });
      sheet.unMergeCells('A1:G1');
      sheet.mergeCells('A1:B1');
      sheet.mergeCells('C1:G1');
      // Fix logo column widths so logo renders at the right size
      sheet.getColumn(1).width = 14;
      sheet.getColumn(2).width = 14;
      // Logo cell — white background, merged A1:B1
      sheet.getCell('A1').fill = whiteFill;
      sheet.getCell('A1').border = thinBorder;
      sheet.getCell('B1').fill = whiteFill;
      sheet.getCell('B1').border = thinBorder;
      sheet.addImage(logoId, { tl: { col: 0.1, row: 0.08 } as ExcelJS.Anchor, br: { col: 1.9, row: 0.92 } as ExcelJS.Anchor, editAs: 'oneCell' });
      const t = sheet.getCell('C1');
      t.value = 'EQUESTRIAN PREMIER LEAGUE';
      t.fill = orangeFill;
      t.font = { name: 'Arial', size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
      t.alignment = { horizontal: 'center', vertical: 'middle' };
      t.border = thinBorder;
    } else {
      const titleCell = sheet.getCell('A1');
      titleCell.value = (event?.name || 'START LIST').toUpperCase();
      titleCell.fill = orangeFill;
      titleCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.border = thinBorder;
    }

    // Row 2 — Date left (A2:D2) + Class right (E2:G2)
    sheet.addRow(['', '', '', '', '', '', '']);
    sheet.mergeCells('A2:D2');
    sheet.mergeCells('E2:G2');
    const dateCell  = sheet.getCell('A2');
    const classCell = sheet.getCell('E2');
    dateCell.value  = dateText;
    classCell.value = classText;
    [dateCell, classCell].forEach(cell => {
      cell.fill = whiteFill;
      cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF000000' } };
      cell.border = thinBorder;
    });
    dateCell.alignment  = { horizontal: 'left',  vertical: 'middle', indent: 1 };
    classCell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
    sheet.getRow(2).height = 28;

    // Row 3 — Course Walk note (merged A3:G3)
    sheet.addRow(['', '', '', '', '', '', '']);
    sheet.mergeCells('A3:G3');
    const noteCell = sheet.getCell('A3');
    noteCell.value = 'Course Walk - 13:30Hrs     First Rider - 1400 HRS';
    noteCell.fill = whiteFill;
    noteCell.font = { name: 'Arial', size: 11, bold: false, color: { argb: 'FF000000' } };
    noteCell.alignment = { horizontal: 'center', vertical: 'middle' };
    noteCell.border = thinBorder;
    sheet.getRow(3).height = 24;

    // Row 4 — Column headers
    const headerLabels = ['Time', 'Sr.No', 'Rider Name', 'Horse', 'Rider Category', 'Club', 'HC'];
    const headerRow = sheet.addRow(headerLabels);
    applyToRow(headerRow, headerFill, 'FFFFFFFF', 11, true, 'center');
    headerRow.height = 26;

    // Data rows
    registrations.forEach((r, index) => {
      const fill = index % 2 === 0 ? whiteFill : altFill;
      const row = sheet.addRow([
        '',
        index + 1,
        `${r.rider.firstName} ${r.rider.lastName}`,
        r.horse.name,
        r.category?.name || '-',
        r.club?.name || '-',
        r.paymentStatus === 'paid' ? 'Yes' : 'No',
      ]);
      applyToRow(row, fill, 'FF000000', 10, false, 'center');
      row.height = 20;
      // Sr.No — bold and centered
      const srCell = row.getCell(2);
      srCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF000000' } };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    downloadBlob(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      buildTimestampedFileName(`${event?.name || 'event'}-start-list`, 'xlsx')
    );
  };

  const exportStartListToExcel = async () => {
    if (scheduleData.length === 0 || !event) return;
    const catName = (event.categories || []).find(c => c.id === scheduleCategory)?.name || 'Category';

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Event MVP';
    const sheet = workbook.addWorksheet('Start List');

    sheet.columns = [
      { key: 'pos',   width: 8  },
      { key: 'rider', width: 32 },
      { key: 'horse', width: 26 },
    ];

    const orangeFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF08C00' } };
    const whiteFill:  ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F1F1F' } };
    const altFill:    ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
    const thinBorder: ExcelJS.Borders = {
      top:    { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left:   { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right:  { style: 'thin', color: { argb: 'FFCCCCCC' } },
      diagonal: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    };
    const applyRow = (row: ExcelJS.Row, fill: ExcelJS.Fill, fontColor: string, size: number, bold: boolean) => {
      row.eachCell({ includeEmpty: true }, cell => {
        cell.fill = fill;
        cell.font = { name: 'Arial', size, bold, color: { argb: fontColor } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = thinBorder;
      });
    };

    // Row 1 — title
    const logoBase64 = await fetchLogoBase64();
    sheet.addRow(['', '', '']);
    sheet.mergeCells('A1:C1');
    sheet.getRow(1).height = 54;
    if (logoBase64) {
      sheet.unMergeCells('A1:C1');
      sheet.mergeCells('B1:C1');
      sheet.getColumn(1).width = 14;
      const logoId = workbook.addImage({ base64: logoBase64, extension: 'png' });
      sheet.addImage(logoId, { tl: { col: 0.1, row: 0.08 } as ExcelJS.Anchor, br: { col: 0.9, row: 0.92 } as ExcelJS.Anchor, editAs: 'oneCell' });
      sheet.getCell('A1').fill = whiteFill; sheet.getCell('A1').border = thinBorder;
      const t = sheet.getCell('B1');
      t.value = 'EQUESTRIAN PREMIER LEAGUE'; t.fill = orangeFill;
      t.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      t.alignment = { horizontal: 'center', vertical: 'middle' }; t.border = thinBorder;
    } else {
      const t = sheet.getCell('A1');
      t.value = (event.name || 'START LIST').toUpperCase(); t.fill = orangeFill;
      t.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      t.alignment = { horizontal: 'center', vertical: 'middle' }; t.border = thinBorder;
    }

    // Row 2 — event name + category
    sheet.addRow(['', '', '']);
    sheet.mergeCells('A2:C2');
    const r2 = sheet.getCell('A2');
    r2.value = `${event.name}  |  ${catName}`;
    r2.fill = whiteFill; r2.border = thinBorder;
    r2.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };
    r2.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 26;

    // Row 3 — column headers
    const hdr = sheet.addRow(['Start #', 'Rider Name', 'Horse']);
    applyRow(hdr, headerFill, 'FFFFFFFF', 11, true);
    hdr.height = 26;

    // Data rows
    scheduleData.forEach((entry, idx) => {
      const fill = idx % 2 === 0 ? whiteFill : altFill;
      const row = sheet.addRow([
        entry.startPosition ?? idx + 1,
        `${entry.rider.firstName} ${entry.rider.lastName}`,
        entry.horse.name,
      ]);
      applyRow(row, fill, 'FF000000', 10, false);
      row.height = 20;
      row.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF000000' } };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    downloadBlob(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      buildTimestampedFileName(`${event.name}-${catName}-start-order`, 'xlsx')
    );
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <ProtectedRoute>
        <PageSkeleton variant="detail" />
      </ProtectedRoute>
    );
  }

  if (!event) {
    return (
      <ProtectedRoute>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Event not found</p>
          <Link href="/events" className="text-primary hover:text-primary/80 mt-4 inline-block">Back to Events</Link>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Head><title>{event.name} | Event Details</title></Head>
      <div className="space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/events" className="p-2 rounded-xl hover:bg-surface-container text-muted-foreground hover:text-on-surface transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
              {event.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">{event.eventType}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border ${event.isPublished ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-container text-muted-foreground border-border/30'}`}>
                {event.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
        </div>

        {/* Event Summary Card */}
        <div className="bento-card overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 via-secondary/40 to-primary/60" />
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1">
                <p className="label-tech">Start Date</p>
                <p className="text-sm text-on-surface font-medium flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-secondary" /> {formatDate(event.startDate)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="label-tech">End Date</p>
                <p className="text-sm text-on-surface font-medium flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-muted-foreground" /> {formatDate(event.endDate)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="label-tech">Venue</p>
                <p className="text-sm text-on-surface font-medium flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-muted-foreground" /> {event.venueName || 'N/A'}
                </p>
                {event.venueAddress && <p className="text-[10px] text-muted-foreground ml-4.5">{event.venueAddress}</p>}
              </div>
              {canManageEvent && (
                <div className="flex items-end">
                  <Link href={`/events/${id}/stables`} className="btn-cta px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
                    Manage Stables
                  </Link>
                </div>
              )}
            </div>

            {event.description && (
              <div className="space-y-1 pt-3 border-t border-border/20">
                <p className="label-tech">Description</p>
                <p className="text-sm text-on-surface-variant">{event.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Event Category Amount Summary */}
        {Object.keys(categoryAmounts).length > 0 && (
          <div className="bento-card p-6">
            <h2 className="label-tech mb-4">Event Category Breakdown</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(categoryAmounts).map(([name, data]) => (
                <div key={name} className="rounded-xl border border-border/30 bg-surface-container/40 p-4 hover:border-primary/25 transition-colors">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</p>
                  <p className="text-base font-bold text-on-surface mt-0.5">{name}</p>
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-muted-foreground">Registrations: <span className="font-semibold text-on-surface">{data.count}</span></span>
                    <span className="text-muted-foreground">Total: <span className="font-bold text-primary">₹{data.total.toLocaleString('en-IN')}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Registered Members Table */}
        <div className="bento-card overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary/40 via-primary/40 to-secondary/40" />
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
              <div>
                <h2 className="text-lg font-bold text-on-surface">Registered Members</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{registeredCount} Athletes</p>
              </div>
              {canDownload && (
                <div className="flex gap-2">
                  <button onClick={() => void exportToExcel()} className="flex items-center gap-2 px-4 py-2.5 bg-surface-container/60 rounded-xl text-sm text-on-surface-variant hover:bg-surface-bright border border-border/30 transition-colors">
                    <Download className="w-4 h-4" /> Excel
                  </button>
                  <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2.5 bg-surface-container/60 rounded-xl text-sm text-on-surface-variant hover:bg-surface-bright border border-border/30 transition-colors">
                    <Download className="w-4 h-4" /> CSV
                  </button>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="relative">
                <Search className="search-input-icon pointer-events-none absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search rider, horse, or club..."
                  value={filterSearch}
                  onChange={e => { setFilterSearch(e.target.value); setPage(1); }}
                  className="search-input-with-icon w-full pr-4 py-3 bg-surface-container/50 rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/30"
                />
              </div>
              <Select value={filterPaymentStatus || '__all__'} onValueChange={v => { setFilterPaymentStatus(v === '__all__' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All Payment Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Payment Statuses</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory || '__all__'} onValueChange={v => { setFilterCategory(v === '__all__' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Categories</SelectItem>
                  {uniqueCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="label-tech text-left bg-surface-container/40">
                    <th className="p-3 w-12">
                      <input type="checkbox" checked={paginated.length > 0 && selectedIds.size === paginated.length} onChange={toggleAll} className="accent-primary rounded" />
                    </th>
                    <th className="p-3">Rider</th>
                    <th className="p-3">Club</th>
                    <th className="p-3">Horse</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {paginated.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No registrations found</td></tr>
                  ) : (
                    paginated.map(reg => (
                      <tr key={reg.id} className="group hover:bg-surface-container/20 transition-all">
                        <td className="p-3">
                          <input type="checkbox" checked={selectedIds.has(reg.id)} onChange={() => toggleOne(reg.id)} className="accent-primary rounded" />
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-on-surface">{reg.rider.firstName} {reg.rider.lastName}</p>
                          <p className="text-[10px] text-muted-foreground">{reg.rider.email}</p>
                        </td>
                        <td className="p-3 text-on-surface-variant">{reg.club?.name || '-'}</td>
                        <td className="p-3">
                          <p className="text-on-surface">{reg.horse.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{reg.horse.color}</p>
                        </td>
                        <td className="p-3 text-on-surface-variant">{reg.category?.name || '-'}</td>
                        <td className="p-3 font-bold text-on-surface">₹{reg.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            reg.paymentStatus === 'PAID' ? 'bg-primary/10 text-primary' :
                            reg.paymentStatus === 'PARTIAL' ? 'bg-secondary/10 text-secondary' :
                            reg.paymentStatus === 'CANCELLED' ? 'bg-destructive/10 text-destructive' :
                            'bg-surface-bright text-muted-foreground'
                          }`}>
                            {reg.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button onClick={() => setActionModal({ isOpen: true, registration: reg })} className="p-2 rounded-lg hover:bg-surface-container text-muted-foreground hover:text-on-surface transition-all">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-surface-container/20 p-3 border-t border-border/10 flex items-center justify-center gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-surface-bright disabled:opacity-30 transition text-muted-foreground">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-muted-foreground px-3">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-surface-bright disabled:opacity-30 transition text-muted-foreground">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Start List Section */}
        <div className="bento-card overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-secondary/60 to-primary/40" />
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
              <div>
                <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-primary" /> Start List
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                  Rider entry spacing &amp; start order
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  value={scheduleCategory || '__none__'}
                  onValueChange={v => handleScheduleCategoryChange(v === '__none__' ? '' : v)}
                >
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select category</SelectItem>
                    {(event.categories || []).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {canManageEvent && (
                  <button
                    onClick={generateSchedule}
                    disabled={!scheduleCategory || generating}
                    className="flex items-center gap-2 px-4 py-2.5 btn-cta rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {generating
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Zap className="w-4 h-4" />}
                    {generating ? 'Generating…' : 'Generate'}
                  </button>
                )}
                {canDownload && scheduleData.length > 0 && (
                  <button
                    onClick={() => void exportStartListToExcel()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-surface-container/60 rounded-xl text-sm text-on-surface-variant hover:bg-surface-bright border border-border/30 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Excel
                  </button>
                )}
              </div>
            </div>

            {scheduleError && (
              <p className="text-sm text-destructive mb-4">{scheduleError}</p>
            )}

            {scheduleLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading start list…</span>
              </div>
            ) : scheduleData.length === 0 ? (
              <div className="py-10 text-center">
                <ListOrdered className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {scheduleCategory
                    ? canManageEvent
                      ? 'No start list yet. Click Generate to assign start positions.'
                      : 'No start list is available for this category yet.'
                    : canManageEvent
                      ? 'Select a category to view or generate the start list.'
                      : 'Select a category to view the start list.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="label-tech text-left bg-surface-container/40">
                      <th className="p-3 w-16">#</th>
                      <th className="p-3">Rider</th>
                      <th className="p-3">Horse</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {scheduleData.map((entry, idx) => (
                      <tr key={entry.id} className={`hover:bg-surface-container/20 transition-all ${idx % 2 === 0 ? '' : 'bg-surface-container/10'}`}>
                        <td className="p-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-black text-xs">
                            {entry.startPosition ?? idx + 1}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-on-surface">
                          {entry.rider.firstName} {entry.rider.lastName}
                        </td>
                        <td className="p-3 text-on-surface-variant">{entry.horse.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Prospectus Section */}
        <div className="bento-card p-6">
          <h2 className="label-tech mb-4">Prospectus</h2>
          <div className="prose prose-sm max-w-none text-on-surface-variant">
            {event.description ? (
              <p>{event.description}</p>
            ) : (
              <p className="text-muted-foreground italic">No prospectus available for this event.</p>
            )}
          </div>
          {event.termsAndConditions && (
            <div className="mt-6 pt-4 border-t border-border/20">
              <h3 className="label-tech mb-2">Terms & Conditions</h3>
              <div className="prose prose-sm max-w-none text-on-surface-variant">{event.termsAndConditions}</div>
            </div>
          )}
        </div>

        {/* Action / Participating Members Details Modal */}
        {actionModal.isOpen && actionModal.registration && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setActionModal({ isOpen: false })}>
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in" />
            <div className="relative z-10 w-full max-w-lg flex flex-col rounded-2xl border border-border/60 bg-surface-low shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border/40">
                <h3 className="text-base font-bold text-on-surface">Participating Member Details</h3>
                <button onClick={() => setActionModal({ isOpen: false })} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 max-h-[70vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div className="space-y-1">
                    <p className="label-tech">Event Name</p>
                    <p className="text-sm text-on-surface font-medium">{event.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="label-tech">Event Date</p>
                    <p className="text-sm text-on-surface font-medium">{formatDate(event.startDate)} - {formatDate(event.endDate)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="label-tech">Rider Name</p>
                    <p className="text-sm text-on-surface font-medium">{actionModal.registration.rider.firstName} {actionModal.registration.rider.lastName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="label-tech">Club Name</p>
                    <p className="text-sm text-on-surface font-medium">{actionModal.registration.club?.name || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="label-tech">Horse Name</p>
                    <p className="text-sm text-on-surface font-medium">{actionModal.registration.horse.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="label-tech">Event Category</p>
                    <p className="text-sm text-on-surface font-medium">{actionModal.registration.category?.name || '-'}</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border/20 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Event Amount:</span><span className="font-semibold text-on-surface">₹{actionModal.registration.eventAmount.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Stable Amount:</span><span className="font-semibold text-on-surface">₹{actionModal.registration.stableAmount.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">GST Amount:</span><span className="font-semibold text-on-surface">₹{actionModal.registration.gstAmount.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between border-t border-border/20 pt-2 mt-2">
                    <span className="font-bold text-on-surface">Total:</span>
                    <span className="font-black text-lg text-primary">₹{actionModal.registration.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/20">
                  <div className="space-y-1">
                    <p className="label-tech">Payment Method</p>
                    <p className="text-sm font-medium text-on-surface">{actionModal.registration.paymentMethod || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="label-tech">Payment Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      actionModal.registration.paymentStatus === 'PAID' ? 'bg-primary/10 text-primary' :
                      actionModal.registration.paymentStatus === 'PARTIAL' ? 'bg-secondary/10 text-secondary' :
                      'bg-surface-bright text-muted-foreground'
                    }`}>
                      {actionModal.registration.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border/40">
                <button onClick={() => setActionModal({ isOpen: false })} className="w-full py-2.5 bg-surface-container rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-bright border border-border/50 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

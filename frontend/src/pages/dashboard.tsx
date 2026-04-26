import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Calendar,
  Users,
  DollarSign,
  Box,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Zap,
  Clock,
  User,
  Clipboard,
} from "lucide-react";
import api from "@/lib/api";
import { exportBrandedExcel, exportCSV } from '@/utils/brandedExcel';
import ProtectedRoute from "@/lib/protected-route";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { PageSkeleton } from "@/components/PageSkeleton";
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

/* ===================== TYPES ===================== */

interface KpiCards {
  totalEvents: number;
  clubsRegistered: number;
  ridersRegistered: number;
  horseCount: number;
  totalRevenue: number;
  collectibleAmount: number;
  receivableAmount: number;
}

interface EventChartData {
  eventId: string;
  eventName: string;
  startDate: string;
  unpaidRegistrations: number;
  totalRiders: number;
  totalHorses: number;
}

interface EventListItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venueAddress?: string;
  venueName?: string;
  eventType?: string;
  isPublished?: boolean;
}

interface ParticipantRow {
  id: string;
  eventName: string;
  eventId: string;
  eventDate: string;
  riderName: string;
  clubName: string;
  horseName: string;
  eventCategory: string;
  categoryId: string;
  price: number;
  paymentMethod: string;
  paymentStatus: string;
}

interface FilterOption {
  id: string;
  name: string;
}

/* ===================== UTILITY: Export helpers ===================== */


/* ===================== CUSTOM CHART TOOLTIP ===================== */

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-on-surface"
      style={{
        background: "hsl(var(--surface-container))",
        border: "1px solid hsl(var(--border)/0.4)",
      }}
    >
      <p className="font-semibold text-sm mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

/* ===================== BENTO CARD: Revenue Hero ===================== */

/* ===================== BENTO CARD: Stat ===================== */

function BentoStatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  loading,
  animClass,
}: {
  icon: React.ComponentType<any>;
  title: string;
  value: string | number;
  subtitle?: string;
  loading?: boolean;
  animClass?: string;
}) {
  return (
    <div
      className={`h-full bento-card p-5 flex flex-col justify-between group hover:border-primary/25 transition-colors duration-300 ${animClass || ""}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="text-sm font-semibold text-on-surface">{title}</span>
      </div>
      <div className="mt-auto pt-4">
        <span className="text-3xl font-black text-on-surface tracking-tight leading-none">
          {loading ? "..." : value}
        </span>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

/* ===================== PAGINATION ===================== */

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="w-7 h-7 rounded-full border border-border/50 text-muted-foreground flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-30"
        aria-label="Previous page"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="text-xs font-semibold text-on-surface px-2">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold disabled:opacity-30"
        aria-label="Next page"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

/* ===================== MULTI SELECT ===================== */

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (val: string) => {
    onChange(
      selected.includes(val)
        ? selected.filter((s) => s !== val)
        : [...selected, val],
    );
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm bg-surface-container text-on-surface border border-border/50 hover:border-primary/40 transition-colors cursor-pointer"
      >
        <span>
          {selected.length > 0 ? `${label} (${selected.length})` : label}
        </span>
        <Filter size={14} className="text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1.5 w-full max-h-48 overflow-y-auto rounded-xl shadow-2xl shadow-black/30 bg-surface-low border border-border/60">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted-foreground">
              No options
            </div>
          ) : (
            options.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-4 py-2.5 cursor-pointer text-sm text-on-surface transition-colors hover:bg-surface-container"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className="rounded accent-primary"
                />
                {opt.label}
              </label>
            ))
          )}
          <div className="p-2 flex gap-2 border-t border-border/30">
            <button
              type="button"
              onClick={() => {
                onChange([]);
                setOpen(false);
              }}
              className="text-xs text-muted-foreground hover:text-on-surface transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs ml-auto text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== SECTION SPINNER ===================== */

function SectionSpinner({ label }: { label?: string }) {
  if (label === "events") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-44 bg-border/20" />
            <Skeleton className="h-3 w-28 bg-border/15" />
            <Skeleton className="h-1.5 w-full rounded-full bg-border/15" />
          </div>
        ))}
      </div>
    );
  }

  if (label === "participants") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-xl bg-surface-container/50 p-2.5"
          >
            <Skeleton className="h-8 w-8 rounded-lg bg-border/20" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32 bg-border/20" />
              <Skeleton className="h-3 w-44 bg-border/15" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full bg-border/20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-end gap-3 pt-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex-1 space-y-2">
          <Skeleton
            className="w-full rounded-t-2xl bg-border/20"
            style={{ height: `${120 + (index % 3) * 45}px` }}
          />
          <Skeleton className="mx-auto h-3 w-16 bg-border/15" />
        </div>
      ))}
    </div>
  );
}

/* ===================== MAIN DASHBOARD ===================== */

function DashboardContent() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const eventsCacheRef = useRef(
    new Map<string, { events: EventListItem[]; count: number; pages: number }>(),
  );
  const participantsCacheRef = useRef(
    new Map<string, { data: ParticipantRow[]; count: number; pages: number }>(),
  );
  const kpiCacheRef = useRef(
    new Map<
      string,
      {
        kpiCards: KpiCards;
        eventBreakdown: EventChartData[];
        events: FilterOption[];
        categories: FilterOption[];
      }
    >(),
  );

  const [kpiCards, setKpiCards] = useState<KpiCards>({
    totalEvents: 0,
    clubsRegistered: 0,
    ridersRegistered: 0,
    horseCount: 0,
    totalRevenue: 0,
    collectibleAmount: 0,
    receivableAmount: 0,
  });
  const [eventChartData, setEventChartData] = useState<EventChartData[]>([]);
  const [selectedChartEvent, setSelectedChartEvent] = useState<string>("");

  const [events, setEvents] = useState<EventListItem[]>([]);
  const [eventTab, setEventTab] = useState<"current" | "all">("current");
  const [eventPage, setEventPage] = useState(1);
  const [eventTotalPages, setEventTotalPages] = useState(1);
  const [allEventCount, setAllEventCount] = useState<number | null>(null);

  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [participantPage, setParticipantPage] = useState(1);
  const [participantTotalPages, setParticipantTotalPages] = useState(1);
  const [participantCount, setParticipantCount] = useState(0);

  const [filterMonths, setFilterMonths] = useState<string[]>([]);
  const [filterEvents, setFilterEvents] = useState<string[]>([]);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterPayment, setFilterPayment] = useState<string[]>([]);
  const [participantSearch, setParticipantSearch] = useState("");

  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set(),
  );

  const [eventOptions, setEventOptions] = useState<FilterOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<FilterOption[]>([]);

  const [mainEventFilter, setMainEventFilter] = useState<string>("");

  const [kpiLoading, setKpiLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKpis = useCallback(async () => {
    const cacheKey = mainEventFilter || "__all__";
    const cached = kpiCacheRef.current.get(cacheKey);
    if (cached) {
      setKpiCards(cached.kpiCards);
      setEventChartData(cached.eventBreakdown);
      setEventOptions(cached.events);
      setCategoryOptions(cached.categories);
      setKpiLoading(false);
      return;
    }

    try {
      setKpiLoading(true);
      const params: any = {};
      if (mainEventFilter) params.eventId = mainEventFilter;
      const res = await api.get("/api/dashboard", { params });
      const data = res.data.data;
      setKpiCards(data.kpiCards);
      setEventChartData(data.charts.eventBreakdown || []);
      setEventOptions(data.filterOptions.events || []);
      setCategoryOptions(data.filterOptions.categories || []);
      kpiCacheRef.current.set(cacheKey, {
        kpiCards: data.kpiCards,
        eventBreakdown: data.charts.eventBreakdown || [],
        events: data.filterOptions.events || [],
        categories: data.filterOptions.categories || [],
      });
    } catch (err) {
      console.error("Failed to fetch KPIs:", err);
      setError("Failed to load dashboard KPIs");
    } finally {
      setKpiLoading(false);
    }
  }, [mainEventFilter]);

  const fetchAllEventCount = useCallback(async () => {
    if (allEventCount !== null) return;

    try {
      const res = await api.get("/api/dashboard/events", {
        params: { tab: "all", page: 1, limit: 1 },
      });
      setAllEventCount(res.data.data?.count || 0);
    } catch (err) {
      console.error("Failed to fetch all events count:", err);
    }
  }, [allEventCount]);

  const fetchEvents = useCallback(async () => {
    const cacheKey = `${eventTab}:${eventPage}`;
    const cached = eventsCacheRef.current.get(cacheKey);
    if (cached) {
      setEvents(cached.events);
      setEventTotalPages(cached.pages);
      if (eventTab === "all") setAllEventCount(cached.count);
      setEventsLoading(false);
      return;
    }

    try {
      setEventsLoading(true);
      const params: any = { tab: eventTab, page: eventPage, limit: 15 };
      const res = await api.get("/api/dashboard/events", { params });
      const data = res.data.data;
      setEvents(data.events || []);
      setEventTotalPages(data.pages || 1);
      if (eventTab === "all") setAllEventCount(data.count || 0);
      eventsCacheRef.current.set(cacheKey, {
        events: data.events || [],
        count: data.count || 0,
        pages: data.pages || 1,
      });
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setEventsLoading(false);
    }
  }, [eventTab, eventPage]);

  const fetchParticipants = useCallback(async () => {
    const cacheKey = JSON.stringify({
      mainEventFilter,
      participantPage,
      filterMonths,
      filterEvents,
      filterCategories,
      filterPayment,
      participantSearch: participantSearch.trim(),
    });
    const cached = participantsCacheRef.current.get(cacheKey);
    if (cached) {
      setParticipants(cached.data);
      setParticipantCount(cached.count);
      setParticipantTotalPages(cached.pages);
      setParticipantsLoading(false);
      return;
    }

    try {
      setParticipantsLoading(true);
      const params: any = { page: participantPage, limit: 20 };
      if (mainEventFilter) params.eventId = mainEventFilter;
      if (filterMonths.length) params.months = filterMonths.join(",");
      if (filterEvents.length) params.events = filterEvents.join(",");
      if (filterCategories.length)
        params.categories = filterCategories.join(",");
      if (filterPayment.length) params.payment = filterPayment.join(",");
      if (participantSearch.trim()) params.search = participantSearch.trim();
      const res = await api.get("/api/dashboard/participants", { params });
      const data = res.data.data;
      setParticipants(data.data || []);
      setParticipantCount(data.count || 0);
      setParticipantTotalPages(data.pages || 1);
      participantsCacheRef.current.set(cacheKey, {
        data: data.data || [],
        count: data.count || 0,
        pages: data.pages || 1,
      });
    } catch (err) {
      console.error("Failed to fetch participants:", err);
    } finally {
      setParticipantsLoading(false);
    }
  }, [
    mainEventFilter,
    participantPage,
    filterMonths,
    filterEvents,
    filterCategories,
    filterPayment,
    participantSearch,
  ]);

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  useEffect(() => {
    void fetchAllEventCount();
  }, [fetchAllEventCount]);
  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const monthOptions = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
      });
      opts.push({ value: val, label });
    }
    return opts;
  }, []);

  const chartDisplayData = useMemo(() => {
    if (selectedChartEvent) {
      return eventChartData.filter((e) => e.eventId === selectedChartEvent);
    }
    return eventChartData;
  }, [eventChartData, selectedChartEvent]);

  const toggleAllParticipants = () => {
    if (selectedParticipants.size === participants.length) {
      setSelectedParticipants(new Set());
    } else {
      setSelectedParticipants(new Set(participants.map((p) => p.id)));
    }
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportParticipantsCSV = () => {
    const headers = [
      "Event Name",
      "Event Date",
      "Rider Name",
      "Club Name",
      "Horse Name",
      "Event Category",
      "Price (₹)",
      "Payment Method",
      "Payment Status",
    ];
    const rows = participants.map((p) => [
      p.eventName,
      new Date(p.eventDate).toLocaleDateString(),
      p.riderName,
      p.clubName,
      p.horseName,
      p.eventCategory,
      p.price,
      p.paymentMethod,
      p.paymentStatus,
    ]);
    exportCSV(headers, rows, 'participants');
  };

  const handleExportParticipantsExcel = () => {
    const headers = [
      "Event Name",
      "Event Date",
      "Rider Name",
      "Club Name",
      "Horse Name",
      "Event Category",
      "Price (₹)",
      "Payment Method",
      "Payment Status",
    ];
    const rows = participants.map((p) => [
      p.eventName,
      new Date(p.eventDate).toLocaleDateString(),
      p.riderName,
      p.clubName,
      p.horseName,
      p.eventCategory,
      p.price,
      p.paymentMethod,
      p.paymentStatus,
    ]);
    void exportBrandedExcel({
      sheetTitle: 'Participants',
      subtitle: 'Participants Report',
      headers,
      rows,
      filename: 'participants',
      columnWidths: [26, 14, 22, 18, 18, 18, 12, 16, 14],
    });
  };

  const handleExportEventsCSV = () => {
    const headers = [
      "Event Name",
      "Start Date",
      "End Date",
      "Venue",
      "Address",
    ];
    const rows = events.map((e) => [
      e.name,
      new Date(e.startDate).toLocaleDateString(),
      new Date(e.endDate).toLocaleDateString(),
      e.venueName || "N/A",
      e.venueAddress || "N/A",
    ]);
    exportCSV(headers, rows, `events-${eventTab}`);
  };

  const handleExportEventsExcel = () => {
    const headers = [
      "Event Name",
      "Start Date",
      "End Date",
      "Venue",
      "Address",
    ];
    const rows = events.map((e) => [
      e.name,
      new Date(e.startDate).toLocaleDateString(),
      new Date(e.endDate).toLocaleDateString(),
      e.venueName || "N/A",
      e.venueAddress || "N/A",
    ]);
    void exportBrandedExcel({
      sheetTitle: 'Events',
      subtitle: 'Events Report',
      headers,
      rows,
      filename: `events-${eventTab}`,
      columnWidths: [28, 14, 14, 20, 28],
    });
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const paymentBadge = (status: string) => {
    const map: Record<string, string> = {
      PAID: "badge-emerald",
      PARTIAL: "badge-warning",
      CANCELLED: "badge-danger",
      UNPAID: "badge-muted",
    };
    return map[status] || "badge-muted";
  };

  const isInitialPageLoading =
    kpiLoading &&
    eventsLoading &&
    participantsLoading &&
    eventChartData.length === 0 &&
    events.length === 0 &&
    participants.length === 0 &&
    !error;

  if (isInitialPageLoading) {
    return (
      <ProtectedRoute>
        <Head>
          <title>Dashboard | Equestrian Events</title>
        </Head>
        <BoneyardSkeleton name="dashboard" loading={true}>
          <PageSkeleton variant="dashboard" />
        </BoneyardSkeleton>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Dashboard | Equestrian Events</title>
      </Head>
      <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
        {/* Header + Main Event Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl lg:text-5xl">
              Command <span className="gradient-text">Center</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Real-time platform analytics and event intelligence.
            </p>
          </div>
          <div className="w-full md:w-72">
            <Select
              value={mainEventFilter || "__all__"}
              onValueChange={(v) => {
                setMainEventFilter(v === "__all__" ? "" : v);
                setParticipantPage(1);
              }}
            >
              <SelectTrigger className="bg-surface-container border-border/30">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Events</SelectItem>
                {eventOptions.map((ev) => (
                  <SelectItem key={ev.id} value={ev.id}>
                    {ev.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm font-medium bg-destructive/10 border border-destructive/30 text-destructive">
            {error}
          </div>
        )}

        {/* ═══════ BENTO GRID: TOP SECTION ═══════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {/* Col 1 Row 1 — Total Events */}
          <div className="lg:col-start-1 lg:row-start-1 min-h-[160px] animate-slide-up-2">
            <BentoStatCard
              icon={Calendar}
              title="Total Events"
              value={kpiCards.totalEvents}
              subtitle="Active & Completed"
              loading={kpiLoading}
            />
          </div>

          {/* Col 2 Row 1 — Horse Count */}
          <div className="lg:col-start-2 lg:row-start-1 min-h-[160px] animate-slide-up-3">
            <BentoStatCard
              icon={Box}
              title="Horse Count"
              value={kpiCards.horseCount}
              subtitle="Total registered horses"
              loading={kpiLoading}
            />
          </div>

          {/* Col 3 Rows 1-2 — Event Stats Chart (row-span-2) */}
          <div className="lg:col-start-3 lg:row-start-1 lg:row-span-2 min-h-[340px] lg:min-h-0 animate-slide-up-3">
            <div className="h-full bento-card p-5 flex flex-col group hover:border-primary/25 transition-colors duration-300">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-on-surface">
                  Event Stats
                </h3>
                <button className="w-8 h-8 rounded-full border border-border/50 flex items-center justify-center hover:bg-surface-container transition-colors">
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="mt-1 mb-3">
                <Select
                  value={selectedChartEvent || "__all__"}
                  onValueChange={(v) =>
                    setSelectedChartEvent(v === "__all__" ? "" : v)
                  }
                >
                  <SelectTrigger className="bg-surface-container/50 border-border/30 h-8 text-xs">
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Events</SelectItem>
                    {eventChartData.map((ev) => (
                      <SelectItem key={ev.eventId} value={ev.eventId}>
                        {ev.eventName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {kpiLoading ? (
                <SectionSpinner />
              ) : chartDisplayData.length > 0 ? (
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartDisplayData}
                      barCategoryGap="25%"
                      barSize={20}
                    >
                      <defs>
                        <linearGradient
                          id="gradUnpaid"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="hsl(0,85%,60%)"
                            stopOpacity={1}
                          />
                          <stop
                            offset="100%"
                            stopColor="hsl(0,70%,45%)"
                            stopOpacity={0.7}
                          />
                        </linearGradient>
                        <linearGradient
                          id="gradRiders"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="hsl(145,63%,55%)"
                            stopOpacity={1}
                          />
                          <stop
                            offset="100%"
                            stopColor="hsl(145,50%,38%)"
                            stopOpacity={0.7}
                          />
                        </linearGradient>
                        <linearGradient
                          id="gradHorses"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="hsl(253,90%,73%)"
                            stopOpacity={0.95}
                          />
                          <stop
                            offset="100%"
                            stopColor="hsl(253,55%,48%)"
                            stopOpacity={0.6}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsla(224,20%,30%,0.15)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="eventName"
                        hide
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "hsl(224,15%,55%)", fontSize: 10 }}
                        allowDecimals={false}
                        width={28}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                        iconType="circle"
                        iconSize={8}
                      />
                      <Bar
                        dataKey="unpaidRegistrations"
                        fill="url(#gradUnpaid)"
                        name="Unpaid"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="totalRiders"
                        fill="url(#gradRiders)"
                        name="Riders"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="totalHorses"
                        fill="url(#gradHorses)"
                        name="Horses"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No event data</p>
                </div>
              )}
            </div>
          </div>

          {/* Cols 1-2 Row 2 — Clubs | Riders */}
          <div className="lg:col-start-1 lg:col-span-2 lg:row-start-2 min-h-[120px] animate-slide-up-2">
            <BentoStatCard
              icon={Users}
              title="Clubs | Riders"
              value={`${kpiCards.clubsRegistered} | ${kpiCards.ridersRegistered}`}
              subtitle="Registered entities"
              loading={kpiLoading}
            />
          </div>
        </div>

        {/* ═══════ BOTTOM GRID: Events + Participants + Quick Actions ═══════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
          {/* Events Table Card */}
          <div className="animate-slide-up-3">
            <div className="bento-card p-5 group hover:border-primary/20 transition-colors duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-on-surface">Events</h3>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportEventsCSV}
                      className="w-7 h-7 rounded-full border border-border/50 flex items-center justify-center hover:bg-surface-container transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>

              {/* Tab toggles */}
              <div className="flex gap-1 rounded-xl p-1 mb-4 bg-surface-container border border-border/30">
                <button
                  onClick={() => {
                    setEventTab("current");
                    setEventPage(1);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${eventTab === "current" ? "btn-cta shadow-none" : "text-muted-foreground hover:text-on-surface hover:bg-surface-bright"}`}
                >
                  Current
                </button>
                <button
                  onClick={() => {
                    setEventTab("all");
                    setEventPage(1);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${eventTab === "all" ? "btn-cta shadow-none" : "text-muted-foreground hover:text-on-surface hover:bg-surface-bright"}`}
                >
                  All{allEventCount !== null ? ` (${allEventCount})` : ""}
                </button>
              </div>

              {eventsLoading ? (
                <SectionSpinner label="events" />
              ) : events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No events found
                </p>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 5).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => router.push(`/events/${ev.id}`)}
                      className="cursor-pointer group/item"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-on-surface group-hover/item:text-primary transition-colors truncate">
                          {ev.name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(ev.startDate)} — {formatDate(ev.endDate)}
                      </p>
                      <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-surface-container">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-700"
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!eventsLoading && events.length > 0 && (
                <div className="mt-4 inline-flex items-center gap-1.5 bg-primary/12 text-primary text-[11px] font-bold px-3 py-1.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  {events.length} event{events.length !== 1 ? "s" : ""}
                </div>
              )}
              {!eventsLoading && (
                <Pagination
                  page={eventPage}
                  totalPages={eventTotalPages}
                  onPageChange={setEventPage}
                />
              )}
            </div>
          </div>

          {/* Participants Schedule Card */}
          <div className="animate-slide-up-4">
            <div className="bento-card p-5 group hover:border-primary/20 transition-colors duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-on-surface">
                  Participants
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {participantCount} total
                  </span>
                  {isAdmin && (
                    <button
                      onClick={handleExportParticipantsCSV}
                      className="w-7 h-7 rounded-full border border-border/50 flex items-center justify-center hover:bg-surface-container transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {participantsLoading ? (
                <SectionSpinner label="participants" />
              ) : participants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No participants found
                </p>
              ) : (
                <div className="space-y-3">
                  {participants.slice(0, 6).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl transition-colors duration-200 bg-surface-container/50 hover:bg-surface-container"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0 bg-surface-bright/50">
                        🏇
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">
                          {p.riderName}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {p.eventName} · {p.horseName}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span
                          className={`badge text-[10px] ${paymentBadge(p.paymentStatus)}`}
                        >
                          {p.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!participantsLoading && (
                <Pagination
                  page={participantPage}
                  totalPages={participantTotalPages}
                  onPageChange={setParticipantPage}
                />
              )}
            </div>
          </div>

          {/* Quick Actions + Tip Card Column */}
          <div className="space-y-3 lg:space-y-4 animate-slide-up-5">
            {/* AI Tip */}
            <div className="bento-card p-4 flex items-center gap-3 group hover:border-secondary/30 transition-colors duration-300">
              <div
                className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                style={{
                  background:
                    "linear-gradient(135deg,hsl(253,90%,73%,0.35),hsl(253,50%,50%,0.2))",
                }}
              >
                <Zap className="w-5 h-5 text-secondary" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Manage your platform from the{" "}
                <span className="text-on-surface font-semibold">
                  Command Center
                </span>
                .
              </p>
            </div>

            {/* Quick Actions / Continue */}
            <div className="bento-card p-5 group hover:border-primary/20 transition-colors duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-on-surface">
                  Continue Actions
                </h3>
                <button className="w-8 h-8 rounded-full border border-border/50 flex items-center justify-center hover:bg-surface-container transition-colors">
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    name: "Manage Events",
                    sub: `${kpiCards.totalEvents} events registered`,
                    pct: 100,
                    icon: Calendar,
                    href: "/events",
                  },
                  {
                    name: "Review Registrations",
                    sub: "Pending approvals",
                    pct: 60,
                    icon: Clipboard,
                    href: "/registrations/approvals",
                  },
                  {
                    name: "Financial Reports",
                    sub: "Revenue tracking",
                    pct: 45,
                    icon: DollarSign,
                    href: "/reports",
                  },
                ].map((item) => (
                  <div
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer group/item transition-colors duration-200 bg-surface-container/50 hover:bg-surface-container"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform duration-200 bg-surface-bright/50">
                      <item.icon className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate group-hover/item:text-primary transition-colors">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {item.sub}
                      </p>
                      <div className="mt-2 h-1 rounded-full overflow-hidden bg-surface-bright/60">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-700"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {item.pct}%
                      </span>
                      <button className="btn-cta text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-0.5">
                        Go <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function Dashboard() {
  return (
    <BoneyardSkeleton name="dashboard-page" loading={false}>
      <DashboardContent />
    </BoneyardSkeleton>
  );
}

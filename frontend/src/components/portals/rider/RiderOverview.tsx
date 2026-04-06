
import { Trophy, Settings, Activity, Calendar, ArrowUpRight, Zap, Clock, ChevronRight } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { KPICard } from "@/components/dashboard/KPICard";

interface RiderOverviewProps {
  demoData: {
    registrations: any[];
    horses: any[];
    events: any[];
  };
}

const RIDER_STARS = [
  [8, 12], [15, 38], [25, 60], [33, 20], [44, 75], [54, 44], [65, 8], [74, 65], [20, 85], [30, 30], [40, 52], [50, 70], [60, 25], [70, 48], [10, 78],
];

const riderMonthlyRegs = [
  { month: "Oct", v: 0 },
  { month: "Nov", v: 1 },
  { month: "Dec", v: 1 },
  { month: "Jan", v: 2 },
  { month: "Feb", v: 2 },
  { month: "Mar", v: 3, active: true },
];

const RiderChartTip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-on-surface"
      style={{ background: "hsl(var(--surface-container))", border: "1px solid hsl(var(--border)/0.4)" }}>
      {payload[0].value}
    </div>
  );
};

export const RiderOverview = ({ demoData }: RiderOverviewProps) => {
  const { registrations, horses, events } = demoData;

  const approvedCount = registrations.filter(r => r.approvalStatus === "APPROVED").length;
  const pendingCount = registrations.filter(r => r.approvalStatus === "PENDING").length;
  const seasonScore = Math.round((approvedCount / registrations.length) * 100);
  const paidAmt = registrations.filter(r => r.paymentStatus === "PAID").reduce((s, r) => s + r.entryFee, 0);
  const unpaidAmt = registrations.filter(r => r.paymentStatus !== "PAID" && r.paymentStatus !== "CANCELLED").reduce((s, r) => s + r.entryFee, 0);
  const paymentRate = Math.round((paidAmt / (paidAmt + unpaidAmt)) * 100);

  const regStatusData = [
    { name: "Approved", value: approvedCount, color: "hsl(var(--primary))" },
    { name: "Pending", value: pendingCount, color: "hsl(253,90%,73%)" },
  ];
  const paymentBars = [
    { name: "Paid", value: +(paidAmt / 1000).toFixed(1), fill: "hsl(var(--primary))" },
    { name: "Unpaid", value: +(unpaidAmt / 1000).toFixed(1), fill: "hsl(253,65%,58%)" },
  ];

  return (
    <div className="space-y-4 lg:space-y-6 animate-fade-in pb-12">
      {/* ── KPI Grid ──────────────────────────────────────────────────────── */}
      <KPIGrid cols={4}>
        <KPICard
          title="Season Score"
          value={`${seasonScore}%`}
          subValue="Approval Rate"
          icon={Trophy}
          trend={{ value: "8%", isUp: true }}
          variant="primary"
          className="animate-slide-up-1"
        />
        <KPICard
          title="Payment Rate"
          value={`${paymentRate}%`}
          subValue="Fees • Season"
          icon={Settings}
          className="animate-slide-up-2"
        />
        <KPICard
          title="My Horses"
          value={String(horses.length)}
          subValue="Registered horses"
          icon={Activity}
          className="animate-slide-up-3"
        />
        <KPICard
          title="Upcoming Events"
          value={String(events.length)}
          subValue="Open season"
          icon={Calendar}
          className="animate-slide-up-4"
        />
      </KPIGrid>

      {/* ── Charts & Insights ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Registration Status Donut */}
        <div className="lg:col-span-1 animate-slide-up-1">
          <div className="h-full bento-card p-5 flex flex-col group hover:border-primary/25 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest opacity-70">Status Map</h3>
              <div className="w-8 h-8 rounded-full border border-border/50 flex items-center justify-center hover:bg-surface-container transition-colors">
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center py-4">
              <div className="relative" style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={regStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                      dataKey="value" strokeWidth={4} stroke="hsl(var(--surface-low))"
                      startAngle={90} endAngle={-270}>
                      {regStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-on-surface">{registrations.length}</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Total</span>
                </div>
              </div>
            </div>
            <div className="space-y-3 mt-4 pt-4 border-t border-border/20">
              {regStatusData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cosmic Payment Insight */}
        <div className="lg:col-span-1 animate-slide-up-2">
          <div className="h-full rounded-2xl relative overflow-hidden flex flex-col p-6"
            style={{
              background: "linear-gradient(145deg, hsl(253,38%,16%) 0%, hsl(253,28%,11%) 55%, hsl(253,48%,9%) 100%)",
              border: "1px solid hsl(253,45%,28%,0.4)",
              boxShadow: "0 12px 40px -12px hsla(253,90%,73%,0.25)",
            }}>
            <div className="absolute inset-0 stripe-pattern opacity-[0.12] pointer-events-none" />
            {RIDER_STARS.map(([top, left], i) => (
              <div key={i} className="absolute rounded-full bg-white pointer-events-none"
                style={{ top: `${top}%`, left: `${left}%`, width: i % 4 === 0 ? 3 : 2, height: i % 4 === 0 ? 3 : 2, opacity: 0.15 + (i % 3) * 0.1 }} />
            ))}
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Financial Hub</h3>
                <div className="text-[10px] text-white/70 bg-white/10 rounded-full px-3 py-1 border border-white/15 backdrop-blur-md">Season '25</div>
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-black text-secondary tracking-tighter leading-none">₹{(paidAmt / 1000).toFixed(0)}k</span>
                <span className="text-xs text-white/40 font-bold uppercase">Settled</span>
              </div>
              <div className="rounded-xl p-4 mb-6"
                style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="text-[10px] text-white/40 mb-1 font-bold uppercase tracking-wide">Pending Dues</p>
                <span className="text-2xl font-black text-white tracking-tight">₹{(unpaidAmt / 1000).toFixed(0)}k</span>
              </div>
              <div className="mt-auto h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentBars} barSize={28}>
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 8 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<RiderChartTip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="v" radius={[6, 6, 0, 0]}>
                      {paymentBars.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Action Center & Tips */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <div className="bento-card p-5 flex items-center gap-4 group hover:border-secondary/30 transition-all border-beam rounded-2xl">
            <div className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-500"
              style={{ background: "linear-gradient(135deg,hsl(253,90%,73%,0.3),hsl(253,50%,50%,0.1))" }}>
              <Zap className="w-6 h-6 text-secondary animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface">Priority Action Required</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Clear your pending <span className="text-on-surface font-black">EPL Grand Prix payment</span> by end of week to maintain eligibility.
              </p>
            </div>
            <button className="btn-cta px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap">Pay Now</button>
          </div>

          <div className="bento-card p-5 group hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest opacity-70">Active Queue</h3>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-border/40 text-[10px] font-bold text-muted-foreground uppercase">
                <Clock className="w-3 h-3" /> Real-time
              </div>
            </div>
            <div className="space-y-3">
              {[
                { name: "EPL Grand Prix Payment", sub: "₹12,000 pending • REG00002", pct: 50, icon: "💳" },
                { name: "Spring Derby Approval", sub: "Awaiting organizer review", pct: 25, icon: "📋" },
                { name: "Register for EIRS Show", sub: "Closing in 6 days", pct: 0, icon: "🐴" },
              ].map((item, i) => (
                <div key={item.name}
                  className={cn("flex items-center gap-4 p-4 rounded-2xl cursor-pointer group/item transition-all hover:bg-surface-bright border border-transparent hover:border-border/30", `animate-slide-up-${i + 1}`)}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover/item:scale-110 transition-all duration-300 shadow-inner"
                    style={{ background: "hsl(var(--surface-container))" }}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-on-surface truncate group-hover/item:text-primary transition-colors">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{item.sub}</p>
                    <div className="mt-2.5 h-1.5 rounded-full overflow-hidden bg-surface-container shadow-inner">
                      <div className="h-full rounded-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-[10px] font-black text-muted-foreground">{item.pct}%</span>
                    <button className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all group-hover/item:shadow-lg">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

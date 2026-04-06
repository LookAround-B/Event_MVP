
import { Users, Activity, ClipboardList, DollarSign, ArrowUpRight, Clock, ChevronRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from "recharts";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { KPICard } from "@/components/dashboard/KPICard";
import { cn } from "@/lib/utils";

interface ClubOverviewProps {
  demoData: {
    riders: any[];
    horses: any[];
    registrations: any[];
  };
}

const clubMonthlyRev = [
  { month: "Oct", rev: 45000 },
  { month: "Nov", rev: 52000 },
  { month: "Dec", rev: 48000 },
  { month: "Jan", rev: 61000 },
  { month: "Feb", rev: 85000 },
  { month: "Mar", rev: 92000 },
];

export const ClubOverview = ({ demoData }: ClubOverviewProps) => {
  const { riders, horses, registrations } = demoData;

  const totalRev = registrations.reduce((s, r) => s + r.totalFee, 0);
  const pendingRev = registrations.filter(r => r.paymentStatus !== "PAID").reduce((s, r) => s + r.totalFee, 0);
  const collectionRate = Math.round(((totalRev - pendingRev) / totalRev) * 100);

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in pb-12">
      {/* ── KPI Grid ──────────────────────────────────────────────────────── */}
      <KPIGrid cols={4}>
        <KPICard
          title="Active Riders"
          value={String(riders.filter(r => r.isActive).length)}
          subValue="Registered members"
          icon={Users}
          variant="primary"
          className="animate-slide-up-1"
        />
        <KPICard
          title="Stable Count"
          value={String(horses.length)}
          subValue="Authorized horses"
          icon={Activity}
          className="animate-slide-up-2"
        />
        <KPICard
          title="Live Registrations"
          value={String(registrations.length)}
          subValue="Active circuit"
          icon={ClipboardList}
          className="animate-slide-up-3"
        />
        <KPICard
          title="Collection Rate"
          value={`${collectionRate}%`}
          subValue="Revenue Efficiency"
          icon={DollarSign}
          trend={{ value: "12%", isUp: true }}
          className="animate-slide-up-4"
        />
      </KPIGrid>

      {/* ── Charts & Insights ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Revenue Growth Area Chart */}
        <div className="lg:col-span-2 animate-slide-up-1">
          <div className="h-full bento-card p-6 flex flex-col group hover:border-primary/25 transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest opacity-70">Revenue Trajectory</h3>
                <p className="text-[10px] text-muted-foreground mt-1 font-bold">Monthly aggregate from registrations</p>
              </div>
              <div className="flex items-center gap-2">
                 <div className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Market Leading</div>
              </div>
            </div>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={clubMonthlyRev} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="clubRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border)/0.5)", background: "hsl(var(--surface-container))", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)" }}
                    itemStyle={{ fontSize: "12px", fontWeight: 800, color: "hsl(var(--on-surface))" }}
                    labelStyle={{ fontSize: "10px", fontWeight: 900, marginBottom: "4px", opacity: 0.5, textTransform: "uppercase" }}
                  />
                  <Area type="monotone" dataKey="rev" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#clubRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Operational Efficiency / Recent Actions */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bento-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group border-beam">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 rounded-3xl bg-secondary/10 flex items-center justify-center text-secondary mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                <DollarSign className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-black text-on-surface uppercase tracking-tight">Pending Settlement</h4>
              <p className="text-4xl font-black text-on-surface mt-2 tracking-tighter">₹{(pendingRev / 1000).toFixed(1)}k</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1 tracking-widest opacity-60">Overdue Collectibles</p>
              <button className="mt-6 w-full py-3 bg-secondary text-secondary-foreground rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-secondary/20 transition-all active:scale-95">Initiate Collections</button>
           </div>

           <div className="bento-card p-6">
              <h4 className="text-xs font-black text-on-surface uppercase tracking-widest opacity-50 mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Priority Actions
              </h4>
              <div className="space-y-4">
                 {[
                   { label: "New Rider Approval", sub: "Sunita Rao • Pending EFI", icon: "👤", color: "bg-primary/10 text-primary" },
                   { label: "Unpaid Registrations", sub: "2 entries • ₹27,000", icon: "📋", color: "bg-secondary/10 text-secondary" },
                 ].map((action, i) => (
                   <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-container/50 transition-all group/item cursor-pointer border border-transparent hover:border-border/20">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 group-hover/item:scale-110 transition-transform", action.color)}>
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-xs font-black text-on-surface truncate">{action.label}</p>
                         <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{action.sub}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-all translate-x-1 group-hover/item:translate-x-0" />
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

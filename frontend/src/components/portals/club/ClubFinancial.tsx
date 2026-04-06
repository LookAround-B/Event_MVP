
import { useState } from "react";
import { DollarSign, ArrowUpRight, TrendingUp, CreditCard, Clock, CheckCircle2, ChevronRight, Calculator, FileText } from "lucide-react";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { KPICard } from "@/components/dashboard/KPICard";
import { cn } from "@/lib/utils";

interface ClubFinancialProps {
  demoRegistrations: any[];
}

export const ClubFinancial = ({ demoRegistrations }: ClubFinancialProps) => {
  const [viewDetail, setViewDetail] = useState(false);

  const totalRev = demoRegistrations.reduce((s, r) => s + r.totalFee, 0);
  const paidRev = demoRegistrations.filter(r => r.paymentStatus === "PAID").reduce((s, r) => s + r.totalFee, 0);
  const pendingRev = totalRev - paidRev;
  const collectionRate = Math.round((paidRev / totalRev) * 100);

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in pb-12">
      {/* ── KPI Grid ──────────────────────────────────────────────────────── */}
      <KPIGrid cols={3}>
        <KPICard
          title="Total Gross Revenue"
          value={`₹${(totalRev / 1000).toFixed(1)}k`}
          subValue="Season aggregate"
          icon={DollarSign}
          variant="primary"
          className="animate-slide-up-1"
        />
        <KPICard
          title="Collections Rate"
          value={`${collectionRate}%`}
          subValue="Payment Efficiency"
          icon={TrendingUp}
          trend={{ value: "12%", isUp: true }}
          className="animate-slide-up-2"
        />
        <KPICard
          title="Pending Dues"
          value={`₹${(pendingRev / 1000).toFixed(1)}k`}
          subValue="Awaiting Settlement"
          icon={Clock}
          className="animate-slide-up-3"
        />
      </KPIGrid>

      {/* ── Financial Ledger ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Settlement Summary */}
        <div className="lg:col-span-1 space-y-6 animate-slide-up-1">
           <div className="bento-card p-6 flex flex-col relative overflow-hidden group border-beam">
              <h3 className="text-xs font-black text-on-surface uppercase tracking-widest opacity-50 mb-6">Settlement Health</h3>
              <div className="flex-1 flex flex-col items-center justify-center py-6">
                 <div className="w-32 h-32 rounded-full border-[8px] border-surface-container flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-[8px] border-primary border-t-transparent animate-spin-slow rotate-45" style={{ opacity: collectionRate / 100 }} />
                    <span className="text-3xl font-black text-on-surface">{collectionRate}%</span>
                 </div>
                 <p className="text-[10px] text-muted-foreground font-black uppercase mt-6 tracking-widest">Optimized Collection</p>
              </div>
              <div className="mt-8 space-y-3 pt-4 border-t border-border/10">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Paid Aggregate</span>
                    <span className="text-sm font-black text-primary">₹{(paidRev / 1000).toFixed(1)}k</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60">System Overdue</span>
                    <span className="text-sm font-black text-secondary">₹{(pendingRev / 1000).toFixed(1)}k</span>
                 </div>
              </div>
           </div>

           <div className="bento-card p-6 group hover:border-primary/20 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-5 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <Calculator className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-on-surface uppercase tracking-tight">Fee Estimation</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1 opacity-70">Projected seasonal management fees based on current unit activity and EFI benchmarks.</p>
           </div>
        </div>

        {/* Detailed Transactions */}
        <div className="lg:col-span-3 space-y-6 animate-slide-up-2">
           <div className="bento-card p-6 flex items-center justify-between gap-4 border-primary/20 bg-primary/[0.02]">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center text-primary shadow-inner">
                    <CreditCard className="w-6 h-6" />
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-on-surface uppercase tracking-tight">Primary Settlement Account</h4>
                    <p className="text-[10px] text-muted-foreground/60 font-black uppercase mt-0.5 tracking-widest">Master Node • **** 4592</p>
                 </div>
              </div>
              <button className="px-5 py-2.5 bg-surface-container rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface hover:bg-surface-bright transition-all border border-border/40 shadow-sm active:scale-95">Update Protocol</button>
           </div>

           <div className="bento-card overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-border/10">
                 <h3 className="text-sm font-black text-on-surface uppercase tracking-widest opacity-70 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Settlement Log
                 </h3>
                 <div className="flex bg-surface-container p-1 rounded-xl border border-border/30">
                    <button onClick={() => setViewDetail(false)} className={cn("px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all", !viewDetail ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-on-surface")}>Unit Summary</button>
                    <button onClick={() => setViewDetail(true)} className={cn("px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all", viewDetail ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-on-surface")}>Audit Log</button>
                 </div>
              </div>
              <div className="p-0">
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-surface-container/20">
                          <th className="p-4 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Log ID</th>
                          <th className="p-4 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Entity</th>
                          <th className="p-4 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Allocation</th>
                          <th className="p-4 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Status</th>
                          <th className="p-4 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/10">
                        {demoRegistrations.map((reg, i) => (
                          <tr key={reg.id} className={cn("group hover:bg-surface-container/30 transition-all duration-300", `animate-slide-up-${(i % 5) + 1}`)}>
                            <td className="p-4">
                              <span className="font-mono text-[9px] font-black text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">{reg.eId}</span>
                            </td>
                            <td className="p-4">
                              <p className="text-xs font-black text-on-surface">{reg.riderName}</p>
                              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight opacity-40">{reg.eventName}</p>
                            </td>
                            <td className="p-4">
                              <span className="font-mono text-xs font-black text-on-surface opacity-80">₹{reg.totalFee.toLocaleString("en-IN")}</span>
                            </td>
                            <td className="p-4">
                               <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-black tracking-widest uppercase border border-transparent", 
                                 reg.paymentStatus === "PAID" ? "bg-primary/10 text-primary border-primary/20 shadow-sm" : "bg-destructive/10 text-destructive border-destructive/20")}>
                                  {reg.paymentStatus === "PAID" ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                  {reg.paymentStatus}
                               </div>
                            </td>
                            <td className="p-4 text-right">
                               <span className="font-mono text-[9px] text-muted-foreground font-black opacity-40">{reg.registrationDate}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

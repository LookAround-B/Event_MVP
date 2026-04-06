
import { useState } from "react";
import { Plus, Check, ClipboardList, Clock, ShieldCheck, CreditCard, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PortalModal } from "@/components/portals/PortalModal";

interface Registration {
  id: number; eId: string; eventName: string; categoryName: string;
  riderName: string; horseName: string; totalFee: number;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "CANCELLED";
  registrationDate: string;
}

interface ClubRegistrationsProps {
  demoRegistrations: Registration[];
}

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5 font-bold uppercase tracking-widest text-muted-foreground ml-1">
    <label className="text-[10px]">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const Sel = ({ children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...rest}
    className="w-full px-4 py-3 rounded-xl bg-surface-container/50 border border-border/40 text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all appearance-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
    {children}
  </select>
);

const approvalBadge = (s: string) => {
  switch (s) {
    case "APPROVED": return "bg-primary/10 text-primary border-primary/20 shadow-sm";
    case "REJECTED": return "bg-destructive/10 text-destructive border-destructive/20";
    default: return "bg-secondary/10 text-secondary border-secondary/20 shadow-sm";
  }
};

const paymentBadge = (s: string) => {
  switch (s) {
    case "PAID": return "bg-primary/10 text-primary border-primary/20 shadow-sm";
    case "UNPAID": return "bg-destructive/10 text-destructive border-destructive/20";
    case "PARTIAL": return "bg-secondary/10 text-secondary border-secondary/20 shadow-sm";
    default: return "bg-surface-bright/50 text-muted-foreground border-border/20";
  }
};

export const ClubRegistrations = ({ demoRegistrations }: ClubRegistrationsProps) => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in pb-12">
      {/* ── Header Area ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-on-surface tracking-tight">Active <span className="gradient-text">Circuit</span></h2>
          <p className="text-xs text-muted-foreground font-medium mt-1">Audit and authorize member competition entries and unit payments.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2.5 px-6 py-3 btn-cta rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> Initialize Entry
        </button>
      </div>

      {/* ── Form Modal ────────────────────────────────────────── */}
      <PortalModal 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        title="Authorize Competition Entry"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <Field label="Rider Selection" required>
            <Sel><option>Select Unit Athlete</option><option>Sunita Rao</option><option>Arjun Mehta</option></Sel>
          </Field>
          <Field label="Equine Asset" required>
            <Sel><option>Select Stable Asset</option><option>Thunder</option><option>Silver</option></Sel>
          </Field>
          <Field label="Target Event" required>
             <Sel><option>Select Event</option><option>EIRS Regional Show</option></Sel>
          </Field>
          <Field label="Division / Category" required>
             <Sel><option>Select Class</option><option>Show Jumping A</option><option>Dressage Open</option></Sel>
          </Field>
        </div>

        <div className="flex gap-4 mt-12 pt-8 border-t border-white/5">
          <button onClick={() => setShowForm(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-[11px] font-black uppercase tracking-widest text-on-surface hover:bg-white/10 transition-all border border-white/5">Abort Calibration</button>
          <button onClick={() => setShowForm(false)} className="flex-1 py-4 btn-cta rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
            <Check className="w-5 h-5 font-black" /> Commit Entry
          </button>
        </div>
      </PortalModal>

      {/* ── Registration Table ────────────────────────────────────────────────── */}
      <div className="bento-card overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[950px] border-collapse">
            <thead>
              <tr className="bg-surface-container/40 p-1">
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Identity</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Athlete (Rider)</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Circuit / Division</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Capital (Fee)</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">EFI Validation</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Settlement</th>
                <th className="p-5 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {demoRegistrations.map((reg, i) => (
                <tr key={reg.id} className={cn("group hover:bg-surface-container/50 transition-all duration-300", `animate-slide-up-${(i % 5) + 1}`)}>
                  <td className="p-5">
                    <span className="font-mono text-[10px] font-black text-secondary bg-secondary/10 px-2 py-1 rounded-md border border-secondary/20 shadow-sm">{reg.eId}</span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg shadow-inner">👤</div>
                      <div>
                        <p className="text-sm font-black text-on-surface group-hover:text-primary transition-colors">{reg.riderName}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5 tracking-tight opacity-60">{reg.horseName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1">
                       <p className="text-xs font-black text-on-surface truncate max-w-[150px]">{reg.eventName}</p>
                       <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">{reg.categoryName}</p>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="font-mono text-sm font-black text-on-surface opacity-80 whitespace-nowrap">₹{reg.totalFee.toLocaleString("en-IN")}</span>
                  </td>
                  <td className="p-5">
                    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border", approvalBadge(reg.approvalStatus))}>
                      {reg.approvalStatus === "APPROVED" ? <ShieldCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {reg.approvalStatus}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border", paymentBadge(reg.paymentStatus))}>
                      <CreditCard className="w-3 h-3" />
                      {reg.paymentStatus}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center justify-end gap-2">
                       <button className="p-2.5 rounded-xl hover:bg-surface-container text-muted-foreground hover:text-on-surface transition-all">
                          <ChevronRight className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

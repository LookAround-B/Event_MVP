
import { useState } from "react";
import { Plus, Check, ClipboardList, Clock, ShieldCheck, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { PortalModal } from "@/components/portals/PortalModal";

interface Registration {
  id: number; eId: string; eventName: string; categoryName: string;
  horseName: string; entryFee: number;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "CANCELLED";
  registrationDate: string;
}

interface RiderRegistrationsProps {
  demoRegistrations: Registration[];
  demoEvents: any[];
  demoHorses: any[];
}

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5 font-bold uppercase tracking-widest text-muted-foreground ml-1">
    <label className="text-[10px]">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props}
    className="w-full px-4 py-3 rounded-xl bg-surface-container/50 border border-border/40 text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed" />
);

const Sel = ({ children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...rest}
    className="w-full px-4 py-3 rounded-xl bg-surface-container/50 border border-border/40 text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all appearance-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
    {children}
  </select>
);

const approvalBadge = (s: string) => {
  switch (s) {
    case "APPROVED": return "bg-primary/10 text-primary border-primary/20 shadow-[0_0_12px_rgba(var(--primary-rgb),0.15)]";
    case "REJECTED": return "bg-destructive/10 text-destructive border-destructive/20";
    default: return "bg-secondary/10 text-secondary border-secondary/20 shadow-[0_0_12px_rgba(var(--secondary-rgb),0.15)]";
  }
};

const paymentBadge = (s: string) => {
  switch (s) {
    case "PAID": return "bg-primary/10 text-primary border-primary/20 shadow-[0_0_12px_rgba(var(--primary-rgb),0.15)]";
    case "UNPAID": return "bg-destructive/10 text-destructive border-destructive/20";
    case "PARTIAL": return "bg-secondary/10 text-secondary border-secondary/20 shadow-[0_0_12px_rgba(var(--secondary-rgb),0.15)]";
    default: return "bg-surface-bright/50 text-muted-foreground border-border/20";
  }
};

export const RiderRegistrations = ({ demoRegistrations, demoEvents, demoHorses }: RiderRegistrationsProps) => {
  const [showForm, setShowForm] = useState(false);
  const [horse, setHorse] = useState(demoHorses[0]?.name || "");
  const [event, setEvent] = useState("");
  const [category, setCategory] = useState("");

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in pb-12">
      {/* ── Header Area ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-on-surface tracking-tight">Entry <span className="gradient-text">Chronicle</span></h2>
          <p className="text-xs text-muted-foreground font-medium mt-1">Audit your competition history and pending authorizations.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2.5 px-6 py-3 btn-cta rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> New Registration
        </button>
      </div>

      {/* ── Form Modal ────────────────────────────────────────── */}
      <PortalModal 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        title="Authorize Event Entrance"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <Field label="Event Selection" required>
            <Sel value={event} onChange={(e) => setEvent(e.target.value)}>
              <option value="">Select Target Event</option>
              {demoEvents.map((ev: any) => <option key={ev.id} value={ev.name}>{ev.name}</option>)}
            </Sel>
          </Field>
          <Field label="Division / Category" required>
            <Sel value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select Division</option>
              <option>Show Jumping A</option><option>Show Jumping B</option>
              <option>Dressage Open</option><option>Cross Country</option>
              <option>Junior Open</option><option>Senior Open</option>
            </Sel>
          </Field>
          <Field label="Stable Asset (Horse)" required>
            <Sel value={horse} onChange={(e) => setHorse(e.target.value)}>
              {demoHorses.map((h: any) => <option key={h.id} value={h.name}>{h.name}</option>)}
            </Sel>
          </Field>
          <Field label="Registry Serial (Auto)"><Input disabled value="REG-AUTO-GEN" /></Field>
        </div>

        <div className="flex gap-4 mt-12 pt-8 border-t border-white/5">
          <button onClick={() => setShowForm(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-[11px] font-black uppercase tracking-widest text-on-surface hover:bg-white/10 transition-all border border-white/5">Abort Calibration</button>
          <button onClick={() => setShowForm(false)} className="flex-1 py-4 btn-cta rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
            <Check className="w-5 h-5 font-black" /> Submit Authorization
          </button>
        </div>
      </PortalModal>

      {/* ── Registration List ─────────────────────────────────────────── */}
      <div className="bento-card overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[850px] border-collapse">
            <thead>
              <tr className="bg-surface-container/40">
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Entry ID</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Event & Division</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Stable Asset</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Entrance Fee</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Validation</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Settlement</th>
                <th className="p-5 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {demoRegistrations.map((reg, i) => (
                <tr key={reg.id} className={cn("group hover:bg-surface-container/50 transition-all duration-300", `animate-slide-up-${(i % 5) + 1}`)}>
                  <td className="p-5">
                    <span className="font-mono text-[10px] font-black text-secondary bg-secondary/10 px-2 py-1 rounded-md border border-secondary/20 shadow-sm">{reg.eId}</span>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-black text-on-surface group-hover:text-primary transition-colors">{reg.eventName}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tight opacity-70">{reg.categoryName}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="w-6 h-6 rounded-lg bg-surface-container flex items-center justify-center text-xs">🐴</span>
                      <span className="text-xs font-bold">{reg.horseName}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="font-mono text-sm font-black text-on-surface opacity-80">₹{reg.entryFee.toLocaleString("en-IN")}</span>
                  </td>
                  <td className="p-5">
                    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border", approvalBadge(reg.approvalStatus))}>
                      {reg.approvalStatus === "APPROVED" ? <ShieldCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {reg.approvalStatus}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border", paymentBadge(reg.paymentStatus))}>
                      <CreditCard className="w-3 h-3" />
                      {reg.paymentStatus}
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <span className="font-mono text-[10px] text-muted-foreground font-bold opacity-60 uppercase">{reg.registrationDate}</span>
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


import { useState } from "react";
import { Plus, Check, X, ShieldCheck, User, Mail, Phone, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PortalModal } from "@/components/portals/PortalModal";

interface Rider {
  id: number; eId: string; firstName: string; lastName: string;
  email: string; phone: string; gender: string; isActive: boolean;
  profileComplete: boolean; city: string;
}

interface ClubMembersProps {
  demoRiders: Rider[];
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

export const ClubMembers = ({ demoRiders }: ClubMembersProps) => {
  const [riders, setRiders] = useState(demoRiders);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Rider>>({});

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in pb-12">
      {/* ── Header Area ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-on-surface tracking-tight">Athlete <span className="gradient-text">Roster</span></h2>
          <p className="text-xs text-muted-foreground font-medium mt-1">Manage and verify your club's registered competitive riders.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2.5 px-6 py-3 btn-cta rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> Add Rider to Unit
        </button>
      </div>

      {/* ── Form Modal ────────────────────────────────────────── */}
      <PortalModal 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        title="Onboard New Athlete Unit"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <Field label="Given Name" required><Input placeholder="Legal First Name" /></Field>
          <Field label="Family Name" required><Input placeholder="Legal Last Name" /></Field>
          <Field label="Operational Email" required><Input placeholder="Email Protocol" /></Field>
          <Field label="Primary Comms" required><Input placeholder="Phone/Mobile" /></Field>
        </div>

        <div className="flex gap-4 mt-12 pt-8 border-t border-white/5">
          <button onClick={() => setShowForm(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-[11px] font-black uppercase tracking-widest text-on-surface hover:bg-white/10 transition-all border border-white/5">Abort Calibration</button>
          <button onClick={() => setShowForm(false)} className="flex-1 py-4 btn-cta rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
            <Check className="w-5 h-5 font-black" /> Authorize Entry
          </button>
        </div>
      </PortalModal>

      {/* ── Roster Table ────────────────────────────────────────────────── */}
      <div className="bento-card overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px] border-collapse">
            <thead>
              <tr className="bg-surface-container/40 p-1">
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Identity</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Athlete Profile</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Communication Protocol</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Unit Status</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Validation</th>
                <th className="p-5 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {riders.map((r, i) => (
                <tr key={r.id} className={cn("group hover:bg-surface-container/50 transition-all duration-300", `animate-slide-up-${(i % 5) + 1}`)}>
                  <td className="p-5">
                    <span className="font-mono text-[10px] font-black text-secondary bg-secondary/10 px-2 py-1 rounded-md border border-secondary/20 shadow-sm">{r.eId}</span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                        <span className="text-2xl drop-shadow-md">👤</span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-on-surface group-hover:text-primary transition-colors">{r.firstName} {r.lastName}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5 tracking-tight opacity-60">{r.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1.5">
                       <div className="flex items-center gap-2 text-[11px] text-on-surface-variant font-medium">
                          <Mail className="w-3.5 h-3.5 opacity-40" /> {r.email}
                       </div>
                       <div className="flex items-center gap-2 text-[11px] text-on-surface-variant font-medium">
                          <Phone className="w-3.5 h-3.5 opacity-40" /> {r.phone}
                       </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black tracking-[0.1em] uppercase border shadow-sm", 
                      r.isActive ? "bg-primary/10 text-primary border-primary/20" : "bg-destructive/10 text-destructive border-destructive/20")}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", r.isActive ? "bg-primary animate-pulse" : "bg-destructive")} />
                      {r.isActive ? "Active Unit" : "Decommissioned"}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className={cn("flex flex-col gap-2")}>
                       <div className={cn("inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest", r.profileComplete ? "text-primary/70" : "text-muted-foreground/40")}>
                          <Check className={cn("w-3 h-3", r.profileComplete ? "opacity-100" : "opacity-20")} /> Profile Full
                       </div>
                       <div className={cn("inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest", r.isActive ? "text-primary/70" : "text-muted-foreground/40")}>
                          <ShieldCheck className={cn("w-3 h-3", r.isActive ? "opacity-100" : "opacity-20")} /> EFI Verified
                       </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center justify-end gap-2 px-1">
                      <button className="p-2.5 rounded-xl hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all group-hover:shadow-md">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2.5 rounded-xl hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all">
                        <Trash2 className="w-4 h-4" />
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

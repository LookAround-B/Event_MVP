
import { useState } from "react";
import { Plus, Edit, Trash2, Activity, FileText, Check, X, Camera, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { PortalModal } from "@/components/portals/PortalModal";

interface Horse {
  id: number; eId: string; name: string; gender: string;
  yearOfBirth: number; passportNumber: string; color: string; 
  breed?: string; height?: number; imageUrl?: string;
  ownerName: string; ownerType: "CLUB" | "RIDER";
}

interface ClubHorsesProps {
  demoHorses: Horse[];
}

const SectionTitle = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-3 pt-2">
    <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary shadow-inner">
      <Icon className="w-4 h-4" />
    </div>
    <h4 className="text-sm font-black text-on-surface uppercase tracking-widest opacity-80">{title}</h4>
    <div className="flex-1 h-px bg-border/20" />
  </div>
);

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props}
    className="w-full px-4 py-3 rounded-xl bg-surface-container/50 border border-border/40 text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed" />
);

const Sel = ({ children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...rest}
    className="w-full px-4 py-3 rounded-xl bg-surface-container/50 border border-border/40 text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all appearance-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
    {children}
  </select>
);

export const ClubHorses = ({ demoHorses }: ClubHorsesProps) => {
  const [horses, setHorses] = useState(demoHorses);
  const [showForm, setShowForm] = useState(false);
  const [viewHorse, setViewHorse] = useState<Horse | null>(null);
  const [form, setForm] = useState<Partial<Horse>>({});

  const set = (k: keyof Horse) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in pb-12">
      {/* ── Header Area ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-on-surface tracking-tight">Stable <span className="gradient-text">Ledger</span></h2>
          <p className="text-xs text-muted-foreground font-medium mt-1">Audit and manage the unit's active competition horses and documentation.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2.5 px-6 py-3 btn-cta rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> Register New Asset
        </button>
      </div>

      {/* ── Form Modal ────────────────────────────────────────── */}
      <PortalModal 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        title="Allocate New Equine Asset"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Field label="Horse Name" required><Input placeholder="Asset Identification" value={form.name} onChange={set("name")} /></Field>
          <Field label="Genetic Breed"><Input placeholder="e.g. Thoroughbred" value={form.breed} onChange={set("breed")} /></Field>
          <Field label="Gender Spec" required>
            <Sel value={form.gender} onChange={set("gender")}><option>Stallion</option><option>Mare</option><option>Gelding</option></Sel>
          </Field>
          <Field label="Ownership Type" required>
            <Sel value={form.ownerType} onChange={set("ownerType")}><option value="CLUB">Club-Owned</option><option value="RIDER">Rider-Owned</option></Sel>
          </Field>
        </div>

        <div className="flex gap-4 mt-12 pt-8 border-t border-white/5">
          <button onClick={() => setShowForm(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-[11px] font-black uppercase tracking-widest text-on-surface hover:bg-white/10 transition-all border border-white/5">Abort Calibration</button>
          <button onClick={() => setShowForm(false)} className="flex-1 py-4 btn-cta rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
            <Check className="w-5 h-5 font-black" /> Authorize Entry
          </button>
        </div>
      </PortalModal>

      {/* ── Stable Table ────────────────────────────────────────────────── */}
      <div className="bento-card overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px] border-collapse">
            <thead>
              <tr className="bg-surface-container/40 p-1">
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Identity</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Equine Profile</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Ownership Profile</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Genetics</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Passport</th>
                <th className="p-5 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {horses.map((h, i) => (
                <tr key={h.id} className={cn("group hover:bg-surface-container/50 transition-all duration-300", `animate-slide-up-${(i % 5) + 1}`)}>
                  <td className="p-5">
                    <span className="font-mono text-[10px] font-black text-secondary bg-secondary/10 px-2 py-1 rounded-md border border-secondary/20 shadow-sm">{h.eId}</span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                        {h.imageUrl
                          ? <img src={h.imageUrl} alt={h.name} className="w-full h-full object-cover" />
                          : <span className="text-2xl drop-shadow-md">🐴</span>}
                      </div>
                      <div>
                        <p className="text-sm font-black text-on-surface group-hover:text-primary transition-colors">{h.name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5 tracking-tight opacity-60">{h.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1.5 cursor-help" title={`Account: ${h.ownerName}`}>
                       <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border w-fit", 
                         h.ownerType === "CLUB" ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary/10 text-secondary border-secondary/20")}>
                          {h.ownerType === "CLUB" ? "Club Asset" : "Rider Asset"}
                       </div>
                       <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight opacity-60 truncate max-w-[120px]">{h.ownerName}</p>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-on-surface">{h.breed || "Standard"}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter opacity-60">{h.color} • {h.yearOfBirth}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <p className="font-mono text-[11px] text-on-surface-variant bg-surface-container/60 px-3 py-1.5 rounded-lg border border-border/40 inline-flex items-center gap-2">
                       <FileText className="w-3 h-3 opacity-40" /> {h.passportNumber}
                    </p>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center justify-end gap-2 px-1">
                      <button onClick={() => setViewHorse(h)} className="p-2.5 rounded-xl hover:bg-surface-container text-muted-foreground hover:text-on-surface transition-all group-hover:shadow-md">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2.5 rounded-xl hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── View Detail Drawer ────────────────────────────────────────── */}
      {viewHorse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewHorse(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bento-card p-8 w-full max-w-xl animate-scale-up shadow-[0_32px_100px_-16px_rgba(0,0,0,0.5)] border-primary/20" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-3xl shadow-inner">🐴</div>
                <div>
                  <h3 className="text-2xl font-black text-on-surface tracking-tighter">{viewHorse.name}</h3>
                  <p className="font-mono text-[10px] font-black text-secondary uppercase tracking-[0.2em] mt-1">Registry Code • {viewHorse.eId}</p>
                </div>
              </div>
              <button onClick={() => setViewHorse(null)} className="p-2.5 rounded-2xl hover:bg-surface-container transition-all text-muted-foreground hover:text-on-surface">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {[
                { label: "Stability Owner", value: viewHorse.ownerName },
                { label: "Asset Category",  value: viewHorse.ownerType === "CLUB" ? "Club-Owned" : "Rider-Owned" },
                { label: "Gender Spec",     value: viewHorse.gender },
                { label: "Genetics / Breed",value: viewHorse.breed || "Standard" },
                { label: "Visual Color",    value: viewHorse.color },
                { label: "Birth Cycle",     value: viewHorse.yearOfBirth },
                { label: "Passport Code",   value: viewHorse.passportNumber },
                { label: "Height (hh)",     value: viewHorse.height ? `${viewHorse.height} hh` : "—" },
              ].map((item, i) => (
                <div key={i} className="space-y-1.5 p-4 rounded-2xl bg-surface-container/40 border border-border/20 shadow-sm transition-all hover:bg-surface-container/60">
                   <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{item.label}</p>
                   <p className="text-sm font-black text-on-surface">{item.value}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-10 pt-8 border-t border-border/20 flex gap-4">
               <button onClick={() => setViewHorse(null)} className="flex-1 py-3.5 bg-surface-container rounded-2xl text-[10px] font-black uppercase tracking-widest text-on-surface hover:bg-surface-bright transition-all">Dismiss Dossier</button>
               <button className="flex-1 py-3.5 btn-cta rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all">Modify Specifications</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

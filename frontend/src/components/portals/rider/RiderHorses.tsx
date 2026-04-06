
import { useState } from "react";
import { Plus, Edit, Trash2, Activity, FileText, Upload, Check, X, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { PortalModal } from "@/components/portals/PortalModal";

interface Horse {
  id: number; eId: string; name: string; gender: string;
  yearOfBirth: number; passportNumber: string; embassyId?: string;
  horseCode?: string; color: string; breed?: string; height?: number;
  imageUrl?: string;
}

interface RiderHorsesProps {
  demoHorses: Horse[];
}

const SectionTitle = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-3 pt-2">
    <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
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

export const RiderHorses = ({ demoHorses }: RiderHorsesProps) => {
  const [horses, setHorses] = useState(demoHorses);
  const [showForm, setShowForm] = useState(false);
  const [editHorse, setEditHorse] = useState<Horse | null>(null);
  const [form, setForm] = useState<Partial<Horse>>({});

  const openAdd = () => {
    setForm({ gender: "Stallion", color: "Bay" });
    setEditHorse(null);
    setShowForm(true);
  };

  const openEdit = (h: Horse) => {
    setForm(h);
    setEditHorse(h);
    setShowForm(true);
  };

  const handleSave = () => {
    if (editHorse) {
      setHorses(prev => prev.map(h => h.id === editHorse.id ? { ...h, ...form } as Horse : h));
    } else {
      setHorses(prev => [...prev, { ...form, id: Date.now(), eId: `EIRSHR${Math.floor(Math.random() * 100000)}` } as Horse]);
    }
    setShowForm(false);
  };

  const set = (k: keyof Horse) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in pb-12">
      {/* ── Header Area ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-on-surface tracking-tight">Horse <span className="gradient-text">Registry</span></h2>
          <p className="text-xs text-muted-foreground font-medium mt-1">Manage your active competition roster and documentation.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2.5 px-6 py-3 btn-cta rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> Add New Stallion
        </button>
      </div>

      {/* ── Form Modal ────────────────────────────────────────── */}
      <PortalModal 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        title={editHorse ? "Refine Horse Specifications" : "Onboard New Horse Asset"}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="p-6 rounded-[2rem] bg-surface-container/20 border border-white/5 text-center shadow-inner relative overflow-hidden group">
               <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="w-28 h-28 rounded-full bg-primary/10 mx-auto flex items-center justify-center border-4 border-surface-container relative z-10 transition-transform group-hover:scale-105 duration-500">
                  <Camera className="w-10 h-10 text-primary/40" />
                  <label className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-2xl hover:scale-110 active:scale-95 transition-all">
                     <Plus className="w-5 h-5 font-black" />
                     <input type="file" className="hidden" />
                  </label>
               </div>
               <p className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface mt-6 opacity-70">Asset Visualization</p>
               <p className="text-[9px] text-muted-foreground/60 mt-1 font-bold">Recommended: 800x800px High-Res</p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <Field label="Horse Identification" required><Input placeholder="Legal name in registry" value={form.name} onChange={set("name")} /></Field>
              <Field label="Birth Cycle (Year)" required><Input type="number" placeholder="YYYY" value={form.yearOfBirth} onChange={set("yearOfBirth")} /></Field>
              <Field label="Gender Specification" required>
                <Sel value={form.gender} onChange={set("gender")}><option>Stallion</option><option>Mare</option><option>Gelding</option></Sel>
              </Field>
              <Field label="Genetic Breed" required><Input placeholder="e.g. Warmblood" value={form.breed} onChange={set("breed")} /></Field>
              <Field label="Visual Color Spectrum" required>
                <Sel value={form.color} onChange={set("color")}>
                  {["Bay","Grey","Chestnut","Black","Dark Bay","Palomino","Roan","Dun"].map(c => <option key={c}>{c}</option>)}
                </Sel>
              </Field>
              <Field label="Stature (Height - hh)"><Input type="number" step="0.1" placeholder="e.g. 16.2" value={form.height} onChange={set("height")} /></Field>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-10 border-t border-white/5">
          <SectionTitle icon={FileText} title="Regulatory & Authentication" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-8">
            <Field label="Global Passport Code" required><Input placeholder="HP00XXX-IND" value={form.passportNumber} onChange={set("passportNumber")} /></Field>
            <Field label="EFI / Embassy Unit ID"><Input placeholder="EBM-REG-XXX" value={form.embassyId} onChange={set("embassyId")} /></Field>
            <Field label="Registry Serial (HC)"><Input placeholder="HC-SERIAL-XXX" value={form.horseCode} onChange={set("horseCode")} /></Field>
          </div>
        </div>

        <div className="flex gap-4 mt-12 pt-8 border-t border-white/5">
          <button onClick={() => setShowForm(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-[11px] font-black uppercase tracking-widest text-on-surface hover:bg-white/10 transition-all border border-white/5">Abort Calibration</button>
          <button onClick={handleSave} className="flex-1 py-4 btn-cta rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
            <Check className="w-5 h-5 font-black" /> {editHorse ? "Commit Update" : "Authorize Entry"}
          </button>
        </div>
      </PortalModal>

      {/* ── Horse Grid/Table ────────────────────────────────────────────── */}
      <div className="bento-card overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px] border-collapse">
            <thead>
              <tr className="bg-surface-container/40 p-1">
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Identity</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Horse Profile</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Genetics / Spec</th>
                <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Birth</th>
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
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5 tracking-tight">{h.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-on-surface-variant font-medium">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-on-surface">{h.breed || "Standard"}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter opacity-60">{h.color}</span>
                    </div>
                  </td>
                  <td className="p-5 font-mono text-xs text-on-surface font-black opacity-80">{h.yearOfBirth}</td>
                  <td className="p-5">
                    <p className="font-mono text-[11px] text-on-surface-variant bg-surface-container/60 px-2 py-1 rounded-lg border border-border/40 inline-flex items-center gap-2">
                       <FileText className="w-3 h-3 opacity-40" /> {h.passportNumber}
                    </p>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(h)} className="p-2.5 rounded-xl hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all group-hover:shadow-md">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setHorses(p => p.filter(x => x.id !== h.id))} 
                         className="p-2.5 rounded-xl hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all">
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

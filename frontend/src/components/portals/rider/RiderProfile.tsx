
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/DatePicker";
import { Edit, Camera, ImageIcon, Check, X, MapPin, Phone, User, Fingerprint, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiderProfileProps {
  demoRider: any;
  demoRegistrations: any[];
  demoHorses: any[];
  demoEvents: any[];
}

const RIDER_STARS = [
  [8,12],[15,38],[25,60],[33,20],[44,75],[54,44],[65,8],[74,65],[20,85],[30,30],[40,52],[50,70],[60,25],[70,48],[10,78],
];

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

export const RiderProfile = ({ demoRider, demoRegistrations, demoHorses, demoEvents }: RiderProfileProps) => {
  const [isMounted, setIsMounted] = useState(false);
  useState(() => {
    if (typeof window !== "undefined") setIsMounted(true);
  });
  // Or more simply:
  useEffect(() => setIsMounted(true), []);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...demoRider });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);

  const approvedCount = demoRegistrations.filter(r => r.approvalStatus === "APPROVED").length;
  const seasonScore = Math.round((approvedCount / demoRegistrations.length) * 100);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p: any) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="animate-fade-in pb-12">
      {/* ── Banner Hero ────────────────────────────────────────────────── */}
      <div className="-mx-4 sm:-mx-6 -mt-3 sm:-mt-6 relative">
        <div className="relative h-72 sm:h-96 lg:h-[450px] overflow-hidden">
          {bannerImage ? (
            <img src={bannerImage} alt="Profile banner" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              {/* Complex Layered Background */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(155deg, #06060f 0%, #090918 18%, #0d0d22 35%, #0a0a1c 55%, #07071a 78%, #050510 100%)" }} />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, hsl(253,70%,70%) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
              <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(hsl(253,60%,55%) 1px, transparent 1px), linear-gradient(90deg, hsl(253,60%,55%) 1px, transparent 1px)", backgroundSize: "100px 100px" }} />
              
              {/* Dynamic Glows */}
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 55% at 90% 90%, hsl(var(--primary)/0.08) 0%, transparent 65%)" }} />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_5%_10%,hsl(253,90%,73%,0.1)_0%,transparent_65%)]" />

              {/* Watermark Initial */}
              <div className="absolute inset-0 flex items-center justify-start pl-12 select-none pointer-events-none overflow-hidden opacity-10">
                <span className="text-[15rem] sm:text-[25rem] font-black text-transparent [-webkit-text-stroke:1px_hsl(var(--primary))] leading-none font-serif">
                   {form.firstName[0]}{form.lastName[0]}
                </span>
              </div>
              
              {/* Decorative Stars */}
              {RIDER_STARS.map(([top, left], i) => (
                <div key={i} className="absolute rounded-full pointer-events-none"
                  style={{ top: `${top}%`, left: `${left}%`, width: i % 4 === 0 ? 3 : 1.5, height: i % 4 === 0 ? 3 : 1.5, background: i % 5 === 0 ? "hsl(var(--primary))" : "white", opacity: 0.1 + (i % 4) * 0.05 }} />
              ))}
            </>
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

          {/* Banner Actions */}
          <label className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all bg-black/40 text-white/70 border border-white/10 backdrop-blur-xl hover:bg-black/60 active:scale-95 shadow-2xl z-20">
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Calibrate Environment</span>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setBannerImage(URL.createObjectURL(file));
            }} />
          </label>

          {/* Identity Overlay */}
          <div className="absolute bottom-16 sm:bottom-20 left-0 right-0 px-8 sm:px-12 pointer-events-none">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                 <span className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-primary/10 border border-primary/30 text-primary backdrop-blur-xl shadow-xl flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3 animate-pulse" /> Verified Athlete
                 </span>
                 <span className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-surface-container/40 border border-border/20 text-muted-foreground backdrop-blur-xl shadow-xl">
                    EFI {form.efiRiderId}
                 </span>
              </div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-white drop-shadow-2xl font-serif leading-tight">
                {form.firstName} <span className="gradient-text">{form.lastName}</span>
              </h1>
              <div className="flex items-center gap-6 text-sm text-white/50 tracking-wide font-medium uppercase font-mono">
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 opacity-50 font-black" /> {form.city}, {form.state}</span>
                <span className="flex items-center gap-2"><Fingerprint className="w-4 h-4 opacity-50 font-black" /> {form.eId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Avatar & Controls Overlay */}
        <div className="relative px-6 sm:px-12 -mt-16 sm:-mt-24 flex items-end justify-between z-30">
          <div className="relative group/avatar cursor-pointer">
            <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-[2.5rem] overflow-hidden bg-surface-container border-[6px] border-background shadow-2xl flex items-center justify-center transition-all duration-500 group-hover/avatar:rotate-2 group-hover/avatar:scale-105">
                 {profileImage 
                    ? <img src={profileImage} alt="Avatar" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center text-6xl shadow-inner">🏇</div>
                 }
            </div>
            <label className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-2xl hover:scale-110 active:scale-95 transition-all">
              <Camera className="w-5 h-5 shadow-sm" />
              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setProfileImage(URL.createObjectURL(file));
              }} />
            </label>
          </div>
          <div className="pb-4 sm:pb-8 flex gap-3">
             <button onClick={() => setEditing(!editing)} 
                className={cn("px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all border-beam flex items-center gap-2.5", 
                  editing ? "bg-destructive/10 text-destructive border-destructive/20" : "btn-cta")}>
               {editing ? <><X className="w-4 h-4" /> Cancel Calibration</> : <><Edit className="w-4 h-4" /> Recalibrate Profile</>}
             </button>
          </div>
        </div>
      </div>

      {/* ── Profile Content ─────────────────────────────────────────────── */}
      <div className="mt-8 lg:mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Biography & Metrics */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
           <div className="bento-card p-6 sm:p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 rotate-12 opacity-[0.03] select-none pointer-events-none transition-transform group-hover:scale-110 duration-700">
                <User className="w-64 h-64 font-black" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-on-surface mb-6 opacity-70">Athlete Biography</h3>
              <p className="text-lg font-medium text-on-surface-variant leading-relaxed font-serif italic border-l-4 border-primary/30 pl-6 mb-8">
                Competitive equestrian athlete specialising in Show Jumping and Dressage. Representing <span className="text-on-surface font-black">{form.clubName}</span> across national circuits since {new Date(form.dob).getFullYear() + 18}.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 {[
                   { label: "Registrations", value: demoRegistrations.length, sub: "Approved: " + approvedCount },
                   { label: "Stability (Horses)", value: demoHorses.length, sub: "Authorized Stable" },
                   { label: "Circuits (Events)", value: demoEvents.length, sub: "Available Tourneys" },
                   { label: "Performance Score", value: seasonScore + "%", sub: "Approval Efficiency" },
                 ].map((stat, i) => (
                   <div key={stat.label} className={cn("p-4 rounded-2xl bg-surface-container/40 border border-border/20 transition-all hover:bg-surface-container/60", `animate-slide-up-${(i % 4) + 1}`)}>
                      <p className="text-2xl font-black text-on-surface tracking-tighter">{stat.value}</p>
                      <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground mt-1">{stat.label}</p>
                      <p className="text-[8px] font-bold text-primary italic tracking-tight">{stat.sub}</p>
                   </div>
                 ))}
              </div>
           </div>

           {/* Personal Registry Form (Conditionally Interactive) */}
           <div className="bento-card p-6 sm:p-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-on-surface mb-8 opacity-70">Rider Registry Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <Field label="Identification (Email)"><Input disabled={!editing} value={form.email} onChange={set("email")} /></Field>
                <Field label="Communication (Phone)"><Input disabled={!editing} value={form.phone} onChange={set("phone")} /></Field>
                <Field label="Biological Sex">
                   {isMounted ? (
                     <Sel disabled={!editing} value={form.gender} onChange={set("gender")}>
                       <option>Male</option>
                       <option>Female</option>
                       <option>Other</option>
                     </Sel>
                   ) : (
                     <div className="w-full h-11 bg-surface-container/50 rounded-xl" />
                   )}
                 </Field>
                 <Field label="Origin Timestamp (DOB)">
                   {isMounted ? (
                     <DatePicker disabled={!editing} value={form.dob} onChange={(v: any) => setForm((p: any) => ({ ...p, dob: v }))} />
                   ) : (
                     <div className="w-full h-11 bg-surface-container/50 rounded-xl" />
                   )}
                 </Field>
                <Field label="Identity Protocol (Aadhaar)"><Input disabled={!editing} value={form.aadhaarNumber} onChange={set("aadhaarNumber")} /></Field>
                <Field label="EFI Registry ID"><Input disabled={!editing} value={form.efiRiderId} onChange={set("efiRiderId")} /></Field>
              </div>
              
              {editing && (
                 <div className="mt-10 pt-8 border-t border-border/20 flex gap-4">
                    <button onClick={() => setEditing(false)} className="px-8 py-3 rounded-2xl bg-surface-container text-sm font-black uppercase tracking-widest text-on-surface hover:bg-surface-bright transition-all">Abort</button>
                    <button className="px-10 py-3 btn-cta rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 animate-pulse">
                       <Check className="w-5 h-5" /> Commit Calibration
                    </button>
                 </div>
              )}
           </div>
        </div>

        {/* Contact & Location Strip */}
        <div className="space-y-6">
           <div className="bento-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] rotate-12"><Phone className="w-24 h-24" /></div>
              <h3 className="text-xs font-black uppercase tracking-widest text-on-surface mb-6 opacity-70">Primary Comms</h3>
              <div className="space-y-5">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><Phone className="w-5 h-5" /></div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Primary Line</p>
                       <p className="text-sm font-bold">{form.phone}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shadow-inner"><Phone className="w-5 h-5" /></div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Auxiliary Line</p>
                       <p className="text-sm font-bold">{form.optionalPhone}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bento-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] rotate-12"><MapPin className="w-24 h-24" /></div>
              <h3 className="text-xs font-black uppercase tracking-widest text-on-surface mb-6 opacity-70">Registry Locale</h3>
              <div className="space-y-5">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><MapPin className="w-5 h-5" /></div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Residence Address</p>
                       <p className="text-sm font-bold leading-tight">{form.address}</p>
                       <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{form.city}, {form.state} — {form.pincode}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

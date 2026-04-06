
import { Calendar, Plus, MapPin, ArrowUpRight, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Event {
  id: number; eId: string; eventType: string; name: string;
  startDate: string; endDate: string; venueName?: string; categoryCount: number;
}

interface RiderEventsProps {
  demoEvents: Event[];
}

const Sel = ({ children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...rest}
    className="flex-1 text-[11px] font-bold py-2 px-3 rounded-xl bg-surface-container/50 border border-border/40 text-on-surface focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer">
    {children}
  </select>
);

export const RiderEvents = ({ demoEvents }: RiderEventsProps) => {
  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in pb-12">
      {/* ── Header Area ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-on-surface tracking-tight">Event <span className="gradient-text">Discovery</span></h2>
          <p className="text-xs text-muted-foreground font-medium mt-1">{demoEvents.length} competitive circuits available for registration.</p>
        </div>
        <div className="flex bg-surface-container p-1 rounded-xl border border-border/40">
           {["All", "KSEC", "EIRS", "EPL"].map((tag, i) => (
             <button key={tag} className={cn("px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", i === 0 ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-on-surface")}>
               {tag}
             </button>
           ))}
        </div>
      </div>

      {/* ── Event Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
        {demoEvents.map((ev, i) => (
          <div key={ev.id} className={cn("bento-card p-6 flex flex-col gap-4 group hover:border-primary/30 transition-all duration-500 relative overflow-hidden", `animate-slide-up-${(i % 5) + 1}`)}>
            {/* Background Accent */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                   <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-black uppercase tracking-[0.2em] border border-primary/20">{ev.eventType}</span>
                   <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">E_ID: {ev.eId}</span>
                </div>
                <h3 className="text-lg font-black text-on-surface group-hover:text-primary transition-colors leading-tight">{ev.name}</h3>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">{ev.venueName || "TBD"}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                {ev.eventType === "KSEC" ? "🛡️" : ev.eventType === "EPL" ? "🏆" : "🐎"}
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-on-surface-variant font-bold mt-2 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-container/60 flex items-center justify-center"><Calendar className="w-4 h-4 opacity-40" /></div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest opacity-50 font-black">Timeline</p>
                  <p className="text-[11px]">{ev.startDate} <span className="opacity-30 mx-1">→</span> {ev.endDate}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-border/20" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-container/60 flex items-center justify-center"><Trophy className="w-4 h-4 opacity-40" /></div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest opacity-50 font-black">Categories</p>
                  <p className="text-[11px]">{ev.categoryCount} Classes</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-border/10 mt-2" />

            <div className="flex items-center justify-between gap-3 relative z-10 pt-1">
              <Sel>
                <option value="">Choose Division...</option>
                {Array.from({ length: ev.categoryCount }, (_, idx) => <option key={idx}>Class {idx + 1}</option>)}
              </Sel>
              <button className="flex items-center gap-2 px-5 py-2.5 btn-cta rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg group/btn active:scale-95 transition-all">
                <Plus className="w-4 h-4 group-hover/btn:rotate-90 transition-transform" /> Register
              </button>
            </div>
            
            <button className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 text-primary">
              <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

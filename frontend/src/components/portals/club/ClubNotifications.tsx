import { useState } from "react";
import { Bell, CheckCheck, Trash2, Clock, ShieldCheck, CreditCard, Activity, Users, ClipboardList, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClubNotif {
  id: number; type: string; title: string; message: string;
  isRead: boolean; createdAt: string;
}

interface ClubNotificationsProps {
  demoNotifs: ClubNotif[];
}

const clubNotifBadge = (t: string) => {
  switch (t) {
    case "MEMBER":       return "bg-primary/10 text-primary border-primary/20 shadow-sm";
    case "REGISTRATION": return "bg-primary/10 text-primary border-primary/20 shadow-sm";
    case "PAYMENT":      return "bg-secondary/10 text-secondary border-secondary/20 shadow-sm";
    case "EVENT":        return "bg-secondary/10 text-secondary border-secondary/20 shadow-sm";
    case "SYSTEM":       return "bg-surface-bright/50 text-muted-foreground border-border/20";
    default:             return "bg-surface-bright/50 text-muted-foreground border-border/20";
  }
};

const clubNotifIcon = (t: string) => {
  switch (t) {
    case "MEMBER":       return <Users className="w-4 h-4" />;
    case "REGISTRATION": return <ClipboardList className="w-4 h-4" />;
    case "PAYMENT":      return <CreditCard className="w-4 h-4" />;
    case "EVENT":        return <Bell className="w-4 h-4" />;
    case "SYSTEM":       return <Activity className="w-4 h-4" />;
    default:             return <Info className="w-4 h-4" />;
  }
};

export const ClubNotifications = ({ demoNotifs }: ClubNotificationsProps) => {
  const [data, setData] = useState<ClubNotif[]>(demoNotifs);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");

  const filtered = activeFilter === "unread" ? data.filter(n => !n.isRead) : data;
  const unreadCount = data.filter(n => !n.isRead).length;

  const markRead = (id: number) =>
    setData(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));

  const markAllRead = () => setData(prev => prev.map(n => ({ ...n, isRead: true })));

  const remove = (id: number) => setData(prev => prev.filter(n => n.id !== id));

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in pb-12">
      {/* ── Header row ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-1.5 bg-surface-container rounded-2xl p-1.5 border border-border/40 shadow-inner">
          {(["all", "unread"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveFilter(tab)}
              className={cn("px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all", 
                activeFilter === tab ? "bg-primary text-primary-foreground shadow-xl" : "text-muted-foreground hover:text-on-surface")}>
              {tab === "all" ? "Unit Comms" : `Unread ${unreadCount > 0 ? `(${unreadCount})` : ""}`}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2.5 px-6 py-2.5 bg-surface-container/60 hover:bg-surface-bright rounded-2xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant transition-all border border-border/40 shadow-sm active:scale-95 group">
            <CheckCheck className="w-4 h-4 group-hover:text-primary transition-colors" /> Authorize Presence (Mark all read)
          </button>
        )}
      </div>

      {/* ── Notification List ─────────────────────────────────────────── */}
      <div className="bento-card overflow-hidden shadow-2xl relative divide-y divide-border/10">
        <div className="absolute top-0 right-0 p-8 rotate-12 opacity-[0.02] select-none pointer-events-none">
          <Bell className="w-48 h-48" />
        </div>
        
        {filtered.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center text-primary opacity-20"><Bell className="w-8 h-8" /></div>
            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground opacity-40">Command silence established.</p>
          </div>
        ) : filtered.map((notif, i) => (
          <div key={notif.id}
            className={cn("flex items-start gap-5 p-6 transition-all hover:bg-surface-container/50 relative group", 
              !notif.isRead ? "bg-primary/[0.04]" : "", `animate-slide-up-${(i % 5) + 1}`)}>
            
            {/* Status Dot */}
            <div className="flex-shrink-0 mt-3.5">
              <div className={cn("w-2.5 h-2.5 rounded-full transition-all duration-500", 
                !notif.isRead ? "bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.6)] scale-110" : "bg-transparent border border-border/20")} />
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border", clubNotifBadge(notif.type))}>
                     {clubNotifIcon(notif.type)}
                     {notif.type}
                  </span>
                  <span className="text-sm font-black text-on-surface tracking-tight group-hover:text-primary transition-colors leading-tight">{notif.title}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono font-bold opacity-60 flex-shrink-0 bg-surface-container/60 px-3 py-1 rounded-lg">
                   <Clock className="w-3.5 h-3.5" />
                   {notif.createdAt}
                </div>
              </div>
              <p className="text-sm text-on-surface-variant font-medium leading-relaxed max-w-3xl pr-8">{notif.message}</p>
            </div>

            {/* Action Buttons Overlay */}
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 bg-background/80 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-border/20">
              {!notif.isRead && (
                <button onClick={() => markRead(notif.id)} title="Acknowledge Audit"
                  className="p-2.5 rounded-xl hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all active:scale-90">
                  <CheckCheck className="w-5 h-5" />
                </button>
              )}
              <button onClick={() => remove(notif.id)} title="Purge Record"
                className="p-2.5 rounded-xl hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all active:scale-90">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* ── Operational Efficiency Tip ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bento-card p-6 flex items-center gap-5 group hover:border-primary/30 transition-all cursor-pointer">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
               <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
               <h4 className="text-sm font-black text-on-surface uppercase tracking-tight">EFI Verification Queue</h4>
               <p className="text-xs text-muted-foreground mt-0.5">3 Athletes currently awaiting federated identity validation.</p>
            </div>
         </div>
         <div className="bento-card p-6 flex items-center gap-5 group hover:border-secondary/30 transition-all cursor-pointer">
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform shadow-inner">
               <CreditCard className="w-7 h-7" />
            </div>
            <div>
               <h4 className="text-sm font-black text-on-surface uppercase tracking-tight">Settlement Thresholds</h4>
               <p className="text-xs text-muted-foreground mt-0.5">Automated collection protocol operational for next circuit.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

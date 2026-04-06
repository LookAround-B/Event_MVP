
import { useState } from "react";
import { Bell, CheckCheck, Trash2, Clock, ShieldCheck, CreditCard, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiderNotif {
  id: number; type: string; title: string; message: string;
  isRead: boolean; createdAt: string;
}

interface RiderNotificationsProps {
  demoNotifs: RiderNotif[];
}

const riderNotifBadge = (t: string) => {
  switch (t) {
    case "REGISTRATION": return "bg-primary/10 text-primary border-primary/20 shadow-sm";
    case "PAYMENT":      return "bg-secondary/10 text-secondary border-secondary/20 shadow-sm";
    case "EVENT":        return "bg-secondary/10 text-secondary border-secondary/20 shadow-sm";
    case "SYSTEM":       return "bg-surface-bright/50 text-muted-foreground border-border/20";
    default:             return "bg-surface-bright/50 text-muted-foreground border-border/20";
  }
};

const riderNotifIcon = (t: string) => {
  switch (t) {
    case "REGISTRATION": return <ShieldCheck className="w-4 h-4" />;
    case "PAYMENT":      return <CreditCard className="w-4 h-4" />;
    case "EVENT":        return <Bell className="w-4 h-4" />;
    case "SYSTEM":       return <Activity className="w-4 h-4" />;
    default:             return <Bell className="w-4 h-4" />;
  }
};

export const RiderNotifications = ({ demoNotifs }: RiderNotificationsProps) => {
  const [data, setData] = useState<RiderNotif[]>(demoNotifs);
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
              {tab === "all" ? "Comms Log" : `Unread ${unreadCount > 0 ? `(${unreadCount})` : ""}`}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2.5 px-6 py-2.5 bg-surface-container/60 hover:bg-surface-bright rounded-2xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant transition-all border border-border/40 shadow-sm active:scale-95 group">
            <CheckCheck className="w-4 h-4 group-hover:text-primary transition-colors" /> Mark all read
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
            <div className="w-16 h-16 rounded-3xl bg-surface-container/50 flex items-center justify-center text-muted-foreground opacity-20"><Bell className="w-8 h-8" /></div>
            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground opacity-40">Operational silence established.</p>
          </div>
        ) : filtered.map((notif, i) => (
          <div key={notif.id}
            className={cn("flex items-start gap-5 p-6 transition-all hover:bg-surface-container/50 relative group", 
              !notif.isRead ? "bg-primary/[0.04]" : "", `animate-slide-up-${(i % 5) + 1}`)}>
            
            {/* Status Dot */}
            <div className="flex-shrink-0 mt-3.5">
              <div className={cn("w-2 h-2 rounded-full transition-all duration-500", 
                !notif.isRead ? "bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)] scale-110" : "bg-transparent")} />
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border", riderNotifBadge(notif.type))}>
                     {riderNotifIcon(notif.type)}
                     {notif.type}
                  </span>
                  <span className="text-sm font-black text-on-surface tracking-tight group-hover:text-primary transition-colors">{notif.title}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono font-bold opacity-60 flex-shrink-0 bg-surface-container/60 px-3 py-1 rounded-lg">
                   <Clock className="w-3.5 h-3.5" />
                   {notif.createdAt}
                </div>
              </div>
              <p className="text-sm text-on-surface-variant font-medium leading-relaxed max-w-3xl pr-8">{notif.message}</p>
            </div>

            {/* Action Buttons Overlay */}
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-background p-2 rounded-2xl shadow-2xl border border-border/20">
              {!notif.isRead && (
                <button onClick={() => markRead(notif.id)} title="Acknowledge"
                  className="p-2.5 rounded-xl hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all">
                  <CheckCheck className="w-5 h-5" />
                </button>
              )}
              <button onClick={() => remove(notif.id)} title="Delete Log"
                className="p-2.5 rounded-xl hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* ── Operational Insight Card ────────────────────────────────────── */}
      <div className="bento-card p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden backdrop-blur-xl group">
         <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
         <div className="flex items-center gap-4 relative z-10 text-center sm:text-left">
           <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform duration-500 shadow-inner">
             <Bell className="w-6 h-6" />
           </div>
           <div>
             <h4 className="text-sm font-black text-on-surface uppercase tracking-tight">Notification Calibration</h4>
             <p className="text-xs text-muted-foreground mt-0.5">Control how and when you receive system authorizations and event alerts.</p>
           </div>
         </div>
         <button className="px-6 py-3 bg-surface-container hover:bg-surface-bright rounded-2xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant border border-border/40 shadow-sm transition-all whitepulse whitespace-nowrap relative z-10 active:scale-95">
           Configure Comms Protocol
         </button>
      </div>
    </div>
  );
};

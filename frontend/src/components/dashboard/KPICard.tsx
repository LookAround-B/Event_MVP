import React from "react";
import { LucideIcon, Trophy, Settings, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subText?: string;
  icon?: LucideIcon;
  trend?: { value: string; isUp: boolean };
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title, value, subText, icon: Icon, trend, variant = "outline", className,
}) => {
  if (variant === "primary") {
    return (
      <div className={cn("h-full rounded-2xl bg-primary p-5 flex flex-col justify-between relative overflow-hidden group border-beam", className)}
        style={{ boxShadow: "0 0 40px -10px hsl(var(--primary)/0.35)" }}>
        <div className="absolute -right-5 -top-5 w-28 h-28 rounded-full border-2 border-primary-foreground/10 group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute -right-1 top-10 w-14 h-14 rounded-full border border-primary-foreground/10 group-hover:scale-125 transition-transform duration-700" />
        <div className="absolute right-4 -bottom-4 w-20 h-20 rounded-full bg-primary-foreground/10 group-hover:scale-110 transition-transform duration-500" />
        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            {Icon ? <Icon className="w-4 h-4 text-primary-foreground" /> : <Trophy className="w-4 h-4 text-primary-foreground" />}
          </div>
          <span className="text-sm font-bold text-primary-foreground/90">{title}</span>
        </div>
        <div className="relative mt-auto pt-4">
          <div className="flex items-baseline gap-2.5">
            <span className="text-4xl font-black text-primary-foreground tracking-tight leading-none">{value}</span>
            {trend && (
              <span className="text-[11px] font-bold bg-primary-foreground/25 text-primary-foreground px-2.5 py-1 rounded-full">
                {trend.value}
              </span>
            )}
          </div>
          {subText && <p className="text-sm text-primary-foreground/65 mt-1.5">{subText}</p>}
        </div>
      </div>
    );
  }

  if (variant === "secondary") {
    return (
      <div className={cn("h-full rounded-2xl relative overflow-hidden flex flex-col p-5", className)}
        style={{
          background: "linear-gradient(145deg, hsl(253,38%,16%) 0%, hsl(253,28%,11%) 55%, hsl(253,48%,9%) 100%)",
          border: "1px solid hsl(253,45%,28%,0.4)",
          boxShadow: "0 0 40px -12px hsla(253,90%,73%,0.25)",
        }}>
        <div className="absolute inset-0 stripe-pattern opacity-[0.12] pointer-events-none" />
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-[80px] pointer-events-none"
          style={{ background: "hsla(253,90%,73%,0.18)" }} />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">{title}</h3>
            {trend && (
              <div className="text-[10px] text-white/50 bg-white/10 rounded-full px-3 py-1 border border-white/15">
                {trend.value}
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-secondary tracking-tight leading-none">{value}</span>
          </div>
          {subText && (
            <div className="mt-3 rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-[10px] text-white/40 mb-0.5">{subText}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full bento-card p-5 flex flex-col justify-between group hover:border-primary/25 transition-colors duration-300", className)}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center">
          {Icon ? <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" /> : <Settings className="w-4 h-4 text-muted-foreground group-hover:rotate-90 transition-transform duration-500" />}
        </div>
        <span className="text-sm font-semibold text-on-surface">{title}</span>
      </div>
      <div className="mt-auto pt-4 flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-on-surface tracking-tight leading-none">{value}</span>
          {trend && (
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5",
              trend.isUp ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>
              {trend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend.value}
            </span>
          )}
        </div>
        {subText && <p className="text-sm text-muted-foreground">{subText}</p>}
      </div>
    </div>
  );
};

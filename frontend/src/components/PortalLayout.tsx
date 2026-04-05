
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Bell, LogOut, Moon, Shield, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PortalNavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
};

export type PortalNavGroup = {
  label: string;
  items: PortalNavItem[];
};

interface PortalSidebarProps {
  groups: PortalNavGroup[];
  activeTab: string;
  onTabChange: (id: string) => void;
  brandLabel: string;
  brandSub: string;
  user: { name: string; subtitle: string; initial: string };
  onSignOut: () => void;
}

// ─── Decorative stars ─────────────────────────────────────────────────────────

const STARS = [
  [12, 8], [25, 45], [40, 18], [55, 72], [70, 30],
  [85, 60], [15, 85], [60, 5], [90, 40], [35, 92],
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function PortalSidebar({ groups, activeTab, onTabChange, brandLabel, brandSub, user, onSignOut }: PortalSidebarProps) {
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border sidebar-custom">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full blur-[80px] opacity-15 bg-primary" />
        <div
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-36 h-36 rounded-full blur-[60px] opacity-[0.08]"
          style={{ background: "hsl(253,90%,73%)" }}
        />
        <div className="absolute inset-0 sidebar-dot-pattern opacity-[0.03]" />
        {!collapsed &&
          STARS.map(([top, left], i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{ top: `${top}%`, left: `${left}%`, width: i % 3 === 0 ? 2.5 : 1.5, height: i % 3 === 0 ? 2.5 : 1.5, opacity: 0.05 + (i % 4) * 0.04 }}
            />
          ))}
      </div>

      {/* Header */}
      <div className={cn("flex items-center py-5 px-4 border-b border-sidebar-border z-10", collapsed && "justify-center px-0 py-4")}>
        {!collapsed ? (
          <div className="flex flex-col leading-tight animate-in fade-in zoom-in duration-300">
            <span className="text-[17px] font-black tracking-tight">
              <span className="text-on-surface">EQ</span>
              <span className="text-primary">WI</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50 font-semibold mt-0.5">
              {brandSub}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center animate-in fade-in zoom-in duration-300">
            <span className="text-[15px] font-black tracking-tight">
              <span className="text-on-surface">EQ</span>
              <span className="text-primary">WI</span>
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <SidebarContent className="px-2.5 py-3 relative z-10 scrollbar-none">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="p-0 mb-0.5">
            {!collapsed && (
              <div className="flex items-center gap-2 px-3 mb-1 mt-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 select-none whitespace-nowrap">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-border/20" />
              </div>
            )}
            {collapsed && <div className="my-1 h-px bg-border/20" />}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <button
                          onClick={() => onTabChange(item.id)}
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            "relative flex items-center gap-3 rounded-xl overflow-hidden w-full",
                            collapsed && "justify-center",
                            isActive ? "text-primary font-semibold" : "text-sidebar-foreground"
                          )}
                        >
                          {isActive && <span className="absolute inset-0 rounded-xl bg-primary/10 pointer-events-none" />}
                          {isActive && !collapsed && (
                            <span
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                              style={{ background: "hsl(var(--primary))", boxShadow: "0 0 10px hsl(var(--primary)/0.7)" }}
                            />
                          )}
                          <item.icon className={cn("flex-shrink-0 transition-all duration-200", collapsed ? "w-5 h-5" : "w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                          {!collapsed && <span className="text-sm flex-1 truncate text-left">{item.label}</span>}
                          {!collapsed && item.badge != null && item.badge > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary flex-shrink-0">
                              {item.badge}
                            </span>
                          )}
                          {isActive && !collapsed && (
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-primary" style={{ boxShadow: "0 0 6px hsl(var(--primary)/0.8)" }} />
                          )}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-3 border-t border-sidebar-border relative z-10">
        {!collapsed ? (
          <div className="rounded-xl p-3 sidebar-user-card">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 border border-primary/30 text-primary"
                style={{ background: "hsl(var(--primary)/0.12)" }}
              >
                {user.initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-on-surface truncate">{user.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Shield className="w-2.5 h-2.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{user.subtitle}</span>
                </div>
                <p className="text-[10px] text-muted-foreground/50 mt-1 font-semibold tracking-wider">Powered by LookAround.</p>
              </div>
              <button
                onClick={onSignOut}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onSignOut}
            className="w-10 h-10 mx-auto flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

// ─── Full Portal Layout ───────────────────────────────────────────────────────

interface PortalLayoutProps {
  groups: PortalNavGroup[];
  activeTab: string;
  onTabChange: (id: string) => void;
  title: string;
  brandLabel: string;
  brandSub: string;
  user: { name: string; subtitle: string; initial: string };
  onSignOut: () => void;
  /** localStorage key used to persist this portal's independent theme */
  themeKey: string;
  children: React.ReactNode;
  onNotificationClick?: () => void;
}

export function PortalLayout({ groups, activeTab, onTabChange, title, brandLabel, brandSub, user, onSignOut, themeKey, children, onNotificationClick }: PortalLayoutProps) {
  const [portalTheme, setPortalTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(themeKey);
    if (saved === "light" || saved === "dark") {
      setPortalTheme(saved);
    }
    setMounted(true);
  }, [themeKey]);

  const toggleTheme = () => {
    const next = portalTheme === "dark" ? "light" : "dark";
    setPortalTheme(next);
    localStorage.setItem(themeKey, next);
  };

  return (
    <div data-theme={mounted ? portalTheme : "dark"} data-portal>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <PortalSidebar
            groups={groups}
            activeTab={activeTab}
            onTabChange={onTabChange}
            brandLabel={brandLabel}
            brandSub={brandSub}
            user={user}
            onSignOut={onSignOut}
          />

          <div className="flex-1 flex flex-col min-h-screen min-w-0 relative">
            {/* Ambient blobs */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.04] bg-primary" />
              <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.03]" style={{ background: "hsl(253,90%,73%)" }} />
            </div>
            <div className="pointer-events-none fixed inset-0 dot-grid opacity-[0.018] z-0" />

            {/* Top bar */}
            <header
              className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 border-b border-border/40 backdrop-blur-xl"
              style={{ background: "hsl(var(--background)/0.85)" }}
            >
              <div className="flex items-center gap-2 sm:gap-4">
                <SidebarTrigger className="text-muted-foreground hover:text-on-surface transition-colors" />
                <h2 className="text-base sm:text-lg font-extrabold gradient-text tracking-tight">{title}</h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Portal-independent theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl hover:bg-surface-container transition-colors text-muted-foreground hover:text-on-surface border border-border/50"
                  aria-label="Toggle theme"
                >
                  {portalTheme === "dark"
                    ? <Sun className="w-4 h-4" />
                    : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={onNotificationClick}
                  className="relative p-2 sm:p-2.5 rounded-xl hover:bg-surface-container transition-colors text-muted-foreground border border-border/50 cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary pulse-ring" />
                </button>
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm font-bold border border-primary/30 shimmer-card"
                  style={{ background: "hsl(var(--primary)/0.15)", color: "hsl(var(--primary))" }}
                >
                  {user.initial}
                </div>
              </div>
            </header>

            {/* Page content */}
            <main className="flex-1 p-3 sm:p-6 overflow-auto relative z-10">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}

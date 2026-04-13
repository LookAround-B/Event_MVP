
import {
  LayoutDashboard, Calendar, Building2, Users,
  UserCog, Settings, User, LogOut,
  DollarSign, Activity, Shield, ClipboardList, CheckSquare,
  ScrollText, BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAppearance } from "@/contexts/AppearanceContext";
import { useAuth } from "@/hooks/useAuth";

type NavItem = { title: string; url: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { label: string; items: NavItem[] };

const adminNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Events", url: "/events", icon: Calendar },
      { title: "Registrations", url: "/registrations", icon: ClipboardList },
      { title: "Financial", url: "/financial", icon: DollarSign },
      { title: "Reports", url: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Community",
    items: [
      { title: "Clubs", url: "/clubs", icon: Building2 },
      { title: "Riders", url: "/riders", icon: Users },
      { title: "Horses", url: "/horses", icon: Activity },
    ],
  },
  {
    label: "Admin",
    items: [
      { title: "Users", url: "/users", icon: UserCog },
      { title: "Approvals", url: "/admin/approvals", icon: CheckSquare },
      { title: "Audit Log", url: "/audit", icon: ScrollText },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

const clubNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Events", url: "/events", icon: Calendar },
      { title: "Registrations", url: "/registrations", icon: ClipboardList },
      { title: "Financial", url: "/financial", icon: DollarSign },
      { title: "Reports", url: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Community",
    items: [
      { title: "Riders", url: "/riders", icon: Users },
      { title: "Horses", url: "/horses", icon: Activity },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Settings", url: "/settings", icon: Settings },
      { title: "Profile", url: "/account", icon: User },
    ],
  },
];

const riderNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Events", url: "/events", icon: Calendar },
      { title: "Registrations", url: "/registrations", icon: ClipboardList },
      { title: "Reports", url: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Community",
    items: [
      { title: "Club", url: "/clubs", icon: Building2 },
      { title: "Riders", url: "/riders", icon: Users },
      { title: "Horses", url: "/horses", icon: Activity },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Settings", url: "/settings", icon: Settings },
      { title: "Profile", url: "/account", icon: User },
    ],
  },
];

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  club: "Club",
  rider: "Rider",
};

const STARS = [
  [12, 8], [25, 45], [40, 18], [55, 72], [70, 30],
  [85, 60], [15, 85], [60, 5], [90, 40], [35, 92],
];

export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const router = useRouter();
  const pathname = router.pathname;
  useAppearance();
  const { user, role, logout } = useAuth();

  const navGroups =
    role === "admin" ? adminNavGroups :
    role === "club"  ? clubNavGroups  :
    riderNavGroups;

  const displayName = user?.email ?? "User";
  const initial = displayName.charAt(0).toUpperCase();
  const roleLabel = ROLE_LABEL[role ?? "rider"] ?? "User";

  // Prefetch all nav routes on mount for instant navigation
  useEffect(() => {
    const allUrls = navGroups.flatMap((g) => g.items.map((i) => i.url));
    allUrls.forEach((url) => router.prefetch(url));
  }, [router, navGroups]);

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
              style={{
                top: `${top}%`,
                left: `${left}%`,
                width: i % 3 === 0 ? 2.5 : 1.5,
                height: i % 3 === 0 ? 2.5 : 1.5,
                opacity: 0.05 + (i % 4) * 0.04,
              }}
            />
          ))}
      </div>

      {/* Header (Logo) */}
      <div
        className={cn(
          "flex items-center py-5 px-4 border-b border-sidebar-border z-10",
          collapsed && "justify-center px-0 py-4"
        )}
      >
        {!collapsed ? (
          <div className="flex flex-col leading-tight animate-in fade-in zoom-in duration-300">
            <span className="text-[17px] font-black tracking-tight">
              <span className="text-on-surface">EQ</span>
              <span className="text-primary">WI</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50 font-semibold mt-0.5">
              Event Platform
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
        {navGroups.map((group) => (
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
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link
                          href={item.url}
                          title={collapsed ? item.title : undefined}
                          className={cn(
                            "relative flex items-center gap-3 rounded-xl overflow-hidden",
                            collapsed && "justify-center",
                            isActive
                              ? "text-primary font-semibold"
                              : "text-sidebar-foreground"
                          )}
                        >
                          {/* Active bg */}
                          {isActive && (
                            <span className="absolute inset-0 rounded-xl bg-primary/10 pointer-events-none" />
                          )}
                          {/* Left accent bar */}
                          {isActive && !collapsed && (
                            <span
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                              style={{
                                background: "hsl(var(--primary))",
                                boxShadow: "0 0 10px hsl(var(--primary)/0.7)",
                              }}
                            />
                          )}
                          {/* Icon */}
                          <item.icon
                            className={cn(
                              "flex-shrink-0 transition-all duration-200",
                              collapsed ? "w-5 h-5" : "w-4 h-4",
                              isActive
                                ? "text-primary"
                                : "text-muted-foreground group-hover/nav:text-on-surface"
                            )}
                          />
                          {/* Label */}
                          {!collapsed && (
                            <span className="text-sm flex-1 truncate">{item.title}</span>
                          )}
                          {/* Active dot */}
                          {isActive && !collapsed && (
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-primary"
                              style={{ boxShadow: "0 0 6px hsl(var(--primary)/0.8)" }}
                            />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer: user card */}
      <SidebarFooter className="p-3 border-t border-sidebar-border relative z-10">
        {!collapsed ? (
          <div className="rounded-xl p-3 sidebar-user-card">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 border border-primary/30 text-primary"
                style={{ background: "hsl(var(--primary)/0.12)" }}
              >
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-on-surface truncate">{displayName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Shield className="w-2.5 h-2.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{roleLabel}</span>
                </div>
                <p className="text-[10px] text-muted-foreground/50 mt-1 font-semibold tracking-wider">Powered by LookAround.</p>
              </div>
              <button
                onClick={logout}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={logout}
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

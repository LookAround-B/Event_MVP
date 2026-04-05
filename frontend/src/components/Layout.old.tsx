import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Menu, LogOut, Home, Calendar, Users, TrendingUp,
  Settings, ScrollText, Box, Bell, BarChart2, CheckSquare, User,
  ChevronLeft, Search, Shield, ClipboardList, DollarSign, Activity,
  Building2, UserCog,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

/* ─── Nav Groups (matching design-first-hub AppSidebar) ─── */
const navGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Events', href: '/events', icon: Calendar },
      { name: 'Registrations', href: '/registrations', icon: ClipboardList },
      { name: 'Financial', href: '/financial', icon: DollarSign },
      { name: 'Reports', href: '/reports', icon: BarChart2 },
    ],
  },
  {
    label: 'Community',
    items: [
      { name: 'Clubs', href: '/clubs', icon: Building2 },
      { name: 'Riders', href: '/riders', icon: Users },
      { name: 'Horses', href: '/horses', icon: Activity },
    ],
  },
  {
    label: 'Admin',
    items: [
      { name: 'Users', href: '/users', icon: UserCog },
      { name: 'Approvals', href: '/admin/approvals', icon: CheckSquare },
      { name: 'Audit Log', href: '/audit', icon: ScrollText },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

const STARS = [
  [12, 8], [25, 45], [40, 18], [55, 72], [70, 30],
  [85, 60], [15, 85], [60, 5], [90, 40], [35, 92],
];

/* ─── Page titles ─── */
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/events': 'Events',
  '/registrations': 'Registrations',
  '/financial': 'Financial',
  '/reports': 'Reports',
  '/clubs': 'Clubs',
  '/riders': 'Riders',
  '/horses': 'Horses',
  '/users': 'Users',
  '/admin/approvals': 'Approvals',
  '/notifications': 'Notifications',
  '/audit': 'Audit Log',
  '/settings': 'Settings',
  '/account': 'Profile',
};

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/auth/login');
  };

  const title = pageTitles[router.pathname] || 'Dashboard';

  if (!isClient) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-64 bg-surface-lowest"></div>
        <div className="flex-1"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══ Sidebar ═══ */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-[72px]'
        } flex flex-col transition-all duration-300 relative z-30 ${
          isMobile && !sidebarOpen ? 'hidden' : ''
        } md:flex bg-sidebar border-r border-sidebar-border`}
      >
        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full blur-[80px] opacity-15 bg-primary" />
          <div
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-36 h-36 rounded-full blur-[60px] opacity-[0.08]"
            style={{ background: 'hsl(253,90%,73%)' }}
          />
          <div className="absolute inset-0 sidebar-dot-pattern opacity-[0.03]" />
          {!sidebarOpen ? null : STARS.map(([top, left], i) => (
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

        {/* Brand header */}
        <div
          className={`flex items-center py-5 px-4 border-b border-sidebar-border z-10 ${
            !sidebarOpen ? 'justify-center px-2 py-4' : ''
          }`}
        >
          {sidebarOpen ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col leading-tight">
                <span className="text-[17px] font-black tracking-tight">
                  <span className="text-on-surface">EQ</span>
                  <span className="text-primary">WI</span>
                </span>
                <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50 font-semibold mt-0.5">
                  Event Platform
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg text-muted-foreground hover:bg-surface-container hover:text-on-surface transition-colors"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-surface-container hover:text-on-surface transition-colors"
              aria-label="Expand sidebar"
            >
              <Menu size={18} />
            </button>
          )}
        </div>

        {/* Navigation with grouped sections */}
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto scrollbar-none relative z-10">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-0.5">
              {sidebarOpen ? (
                <div className="flex items-center gap-2 px-3 mb-1 mt-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 select-none whitespace-nowrap">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-border/20" />
                </div>
              ) : (
                <div className="my-1 h-px bg-border/20" />
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = router.pathname === item.href ||
                    (item.href !== '/dashboard' && router.pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`relative flex items-center gap-3 rounded-xl overflow-hidden transition-all duration-200 ${
                        sidebarOpen ? 'px-3 py-2.5' : 'justify-center py-2.5 px-2'
                      } ${isActive ? 'text-primary font-semibold' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-on-surface'}`}
                      title={!sidebarOpen ? item.name : undefined}
                    >
                      {/* Active background */}
                      {isActive && (
                        <span className="absolute inset-0 rounded-xl bg-primary/10 pointer-events-none" />
                      )}
                      {/* Left accent bar */}
                      {isActive && sidebarOpen && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                          style={{
                            background: 'hsl(var(--primary))',
                            boxShadow: '0 0 10px hsl(var(--primary)/0.7)',
                          }}
                        />
                      )}
                      <Icon
                        size={sidebarOpen ? 16 : 20}
                        className={`flex-shrink-0 transition-all duration-200 ${
                          isActive ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      />
                      {sidebarOpen && (
                        <span className="text-sm flex-1 truncate relative z-10">{item.name}</span>
                      )}
                      {/* Active dot */}
                      {isActive && sidebarOpen && (
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-primary"
                          style={{ boxShadow: '0 0 6px hsl(var(--primary)/0.8)' }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: user card */}
        <div className="p-3 border-t border-sidebar-border relative z-10">
          {sidebarOpen ? (
            <div className="rounded-xl p-3 sidebar-user-card">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 border border-primary/30 text-primary"
                  style={{ background: 'hsl(var(--primary)/0.12)' }}
                >
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">Admin User</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Shield className="w-2.5 h-2.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Administrator</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 mt-1 font-semibold tracking-wider">Powered by LookAround.</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-10 h-10 mx-auto flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* ═══ Main Content ═══ */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 relative">

        {/* Ambient background blobs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.04] bg-primary" />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.03]"
            style={{ background: 'hsl(253,90%,73%)' }} />
        </div>

        {/* Dot-grid background */}
        <div className="pointer-events-none fixed inset-0 dot-grid opacity-[0.018] z-0" />

        {/* Top bar */}
        <header
          className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 border-b border-border/40 backdrop-blur-xl"
          style={{ background: 'hsl(var(--background)/0.85)' }}
        >
          {/* Left: mobile trigger + title */}
          <div className="flex items-center gap-2 sm:gap-4">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg text-muted-foreground hover:text-on-surface transition-colors md:hidden"
                aria-label="Toggle menu"
              >
                <Menu size={20} />
              </button>
            )}
            <h2 className="text-base sm:text-lg font-extrabold gradient-text tracking-tight">
              {title}
            </h2>
          </div>

          {/* Right: search + actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 w-36 lg:w-52 transition-all rounded-xl border border-border/50"
                style={{ background: 'hsl(var(--surface-container))' }}
              />
            </div>

            {/* Notification bell with pulse */}
            <Link
              href="/notifications"
              className="relative p-2 sm:p-2.5 rounded-xl hover:bg-surface-container transition-colors text-muted-foreground hover:text-on-surface border border-border/50"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary pulse-ring" />
            </Link>

            {/* Avatar */}
            <Link
              href="/account"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm font-bold border border-primary/30 shimmer-card hover:opacity-80 transition-opacity"
              style={{ background: 'hsl(var(--primary)/0.15)', color: 'hsl(var(--primary))' }}
            >
              A
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-6 overflow-auto relative z-10">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}

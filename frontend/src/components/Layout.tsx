import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Menu, X, LogOut, Home, Calendar, Users, TrendingUp,
  Settings, FileText, Box, Bell, BarChart2, CheckCircle, User,
  ChevronLeft,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

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

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Profile', href: '/account', icon: User },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Clubs', href: '/clubs', icon: Users },
    { name: 'Riders', href: '/riders', icon: Users },
    { name: 'Horses', href: '/horses', icon: Box },
    { name: 'Registrations', href: '/registrations', icon: Users },
    { name: 'Approvals', href: '/registrations/approvals', icon: CheckCircle },
    { name: 'Financial', href: '/financial', icon: TrendingUp },
    { name: 'Reports', href: '/reports', icon: BarChart2 },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Admin', href: '/admin/approvals', icon: CheckCircle },
    { name: 'Audit Logs', href: '/audit', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/auth/login');
  };

  if (!isClient) {
    return (
      <div className="flex h-screen" style={{ background: 'hsl(240,7%,4%)' }}>
        <div className="w-64" style={{ background: 'hsl(240,7%,6%)' }}></div>
        <div className="flex-1"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'hsl(var(--surface-background))' }}>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-[72px]'
        } flex flex-col transition-all duration-300 relative z-30 ${
          isMobile && !sidebarOpen ? 'hidden' : ''
        } md:flex`}
        style={{
          background: 'hsl(var(--surface-lowest))',
          borderRight: '1px solid hsl(var(--border) / 0.5)',
        }}
      >
        {/* Brand */}
        <div
          className="flex items-center justify-between px-4 py-5"
          style={{ borderBottom: '1px solid hsl(var(--border) / 0.3)' }}
        >
          {sidebarOpen && (
            <h1 className="text-lg font-bold" style={{ color: 'hsl(var(--primary))' }}>
              Equestrian
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'hsl(var(--surface-bright))')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname ? router.pathname.startsWith(item.href) : false;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl transition-all duration-200 group ${
                  sidebarOpen ? 'px-3 py-2.5' : 'justify-center px-0 py-3'
                }`}
                style={
                  isActive
                    ? {
                        background: 'hsl(var(--primary) / 0.12)',
                        color: 'hsl(var(--primary))',
                        boxShadow: 'inset 3px 0 0 hsl(var(--primary))',
                      }
                    : { color: 'hsl(var(--muted-foreground))' }
                }
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'hsl(var(--surface-bright))';
                    e.currentTarget.style.color = 'hsl(var(--on-surface))';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'hsl(var(--muted-foreground))';
                  }
                }}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="font-medium text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)' }}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 rounded-xl py-2.5 transition-colors font-medium text-sm ${
              sidebarOpen ? 'px-3' : 'justify-center px-0'
            }`}
            style={{ color: 'hsl(var(--muted-foreground))' }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'hsl(var(--error) / 0.1)';
              e.currentTarget.style.color = 'hsl(var(--error))';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'hsl(var(--muted-foreground))';
            }}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header
          className="px-6 py-4 md:px-8 md:py-5 flex items-center justify-between"
          style={{
            background: 'hsl(var(--surface-lowest))',
            borderBottom: '1px solid hsl(var(--border) / 0.5)',
          }}
        >
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'hsl(var(--on-surface))' }}>
              Equestrian Event Management
            </h1>
            <p className="text-xs md:text-sm mt-0.5 hidden sm:block" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Welcome to your event management dashboard
            </p>
          </div>

          {/* Mobile menu toggle */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg md:hidden"
              style={{ color: 'hsl(var(--on-surface))' }}
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
          )}
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}

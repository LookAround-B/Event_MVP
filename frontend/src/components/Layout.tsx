import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiMenu, FiX, FiLogOut, FiHome, FiCalendar, FiUsers, FiTrendingUp, FiSettings, FiFileText, FiBox } from 'react-icons/fi';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Events', href: '/events', icon: FiCalendar },
    { name: 'Clubs', href: '/clubs', icon: FiUsers },
    { name: 'Riders', href: '/riders', icon: FiUsers },
    { name: 'Horses', href: '/horses', icon: FiBox },
    { name: 'Registrations', href: '/registrations', icon: FiUsers },
    { name: 'Financial', href: '/financial', icon: FiTrendingUp },
    { name: 'Users', href: '/users', icon: FiUsers },
    { name: 'Audit Logs', href: '/audit', icon: FiFileText },
    { name: 'Settings', href: '/settings', icon: FiSettings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/auth/login');
  };

  if (!isClient) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="w-64 glass border-r border-white border-opacity-20"></div>
        <div className="flex-1">
          <div className="glass border-b border-white border-opacity-20 p-6"></div>
          <div className="flex-1 overflow-auto">
            <div className="p-6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute top-0 -right-40 w-80 h-80 bg-secondary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-8 left-20 w-80 h-80 bg-accent-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } glass border-r border-white border-opacity-20 transition-all duration-300 flex flex-col shadow-glass-lg relative z-10`}
      >
        <div className="p-6 flex items-center justify-between border-b border-white border-opacity-10">
          {sidebarOpen && (
            <h1 className="text-xl font-black bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              Equestrian
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-white hover:bg-opacity-10 p-2 rounded-lg transition text-gray-200"
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname ? router.pathname.startsWith(item.href) : false;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-white hover:bg-opacity-10'
                }`}
              >
                {Icon && <Icon className="w-5 h-5" />}
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white border-opacity-10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-red-500 hover:bg-opacity-20 transition text-gray-300 hover:text-red-300 font-medium"
          >
            <FiLogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-0">
        {/* Top Bar */}
        <div className="glass border-b border-white border-opacity-20 p-8 shadow-glass-lg">
          <h1 className="text-4xl font-black bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 bg-clip-text text-transparent mb-2">
            Equestrian Event Management
          </h1>
          <p className="text-gray-300 font-medium">Welcome to your event management dashboard</p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

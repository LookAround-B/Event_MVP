import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiMenu, FiX, FiLogOut, FiHome, FiCalendar, FiUsers, FiTrendingUp, FiSettings, FiFileText } from 'react-icons/fi';
import { GiHorseBust } from 'react-icons/gi';

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
    { name: 'Horses', href: '/horses', icon: GiHorseBust },
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
      <div className="flex h-screen bg-gray-100">
        <div className="w-64 bg-indigo-900"></div>
        <div className="flex-1">
          <div className="bg-white border-b border-gray-200 p-6"></div>
          <div className="flex-1 overflow-auto">
            <div className="p-6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-indigo-900 text-white transition-all duration-300 flex flex-col shadow-lg`}
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">Equestrian</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-indigo-800 p-2 rounded"
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname ? router.pathname.startsWith(item.href) : false;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-indigo-700 text-white'
                    : 'hover:bg-indigo-800 text-indigo-100'
                }`}
              >
                {Icon && <Icon className="w-5 h-5" />}
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-indigo-800 transition text-indigo-100"
          >
            <FiLogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Equestrian Event Management</h1>
          <p className="text-gray-600 mt-1">Welcome to your event management dashboard</p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

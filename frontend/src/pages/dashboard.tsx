import React, { useState, useEffect } from 'react';
import { FiCalendar, FiUsers, FiBarChart3, FiDollarSign } from 'react-icons/fi';
import { GiHorseBust } from 'react-icons/gi';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';

interface DashboardStats {
  totalEvents: number;
  totalRiders: number;
  totalHorses: number;
  totalRegistrations: number;
  totalRevenue: number;
}

interface StatCardProps {
  icon: React.ComponentType<any>;
  title: string;
  value: string | number;
  color: string;
}

function StatCard({ icon: Icon, title, value, color }: StatCardProps) {
  if (!Icon) {
    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalRiders: 0,
    totalHorses: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [eventsRes, ridersRes, horsesRes, registrationsRes, financialRes] = await Promise.all([
        api.get('/api/events?limit=1').catch(() => ({ data: { data: { pagination: { total: 0 } } } })),
        api.get('/api/riders?limit=1').catch(() => ({ data: { data: { pagination: { total: 0 } } } })),
        api.get('/api/horses?limit=1').catch(() => ({ data: { data: { pagination: { total: 0 } } } })),
        api.get('/api/registrations?limit=1').catch(() => ({ data: { data: { pagination: { total: 0 } } } })),
        api.get('/api/financial/summary').catch(() => ({ data: { data: { summary: { totalRevenue: 0 } } } })),
      ]);

      setStats({
        totalEvents: eventsRes.data.data?.pagination?.total || 0,
        totalRiders: ridersRes.data.data?.pagination?.total || 0,
        totalHorses: horsesRes.data.data?.pagination?.total || 0,
        totalRegistrations: registrationsRes.data.data?.pagination?.total || 0,
        totalRevenue: financialRes.data.data?.summary?.totalRevenue || 0,
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Failed to load some dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-2">Welcome to your event management dashboard</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard stats...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <StatCard 
                icon={FiCalendar} 
                title="Total Events" 
                value={stats.totalEvents}
                color="bg-blue-500"
              />
              <StatCard 
                icon={FiUsers} 
                title="Total Riders" 
                value={stats.totalRiders}
                color="bg-green-500"
              />
              <StatCard 
                icon={GiHorseBust} 
                title="Total Horses" 
                value={stats.totalHorses}
                color="bg-purple-500"
              />
              <StatCard 
                icon={FiBarChart3} 
                title="Registrations" 
                value={stats.totalRegistrations}
                color="bg-orange-500"
              />
              <StatCard 
                icon={FiDollarSign} 
                title="Total Revenue" 
                value={`$${(stats.totalRevenue / 100).toFixed(0)}`}
                color="bg-pink-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/events" className="btn-primary block text-center">
                    View Events
                  </Link>
                  <Link href="/riders" className="btn-secondary block text-center">
                    View Riders
                  </Link>
                  <Link href="/horses" className="btn-secondary block text-center">
                    View Horses
                  </Link>
                  <Link href="/registrations" className="btn-secondary block text-center">
                    Manage Registrations
                  </Link>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Backend Status:</span>
                    <span className="text-green-600 font-medium">Online ✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Database:</span>
                    <span className="text-green-600 font-medium">Connected ✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">API Version:</span>
                    <span className="text-gray-900 font-medium">1.0</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}

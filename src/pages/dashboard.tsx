import React, { useEffect, useState } from 'react';
import { FiCalendar, FiUsers, FiBarChart3, FiTrendingUp } from 'react-icons/fi';
import { GiHorseBust } from 'react-icons/gi';
import Link from 'next/link';

interface DashboardStats {
  totalEvents: number;
  totalRiders: number;
  totalHorses: number;
  totalRegistrations: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 12,
    totalRiders: 45,
    totalHorses: 38,
    totalRegistrations: 28,
  });

  const StatCard = ({ icon: Icon, title, value, color }: any) => (
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

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-2">Welcome to your event management dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/events/create" className="btn-primary block text-center">
              Create Event
            </Link>
            <Link href="/riders/create" className="btn-secondary block text-center">
              Add Rider
            </Link>
            <Link href="/horses/create" className="btn-secondary block text-center">
              Add Horse
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b">
              <p className="text-sm text-gray-600">Event "Spring Championship" created</p>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Today</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b">
              <p className="text-sm text-gray-600">New rider registered: John Smith</p>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Yesterday</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Horse "Thunder" added to inventory</p>
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">2 days ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
          <FiTrendingUp className="w-5 h-5 text-green-500" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-gray-600 text-sm">This Month</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₹45,000</p>
            <p className="text-green-600 text-sm mt-1">+12% from last month</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Pending Payments</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₹12,500</p>
            <p className="text-gray-600 text-sm mt-1">5 pending invoices</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Total Revenue YTD</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₹2,34,000</p>
            <p className="text-blue-600 text-sm mt-1">View detailed report</p>
          </div>
        </div>
      </div>
    </div>
  );
}

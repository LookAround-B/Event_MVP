import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { FiCalendar, FiUsers, FiBarChart, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import { FiBox } from 'react-icons/fi';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface KpiCards {
  totalEvents: number;
  clubsRegistered: number;
  ridersRegistered: number;
  horseCount: number;
  totalRevenue: number;
  collectibleAmount: number;
}

interface EventChartData {
  eventName: string;
  unpaidRegistrations: number;
  totalRiders: number;
  totalHorses: number;
}

interface MonthlyRevenueData {
  month: string;
  revenue: number;
}

interface RegistrationTrendData {
  date: string;
  registrations: number;
}

interface ClubStats {
  clubName: string;
  registrations: number;
}

interface RiderStats {
  riderName: string;
  registrations: number;
}

interface StatCardProps {
  icon: React.ComponentType<any>;
  title: string;
  value: string | number;
  color: string;
}

function StatCard({ icon: Icon, title, value, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardContent() {
  const [kpiCards, setKpiCards] = useState<KpiCards>({
    totalEvents: 0,
    clubsRegistered: 0,
    ridersRegistered: 0,
    horseCount: 0,
    totalRevenue: 0,
    collectibleAmount: 0,
  });
  const [eventChartData, setEventChartData] = useState<EventChartData[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueData[]>([]);
  const [registrationTrend, setRegistrationTrend] = useState<RegistrationTrendData[]>([]);
  const [topClubs, setTopClubs] = useState<ClubStats | null>(null);
  const [topRiders, setTopRiders] = useState<RiderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/dashboard');
      const data = res.data.data;

      setKpiCards(data.kpiCards);
      setEventChartData(data.charts.eventBreakdown || []);
      setMonthlyRevenue(data.charts.monthlyRevenue || []);
      setRegistrationTrend(data.charts.registrationTrend || []);
      setTopClubs(data.charts.mostActiveClub);
      setTopRiders(data.charts.mostActiveRider);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <ProtectedRoute>
      <Head><title>Dashboard | Equestrian Events</title></Head>
      <div className="space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-15 border border-red-400 border-opacity-30 text-red-300 backdrop-blur-sm px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading dashboard stats...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <StatCard 
                icon={FiCalendar} 
                title="Total Events" 
                value={kpiCards.totalEvents}
                color="bg-blue-500"
              />
              <StatCard 
                icon={FiUsers} 
                title="Clubs Registered" 
                value={kpiCards.clubsRegistered}
                color="bg-teal-500"
              />
              <StatCard 
                icon={FiUsers} 
                title="Total Riders" 
                value={kpiCards.ridersRegistered}
                color="bg-green-500"
              />
              <StatCard 
                icon={FiBox} 
                title="Total Horses" 
                value={kpiCards.horseCount}
                color="bg-purple-500"
              />
              <StatCard 
                icon={FiDollarSign} 
                title="Total Revenue" 
                value={`₹${kpiCards.totalRevenue.toLocaleString('en-IN')}`}
                color="bg-pink-500"
              />
              <StatCard 
                icon={FiTrendingUp} 
                title="Collectible" 
                value={`₹${kpiCards.collectibleAmount.toLocaleString('en-IN')}`}
                color="bg-orange-500"
              />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Event Breakdown Chart */}
              <div className="glass p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Event Breakdown</h3>
                {eventChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={eventChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="eventName" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="unpaidRegistrations" fill="#FF6B6B" name="Unpaid" />
                      <Bar dataKey="totalRiders" fill="#4ECDC4" name="Riders" />
                      <Bar dataKey="totalHorses" fill="#95E1D3" name="Horses" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-300">No event data available</p>
                )}
              </div>

              {/* Monthly Revenue Chart */}
              <div className="glass p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Monthly Revenue Trend</h3>
                {monthlyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                      <Line type="monotone" dataKey="revenue" stroke="#0088FE" strokeWidth={2} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-300">No revenue data available</p>
                )}
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Registration Trend */}
              <div className="glass p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Registration Trend</h3>
                {registrationTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={registrationTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="registrations" stroke="#00C49F" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-300">No registration data available</p>
                )}
              </div>

              {/* Top Active Clubs & Riders */}
              <div className="glass p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Top Active Participants</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Top Club */}
                  <div>
                    <h4 className="font-medium text-white mb-3 text-sm">Most Active Club</h4>
                    {topClubs ? (
                      <div className="flex justify-between items-center p-2 bg-white bg-opacity-5 backdrop-blur-sm rounded">
                        <span className="text-sm text-gray-200">{topClubs.clubName}</span>
                        <span className="px-2 py-1 bg-primary-500 bg-opacity-30 text-primary-200 rounded text-xs font-medium">
                          {topClubs.registrations}
                        </span>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No club data</p>
                    )}
                  </div>

                  {/* Top Rider */}
                  <div>
                    <h4 className="font-medium text-white mb-3 text-sm">Most Active Rider</h4>
                    {topRiders ? (
                      <div className="flex justify-between items-center p-2 bg-white bg-opacity-5 backdrop-blur-sm rounded">
                        <span className="text-sm text-gray-200">{topRiders.riderName}</span>
                        <span className="px-2 py-1 bg-secondary-500 bg-opacity-30 text-secondary-200 rounded text-xs font-medium">
                          {topRiders.registrations}
                        </span>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No rider data</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/events" className="block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center transition">
                    View Events
                  </Link>
                  <Link href="/riders" className="block px-4 py-2 bg-white bg-opacity-10 text-white rounded-lg hover:bg-opacity-20 text-center transition">
                    View Riders
                  </Link>
                  <Link href="/horses" className="block px-4 py-2 bg-white bg-opacity-10 text-white rounded-lg hover:bg-opacity-20 text-center transition">
                    View Horses
                  </Link>
                  <Link href="/registrations" className="block px-4 py-2 bg-white bg-opacity-10 text-white rounded-lg hover:bg-opacity-20 text-center transition">
                    Manage Registrations
                  </Link>
                </div>
              </div>

              <div className="glass p-6">
                <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Backend API:</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full"></span> Online
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Database:</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full"></span> Connected
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">API Version:</span>
                    <span className="text-white font-medium">1.0</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white border-opacity-10">
                    <span className="text-gray-300">Last Updated:</span>
                    <span className="text-white font-medium text-xs">{new Date().toLocaleTimeString()}</span>
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

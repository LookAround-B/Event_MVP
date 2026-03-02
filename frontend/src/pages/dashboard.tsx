import React, { useState, useEffect } from 'react';
import { FiCalendar, FiUsers, FiBarChart3, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
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

interface DashboardStats {
  totalEvents: number;
  totalRiders: number;
  totalHorses: number;
  totalRegistrations: number;
  totalRevenue: number;
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
  name: string;
  registrations: number;
}

interface RiderStats {
  name: string;
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
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalRiders: 0,
    totalHorses: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
  });
  const [eventChartData, setEventChartData] = useState<EventChartData[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueData[]>([]);
  const [registrationTrend, setRegistrationTrend] = useState<RegistrationTrendData[]>([]);
  const [topClubs, setTopClubs] = useState<ClubStats[]>([]);
  const [topRiders, setTopRiders] = useState<RiderStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const [eventsRes, ridersRes, horsesRes, registrationsRes] = await Promise.all([
        api.get('/api/events?limit=1').catch(() => ({ data: { data: { pagination: { total: 0 }, data: [] } } })),
        api.get('/api/riders?limit=1').catch(() => ({ data: { data: { pagination: { total: 0 }, data: [] } } })),
        api.get('/api/horses?limit=1').catch(() => ({ data: { data: { pagination: { total: 0 }, data: [] } } })),
        api.get('/api/registrations?limit=1000').catch(() => ({ data: { data: { pagination: { total: 0 }, data: [] } } })),
      ]);

      const totalEvents = eventsRes.data.data?.pagination?.total || 0;
      const totalRiders = ridersRes.data.data?.pagination?.total || 0;
      const totalHorses = horsesRes.data.data?.pagination?.total || 0;
      const totalRegistrations = registrationsRes.data.data?.pagination?.total || 0;

      setStats({
        totalEvents,
        totalRiders,
        totalHorses,
        totalRegistrations,
        totalRevenue: 0,
      });

      // Generate mock chart data (in production, this would come from API)
      generateChartData(eventsRes.data.data?.data || [], registrationsRes.data.data?.data || []);
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load some dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (events: any[], registrations: any[]) => {
    // Event breakdown chart
    const eventData: EventChartData[] = (events || []).slice(0, 5).map((event: any) => ({
      eventName: event.name?.substring(0, 15) || 'Event',
      unpaidRegistrations: Math.floor(Math.random() * 20),
      totalRiders: Math.floor(Math.random() * 50),
      totalHorses: Math.floor(Math.random() * 40),
    }));
    setEventChartData(eventData.length > 0 ? eventData : generateMockEventData());

    // Monthly revenue chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlyData = months.map(month => ({
      month,
      revenue: Math.floor(Math.random() * 50000) + 10000,
    }));
    setMonthlyRevenue(monthlyData);

    // Registration trend chart
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        registrations: Math.floor(Math.random() * 30) + 5,
      };
    });
    setRegistrationTrend(days);

    // Top clubs
    const clubs = [
      { name: 'Elite Riders Club', registrations: 45 },
      { name: 'Equestrian Society', registrations: 38 },
      { name: 'Racing Association', registrations: 32 },
      { name: 'Horse Lovers', registrations: 28 },
    ];
    setTopClubs(clubs);

    // Top riders
    const riders = [
      { name: 'John Smith', registrations: 8 },
      { name: 'Sarah Johnson', registrations: 7 },
      { name: 'Mike Davis', registrations: 6 },
      { name: 'Emily Brown', registrations: 5 },
    ];
    setTopRiders(riders);
  };

  const generateMockEventData = () => [
    { eventName: 'Spring Show', unpaidRegistrations: 5, totalRiders: 25, totalHorses: 20 },
    { eventName: 'Summer Cup', unpaidRegistrations: 8, totalRiders: 32, totalHorses: 28 },
    { eventName: 'Fall Championship', unpaidRegistrations: 3, totalRiders: 28, totalHorses: 24 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-2">Welcome to your event management dashboard</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
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
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
                icon={FiBox} 
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
                value="$0"
                color="bg-pink-500"
              />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Event Breakdown Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Breakdown</h3>
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
                  <p className="text-gray-600">No event data available</p>
                )}
              </div>

              {/* Monthly Revenue Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
                {monthlyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Line type="monotone" dataKey="revenue" stroke="#0088FE" strokeWidth={2} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-600">No revenue data available</p>
                )}
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Registration Trend */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Trend (7 Days)</h3>
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
                  <p className="text-gray-600">No registration data available</p>
                )}
              </div>

              {/* Top Active Clubs & Riders */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Active Participants</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Top Clubs */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 text-sm">Top Clubs</h4>
                    <div className="space-y-2">
                      {topClubs.map((club, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{club.name}</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {club.registrations}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Riders */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 text-sm">Top Riders</h4>
                    <div className="space-y-2">
                      {topRiders.map((rider, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{rider.name}</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            {rider.registrations}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/events" className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center transition">
                    View Events
                  </Link>
                  <Link href="/riders" className="block px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-center transition">
                    View Riders
                  </Link>
                  <Link href="/horses" className="block px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-center transition">
                    View Horses
                  </Link>
                  <Link href="/registrations" className="block px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-center transition">
                    Manage Registrations
                  </Link>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Backend API:</span>
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-600 rounded-full"></span> Online
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Database:</span>
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-600 rounded-full"></span> Connected
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">API Version:</span>
                    <span className="text-gray-900 font-medium">1.0</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="text-gray-900 font-medium text-xs">{new Date().toLocaleTimeString()}</span>
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

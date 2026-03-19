import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiBell, FiCheck, FiCheckCircle } from 'react-icons/fi';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [showUnreadOnly]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '50' });
      if (showUnreadOnly) params.set('unreadOnly', 'true');
      const res = await api.get(`/api/notifications?${params}`);
      setNotifications(res.data.data?.notifications || []);
      setUnreadCount(res.data.data?.unreadCount || 0);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.post('/api/notifications', { notificationIds: [id] });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to update');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/api/notifications', { markAll: true });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to update');
    }
  };

  const typeIcon = (type: string) => {
    const colors: Record<string, string> = {
      REGISTRATION_APPROVED: 'bg-green-100 text-green-600',
      REGISTRATION_REJECTED: 'bg-red-100 text-red-600',
      PAYMENT_RECEIVED: 'bg-blue-100 text-blue-600',
      EVENT_UPDATE: 'bg-purple-100 text-purple-600',
      SYSTEM: 'bg-gray-100 text-gray-600',
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <ProtectedRoute>
      <Head><title>Notifications | Equestrian</title></Head>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-300 mt-1">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`px-3 py-2 rounded-lg text-sm ${showUnreadOnly ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              {showUnreadOnly ? 'Show All' : 'Unread Only'}
            </button>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="px-3 py-2 bg-white text-gray-700 rounded-lg text-sm hover:bg-gray-100 flex items-center gap-1">
                <FiCheckCircle size={14} /> Mark All Read
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FiBell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No notifications</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id} className={`bg-white rounded-lg shadow p-4 flex items-start gap-3 ${!n.isRead ? 'border-l-4 border-blue-500' : ''}`}>
                <div className={`p-2 rounded-full ${typeIcon(n.type)} flex-shrink-0 mt-0.5`}>
                  <FiBell size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {n.title}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  <div className="flex gap-2 mt-2">
                    {n.link && (
                      <Link href={n.link} className="text-xs text-blue-600 hover:underline">
                        View Details
                      </Link>
                    )}
                    {!n.isRead && (
                      <button onClick={() => markAsRead(n.id)} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                        <FiCheck size={12} /> Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

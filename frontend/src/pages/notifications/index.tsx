import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Bell, Check, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { PageSkeleton } from '@/components/PageSkeleton';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';

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
      REGISTRATION_APPROVED: 'bg-primary/10 text-primary',
      REGISTRATION_REJECTED: 'bg-destructive/10 text-destructive',
      PAYMENT_RECEIVED: 'bg-secondary/10 text-secondary',
      EVENT_UPDATE: 'bg-secondary/10 text-secondary',
      SYSTEM: 'bg-surface-container text-muted-foreground',
    };
    return colors[type] || 'bg-surface-container text-muted-foreground';
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
    <BoneyardSkeleton name="notifications-page" loading={false}>
    <ProtectedRoute>
      <Head><title>Notifications | Equestrian</title></Head>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl">Alert <span className="gradient-text">Center</span></h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`px-3 py-2 rounded-xl text-sm transition ${showUnreadOnly ? 'bg-primary text-primary-foreground' : 'bg-surface-container/60 text-muted-foreground hover:bg-surface-bright border border-border/30'}`}
            >
              {showUnreadOnly ? 'Show All' : 'Unread Only'}
            </button>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="px-3 py-2 bg-surface-container/60 text-muted-foreground rounded-xl text-sm hover:bg-surface-bright flex items-center gap-1 transition border border-border/30">
                <CheckCircle size={14} /> Mark All Read
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <PageSkeleton variant="list" rows={6} />
        ) : notifications.length === 0 ? (
          <div className="bento-card p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id} className={`bento-card p-4 flex items-start gap-3 ${!n.isRead ? 'border-l-4 border-primary' : ''}`}>
                <div className={`p-2 rounded-full ${typeIcon(n.type)} flex-shrink-0 mt-0.5`}>
                  <Bell size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className={`text-sm ${!n.isRead ? 'font-semibold text-on-surface' : 'font-medium text-muted-foreground'}`}>
                      {n.title}
                    </h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  <div className="flex gap-2 mt-2">
                    {n.link && (
                      <Link href={n.link} className="text-xs transition-colors hover:underline">
                        View Details
                      </Link>
                    )}
                    {!n.isRead && (
                      <button onClick={() => markAsRead(n.id)} className="text-xs text-muted-foreground hover:text-muted-foreground flex items-center gap-1">
                        <Check size={12} /> Mark read
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
    </BoneyardSkeleton>
  );
}

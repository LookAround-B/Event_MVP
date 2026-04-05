import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import { Check, X, RefreshCw, Users, FileText } from 'lucide-react';

interface PendingUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  gender?: string;
  phone?: string;
  createdAt: string;
}

interface PendingRegistration {
  id: string;
  totalAmount: number;
  approvalStatus: string;
  paymentStatus: string;
  rider: { firstName: string; lastName: string; email: string };
  horse: { name: string };
  event: { name: string };
  category?: { name: string };
}

export default function AdminApprovals() {
  const router = useRouter();
  const [tab, setTab] = useState<'users' | 'registrations'>('users');
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingRegs, setPendingRegs] = useState<PendingRegistration[]>([]);
  const [regCounts, setRegCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = Cookies.get('authToken');
    if (!token) { router.push('/auth/login'); return; }
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
      if (payload.role !== 'admin') { router.push('/dashboard'); return; }
      setIsAdmin(true);
    } catch { router.push('/auth/login'); }
  }, [router]);

  useEffect(() => {
    if (isAdmin) {
      Promise.all([fetchPendingUsers(), fetchPendingRegistrations()]);
    }
  }, [isAdmin]);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/admin/approve-user');
      setPendingUsers(response.data.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const fetchPendingRegistrations = async () => {
    try {
      const res = await apiClient.get('/api/registrations/pending?approvalStatus=PENDING&limit=50');
      setPendingRegs(res.data.data?.registrations || []);
      setRegCounts(res.data.data?.counts || { pending: 0, approved: 0, rejected: 0 });
    } catch { /* ignore */ }
  };

  const handleApproveUser = async (userId: string, userName: string) => {
    try {
      setApproving(userId);
      await apiClient.post('/api/admin/approve-user', { userId });
      toast.success(`${userName} approved`);
      fetchPendingUsers();
    } catch { toast.error('Failed to approve user'); }
    finally { setApproving(null); }
  };

  const handleApproveReg = async (regId: string) => {
    try {
      await apiClient.post(`/api/registrations/${regId}/approve`, { action: 'APPROVED' });
      toast.success('Registration approved');
      fetchPendingRegistrations();
    } catch { toast.error('Failed to approve'); }
  };

  const handleRejectReg = async (regId: string) => {
    const notes = prompt('Rejection reason:');
    if (!notes) return;
    try {
      await apiClient.post(`/api/registrations/${regId}/approve`, { action: 'REJECTED', rejectionNotes: notes });
      toast.success('Registration rejected');
      fetchPendingRegistrations();
    } catch { toast.error('Failed to reject'); }
  };

  if (!isAdmin || loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Head><title>Admin Approvals | Equestrian</title></Head>
      <div className="space-y-6">
        <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl">Admin <span className="gradient-text">Approvals</span></h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-muted-foreground">Pending Users</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingUsers.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-muted-foreground">Pending Registrations</p>
            <p className="text-2xl font-bold text-yellow-600">{regCounts.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-muted-foreground">Approved Registrations</p>
            <p className="text-2xl font-bold text-green-600">{regCounts.approved}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-muted-foreground">Rejected Registrations</p>
            <p className="text-2xl font-bold text-red-600">{regCounts.rejected}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab('users')} className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${tab === 'users' ? 'bg-blue-600 text-on-surface' : 'bg-white text-on-surface-variant'}`}>
            <Users size={16} /> User Approvals ({pendingUsers.length})
          </button>
          <button onClick={() => setTab('registrations')} className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${tab === 'registrations' ? 'bg-blue-600 text-on-surface' : 'bg-white text-on-surface-variant'}`}>
            <FileText size={16} /> Registration Approvals ({regCounts.pending})
          </button>
        </div>

        {/* User Approvals Tab */}
        {tab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {pendingUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No pending user approvals</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-lowest border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-on-surface">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-on-surface">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-on-surface">Phone</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-on-surface">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-on-surface">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pendingUsers.map(user => (
                      <tr key={user.id} className="hover:bg-surface-lowest">
                        <td className="px-6 py-4 text-sm text-on-surface">{user.firstName} {user.lastName}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{user.phone || '-'}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleApproveUser(user.id, `${user.firstName} ${user.lastName}`)}
                            disabled={approving === user.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                          >
                            {approving === user.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check size={14} />}
                            Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Registration Approvals Tab */}
        {tab === 'registrations' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pending registration approvals</span>
              <Link href="/registrations/approvals" className="text-sm text-blue-600 hover:underline">View All →</Link>
            </div>
            {pendingRegs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No pending registration approvals</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-lowest border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Rider</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Event</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Horse</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pendingRegs.map(reg => (
                      <tr key={reg.id} className="hover:bg-surface-lowest">
                        <td className="px-4 py-3 text-sm">{reg.rider.firstName} {reg.rider.lastName}</td>
                        <td className="px-4 py-3 text-sm text-on-surface">{reg.event.name}</td>
                        <td className="px-4 py-3 text-sm text-on-surface">{reg.horse.name}</td>
                        <td className="px-4 py-3 text-sm font-semibold">₹{reg.totalAmount}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button onClick={() => handleApproveReg(reg.id)} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"><Check size={14} /></button>
                            <button onClick={() => handleRejectReg(reg.id)} className="p-1.5 rounded-xl rounded hover:bg-red-200"><X size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

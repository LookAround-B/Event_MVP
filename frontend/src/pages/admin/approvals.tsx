import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import { Check, X, RefreshCw, Users, FileText, Search, Clock, UserCheck, Zap, Eye, CheckCircle, XCircle } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { KPIGrid } from '@/components/dashboard/KPIGrid';
import AuditPagination from '@/components/AuditPagination';
import { PageSkeleton } from '@/components/PageSkeleton';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';

interface PendingUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'rider' | 'club' | 'admin';
  gender?: string;
  phone?: string;
  profileComplete: boolean;
  clubName?: string | null;
  clubShortCode?: string | null;
  efiRiderId?: string | null;
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
  const [userPage, setUserPage] = useState(1);
  const [regPage, setRegPage] = useState(1);
  const perPage = 10;

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

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(pendingUsers.length / perPage));
    if (userPage > totalPages) {
      setUserPage(totalPages);
    }
  }, [pendingUsers.length, perPage, userPage]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(pendingRegs.length / perPage));
    if (regPage > totalPages) {
      setRegPage(totalPages);
    }
  }, [pendingRegs.length, perPage, regPage]);

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
    } catch (err: any) {
      if (err.response?.data?.message === 'User is already approved') {
        toast('User was already approved. Refreshing queue.');
        fetchPendingUsers();
      } else {
        toast.error('Failed to approve user');
      }
    }
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
    return <PageSkeleton variant="table" rows={6} />;
  }

  return (
    <>
      <Head><title>Admin Approvals | Equestrian</title></Head>
      <div className="animate-fade-in max-w-[1600px] mx-auto">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl lg:text-5xl">
            Onboarding <span className="gradient-text">Guard</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Verify digital identities and authorize platform access for new riders and clubs.
          </p>
        </div>

        {/* KPI Stats */}
        <KPIGrid>
          <KPICard title="Awaiting Review" value={pendingUsers.length} icon={Clock} variant="primary" subText="Pending validation" className="animate-slide-up-1" />
          <KPICard title="Pending Regs" value={regCounts.pending} icon={UserCheck} variant="outline" subText="Registration queue" className="animate-slide-up-2" />
          <KPICard title="Approved Regs" value={regCounts.approved} icon={Zap} variant="outline" subText="Access granted" className="animate-slide-up-3" />
        </KPIGrid>

        {/* Tabs */}
        <div className="mb-4 animate-slide-up-2">
          <div className="flex gap-1 bg-surface-container rounded-xl p-1 w-fit border border-border/30 shadow-inner">
            <button
              onClick={() => setTab('users')}
              className={`px-4 sm:px-5 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${tab === 'users' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-on-surface'}`}
            >
              <Users size={14} /> Review Queue ({pendingUsers.length})
            </button>
            <button
              onClick={() => setTab('registrations')}
              className={`px-4 sm:px-5 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${tab === 'registrations' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-on-surface'}`}
            >
              <FileText size={14} /> Registrations ({regCounts.pending})
            </button>
          </div>
        </div>

        {/* User Approvals Tab */}
        {tab === 'users' && (
          <div className="bento-card overflow-hidden animate-slide-up-3">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-secondary/50 to-primary/50" />
            {pendingUsers.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground italic">No candidates found in the review queue.</div>
            ) : (
              <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[850px]">
                  <thead>
                    <tr className="label-tech text-left bg-surface-container/40">
                      <th className="p-3 sm:p-4">Applicant Persona</th>
                      <th className="p-3 sm:p-4">Digital Identity</th>
                      <th className="p-3 sm:p-4">Contact</th>
                      <th className="p-3 sm:p-4">Registered</th>
                      <th className="p-3 sm:p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {pendingUsers.slice((userPage - 1) * perPage, userPage * perPage).map(user => (
                      <tr key={user.id} className="group hover:bg-surface-container/20 transition-all duration-300">
                        <td className="p-3 sm:p-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-on-surface font-bold tracking-tight">
                              {user.firstName} {user.lastName}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                                {user.role}
                              </span>
                              {user.role === 'club' && user.clubName && (
                                <span className="text-[10px] text-muted-foreground">
                                  {user.clubName}
                                  {user.clubShortCode ? ` (${user.clubShortCode})` : ''}
                                </span>
                              )}
                              {user.role === 'rider' && user.efiRiderId && (
                                <span className="text-[10px] text-muted-foreground">
                                  EFI: {user.efiRiderId}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <span className="text-on-surface-variant font-medium text-xs">{user.email}</span>
                        </td>
                        <td className="p-3 sm:p-4">
                          <span className="text-[10px] text-muted-foreground font-mono">{user.phone || 'No contact meta'}</span>
                        </td>
                        <td className="p-3 sm:p-4">
                          <span className="text-[10px] text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleApproveUser(user.id, `${user.firstName} ${user.lastName}`)}
                              disabled={approving === user.id}
                              title="Authorize"
                              className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all active:scale-90"
                            >
                              {approving === user.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(() => {
                const totalPages = Math.ceil(pendingUsers.length / perPage);
                return (
                  <AuditPagination
                    page={userPage}
                    totalPages={totalPages}
                    onPageChange={setUserPage}
                    className="mt-0 border-t border-border/10 px-4 py-3"
                  />
                );
              })()}
              </>
            )}
          </div>
        )}

        {/* Registration Approvals Tab */}
        {tab === 'registrations' && (
          <div className="bento-card overflow-hidden animate-slide-up-3">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary/50 via-primary/50 to-secondary/50" />
            <div className="p-4 border-b border-border/10 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pending registration approvals</span>
              <Link href="/registrations/approvals" className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors">View All →</Link>
            </div>
            {pendingRegs.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground italic">No pending registration approvals.</div>
            ) : (
              <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[750px]">
                  <thead>
                    <tr className="label-tech text-left bg-surface-container/40">
                      <th className="p-3 sm:p-4">Athlete</th>
                      <th className="p-3 sm:p-4">Event Championship</th>
                      <th className="p-3 sm:p-4">Equine Asset</th>
                      <th className="p-3 sm:p-4">Fee Amount</th>
                      <th className="p-3 sm:p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {pendingRegs.slice((regPage - 1) * perPage, regPage * perPage).map(reg => (
                      <tr key={reg.id} className="group hover:bg-surface-container/20 transition-all duration-300">
                        <td className="p-3 sm:p-4">
                          <div className="flex flex-col">
                            <span className="text-on-surface font-bold tracking-tight">{reg.rider.firstName} {reg.rider.lastName}</span>
                            <span className="text-[10px] text-muted-foreground">{reg.rider.email}</span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-on-surface-variant font-medium">{reg.event.name}</td>
                        <td className="p-3 sm:p-4 text-on-surface-variant">{reg.horse.name}</td>
                        <td className="p-3 sm:p-4">
                          <span className="text-on-surface font-bold">₹{reg.totalAmount.toLocaleString('en-IN')}</span>
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleApproveReg(reg.id)} title="Approve" className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all active:scale-90"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => handleRejectReg(reg.id)} title="Reject" className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all active:scale-90"><XCircle className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(() => {
                const totalPages = Math.ceil(pendingRegs.length / perPage);
                return (
                  <BoneyardSkeleton name="admin-approvals-page" loading={false}>
                  <AuditPagination
                    page={regPage}
                    totalPages={totalPages}
                    onPageChange={setRegPage}
                    className="mt-0 border-t border-border/10 px-4 py-3"
                  />
                  </BoneyardSkeleton>
                );
              })()}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

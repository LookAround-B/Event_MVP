import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { Check, X, Filter, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface Registration {
  id: string;
  eventAmount: number;
  stableAmount: number;
  gstAmount: number;
  totalAmount: number;
  paymentStatus: string;
  approvalStatus: string;
  rejectionNotes?: string;
  paymentMethod?: string;
  rider: { firstName: string; lastName: string; email: string };
  horse: { id: string; name: string; color?: string };
  event: { id: string; name: string; startDate: string };
  category?: { id: string; name: string; price: number };
  club?: { id: string; name: string };
}

interface Counts {
  pending: number;
  approved: number;
  rejected: number;
}

export default function RegistrationApprovals() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [counts, setCounts] = useState<Counts>({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [eventFilter, setEventFilter] = useState('__all__');
  const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean; regId?: string }>({ isOpen: false });
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; reg?: Registration }>({ isOpen: false });
  const [paymentForm, setPaymentForm] = useState({ method: 'CARD', ref: '', notes: '', amount: '' });
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    fetchRegistrations();
    fetchEvents();
    setPage(1);
  }, [filter, eventFilter]);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/api/events?limit=100');
      setEvents(res.data.data?.events || []);
    } catch { /* ignore */ }
  };

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ approvalStatus: filter, limit: '50' });
      if (eventFilter && eventFilter !== '__all__') params.set('eventId', eventFilter);
      const res = await api.get(`/api/registrations/pending?${params}`);
      setRegistrations(res.data.data?.registrations || []);
      setCounts(res.data.data?.counts || { pending: 0, approved: 0, rejected: 0 });
    } catch {
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/api/registrations/${id}/approve`, { action: 'APPROVED' });
      toast.success('Registration approved');
      fetchRegistrations();
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!rejectionModal.regId || !rejectionNotes.trim()) {
      toast.error('Rejection notes are required');
      return;
    }
    try {
      await api.post(`/api/registrations/${rejectionModal.regId}/approve`, {
        action: 'REJECTED',
        rejectionNotes: rejectionNotes.trim(),
      });
      toast.success('Registration rejected');
      setRejectionModal({ isOpen: false });
      setRejectionNotes('');
      fetchRegistrations();
    } catch {
      toast.error('Failed to reject');
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentModal.reg) return;
    try {
      await api.post(`/api/registrations/${paymentModal.reg.id}/payment`, {
        paymentMethod: paymentForm.method,
        paymentRef: paymentForm.ref,
        paymentNotes: paymentForm.notes,
        amount: paymentForm.amount || paymentModal.reg.totalAmount,
      });
      toast.success('Payment recorded');
      setPaymentModal({ isOpen: false });
      setPaymentForm({ method: 'CARD', ref: '', notes: '', amount: '' });
      fetchRegistrations();
    } catch {
      toast.error('Failed to record payment');
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
      APPROVED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
      REJECTED: 'bg-red-500/15 text-red-400 border border-red-500/20',
      PAID: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
      UNPAID: 'bg-red-500/15 text-red-400 border border-red-500/20',
      PARTIAL: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
    };
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-surface-container text-muted-foreground'}`}>
        {status}
      </span>
    );
  };

  return (
    <ProtectedRoute>
      <Head><title>Registration Approvals | Equestrian</title></Head>
      <div className="space-y-6">
        <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl">Registration <span className="gradient-text">Approvals</span></h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bento-card p-4 text-center border-l-2 border-yellow-500/50">
            <p className="text-2xl font-bold text-yellow-400">{counts.pending}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <div className="bento-card p-4 text-center border-l-2 border-emerald-500/50">
            <p className="text-2xl font-bold text-emerald-400">{counts.approved}</p>
            <p className="text-sm text-muted-foreground">Approved</p>
          </div>
          <div className="bento-card p-4 text-center border-l-2 border-red-500/50">
            <p className="text-2xl font-bold text-red-400">{counts.rejected}</p>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bento-card p-4 flex flex-wrap gap-4 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px] bg-surface-container border-border/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="ALL">All</SelectItem>
            </SelectContent>
          </Select>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-[200px] bg-surface-container border-border/30">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Events</SelectItem>
              {events.map(ev => (
                <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bento-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Rider</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Event</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Horse</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Payment</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Approval</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : registrations.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No registrations found</td></tr>
                ) : (
                  registrations.slice((page - 1) * perPage, page * perPage).map(reg => (
                    <tr key={reg.id} className="hover:bg-surface-lowest">
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium text-on-surface">{reg.rider.firstName} {reg.rider.lastName}</p>
                        <p className="text-xs text-muted-foreground">{reg.rider.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface">{reg.event.name}</td>
                      <td className="px-4 py-3 text-sm text-on-surface">{reg.horse.name}</td>
                      <td className="px-4 py-3 text-sm text-on-surface">{reg.category?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-on-surface">₹{reg.totalAmount}</td>
                      <td className="px-4 py-3 text-sm">{statusBadge(reg.paymentStatus)}</td>
                      <td className="px-4 py-3 text-sm">{statusBadge(reg.approvalStatus)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          {reg.approvalStatus === 'PENDING' && (
                            <>
                              <button onClick={() => handleApprove(reg.id)} className="p-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg hover:bg-emerald-500/25 transition-colors" title="Approve">
                                <Check size={16} />
                              </button>
                              <button onClick={() => setRejectionModal({ isOpen: true, regId: reg.id })} className="p-1.5 bg-red-500/15 text-red-400 rounded-lg hover:bg-red-500/25 transition-colors" title="Reject">
                                <X size={16} />
                              </button>
                            </>
                          )}
                          {reg.approvalStatus === 'APPROVED' && reg.paymentStatus !== 'PAID' && (
                            <button onClick={() => { setPaymentModal({ isOpen: true, reg }); setPaymentForm({ ...paymentForm, amount: String(reg.totalAmount) }); }} className="px-2 py-1 bg-blue-500/15 text-blue-400 rounded-lg text-xs hover:bg-blue-500/25 transition-colors">
                              Record Payment
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {registrations.length > 0 && (
            <div className="flex justify-center items-center gap-2 py-3 border-t border-border/30">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary disabled:opacity-50 text-sm px-3 py-1.5">Previous</button>
              <span className="px-4 py-2 text-muted-foreground text-sm">Page {page} of {Math.ceil(registrations.length / perPage) || 1} ({registrations.length} total)</span>
              <button onClick={() => setPage(Math.min(Math.ceil(registrations.length / perPage), page + 1))} disabled={page >= Math.ceil(registrations.length / perPage)} className="btn-secondary disabled:opacity-50 text-sm px-3 py-1.5">Next</button>
            </div>
          )}
        </div>

        {/* Rejection Modal */}
        {rejectionModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bento-card max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-on-surface mb-4">Reject Registration</h3>
              <textarea
                value={rejectionNotes}
                onChange={e => setRejectionNotes(e.target.value)}
                placeholder="Reason for rejection (required)..."
                className="w-full px-3 py-2 bg-surface-container border border-border/30 rounded-xl text-sm text-on-surface h-24 mb-4 focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setRejectionModal({ isOpen: false }); setRejectionNotes(''); }} className="px-4 py-2 bg-surface-bright rounded-lg text-sm">Cancel</button>
                <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-on-surface rounded-lg text-sm hover:bg-red-700">Reject</button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {paymentModal.isOpen && paymentModal.reg && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bento-card max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-on-surface mb-4">Record Payment</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {paymentModal.reg.rider.firstName} {paymentModal.reg.rider.lastName} - {paymentModal.reg.event.name}
                <br />Total: ₹{paymentModal.reg.totalAmount}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-on-surface-variant">Payment Method</label>
                  <div className="mt-1">
                    <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm({ ...paymentForm, method: v })}>
                      <SelectTrigger className="w-full bg-surface-container border-border/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CARD">Card</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="CHEQUE">Cheque</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-on-surface-variant">Amount (₹)</label>
                  <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} className="w-full px-3 py-2 bg-surface-container border border-border/30 rounded-xl text-sm text-on-surface mt-1 focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-sm font-medium text-on-surface-variant">Reference Number</label>
                  <input type="text" value={paymentForm.ref} onChange={e => setPaymentForm({ ...paymentForm, ref: e.target.value })} placeholder="Transaction/cheque ref" className="w-full px-3 py-2 bg-surface-container border border-border/30 rounded-xl text-sm text-on-surface mt-1 focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground" />
                </div>
                <div>
                  <label className="text-sm font-medium text-on-surface-variant">Notes</label>
                  <textarea value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} className="w-full px-3 py-2 bg-surface-container border border-border/30 rounded-xl text-sm text-on-surface mt-1 h-16 focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button onClick={() => setPaymentModal({ isOpen: false })} className="px-4 py-2 bg-surface-bright rounded-lg text-sm">Cancel</button>
                <button onClick={handleRecordPayment} className="px-4 py-2 bg-blue-600 text-on-surface rounded-lg text-sm hover:bg-blue-700">Record Payment</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

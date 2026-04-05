import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { Check, X, Filter, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';

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
  const [eventFilter, setEventFilter] = useState('');
  const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean; regId?: string }>({ isOpen: false });
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; reg?: Registration }>({ isOpen: false });
  const [paymentForm, setPaymentForm] = useState({ method: 'CARD', ref: '', notes: '', amount: '' });

  useEffect(() => {
    fetchRegistrations();
    fetchEvents();
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
      if (eventFilter) params.set('eventId', eventFilter);
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
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      PAID: 'bg-green-100 text-green-800',
      UNPAID: 'bg-red-100 text-red-800',
      PARTIAL: 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-surface-container text-gray-800'}`}>
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
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">{counts.pending}</p>
            <p className="text-sm text-yellow-600">Pending</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{counts.approved}</p>
            <p className="text-sm text-green-600">Approved</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{counts.rejected}</p>
            <p className="text-sm text-red-600">Rejected</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-center">
          <Filter className="text-muted-foreground" />
          <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ALL">All</option>
          </select>
          <select value={eventFilter} onChange={e => setEventFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">All Events</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  registrations.map(reg => (
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
                              <button onClick={() => handleApprove(reg.id)} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200" title="Approve">
                                <Check size={16} />
                              </button>
                              <button onClick={() => setRejectionModal({ isOpen: true, regId: reg.id })} className="p-1.5 rounded-xl rounded hover:bg-red-200" title="Reject">
                                <X size={16} />
                              </button>
                            </>
                          )}
                          {reg.approvalStatus === 'APPROVED' && reg.paymentStatus !== 'PAID' && (
                            <button onClick={() => { setPaymentModal({ isOpen: true, reg }); setPaymentForm({ ...paymentForm, amount: String(reg.totalAmount) }); }} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">
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
                className="w-full px-3 py-2 border rounded-lg text-sm h-24 mb-4"
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
                  <select value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm mt-1">
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-on-surface-variant">Amount (₹)</label>
                  <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-on-surface-variant">Reference Number</label>
                  <input type="text" value={paymentForm.ref} onChange={e => setPaymentForm({ ...paymentForm, ref: e.target.value })} placeholder="Transaction/cheque ref" className="w-full px-3 py-2 border rounded-lg text-sm mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-on-surface-variant">Notes</label>
                  <textarea value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm mt-1 h-16" />
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

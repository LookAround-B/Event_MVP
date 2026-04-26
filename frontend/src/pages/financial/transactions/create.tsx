import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { ArrowLeft } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { PageSkeleton } from '@/components/PageSkeleton';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';

interface Registration {
  id: string;
  rider: { firstName: string; lastName: string };
  event: { name: string };
  totalAmount: number;
}

export default function CreateTransaction() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    registrationId: '',
    amount: '',
    cgstAmount: '',
    sgstAmount: '',
    igstAmount: '',
    paymentMethod: 'Credit Card',
    referenceNumber: '',
    notes: '',
  });

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setDataLoading(true);
      const response = await api.get('/api/registrations?limit=100&status=UNPAID');
      const regData = response.data?.data?.registrations;
      setRegistrations(Array.isArray(regData) ? regData : []);
    } catch (err: any) {
      console.error('Failed to fetch registrations:', err);
      const message = err.response?.status === 401
        ? 'Not authenticated. Please log in first.'
        : 'Failed to load registrations';
      setError(message);
      setRegistrations([]);
    } finally {
      setDataLoading(false);
    }
  };

  const handleRegistrationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regId = e.target.value;
    setFormData(prev => ({
      ...prev,
      registrationId: regId,
      amount: '',
      cgstAmount: '',
      sgstAmount: '',
      igstAmount: '',
    }));

    const reg = registrations.find(r => r.id === regId) || null;
    setSelectedRegistration(reg);

    if (reg) {
      setFormData(prev => ({
        ...prev,
        amount: reg.totalAmount.toString(),
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.registrationId || !formData.amount) {
      setError('Registration and amount are required');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        registrationId: formData.registrationId,
        amount: parseFloat(formData.amount),
        cgstAmount: parseFloat(formData.cgstAmount || '0'),
        sgstAmount: parseFloat(formData.sgstAmount || '0'),
        igstAmount: parseFloat(formData.igstAmount || '0'),
        paymentMethod: formData.paymentMethod || null,
        referenceNumber: formData.referenceNumber || null,
        notes: formData.notes || null,
      };

      await api.post('/api/financial/transactions', payload);
      alert('Transaction created successfully!');
      router.push('/financial');
    } catch (err: any) {
      console.error('Failed to create transaction:', err);
      setError(err.response?.data?.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <ProtectedRoute>
        <PageSkeleton variant="modal" />
      </ProtectedRoute>
    );
  }

  const inputClass = "w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 placeholder:text-muted-foreground";
  const selectClass = "w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 placeholder:text-muted-foreground appearance-none";

  return (
    <BoneyardSkeleton name="transaction-create-page" loading={false}>
    <ProtectedRoute>
      {/* ── Modal overlay ── */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in" />
        
        {/* ── Modal box ── */}
        <div className="relative z-10 w-full max-w-2xl flex flex-col rounded-2xl border border-border/60 bg-surface-low shadow-2xl shadow-black/40 animate-fade-in pointer-events-auto"
          style={{ maxHeight: "min(90vh, 720px)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 flex-shrink-0">
            <div>
              <h3 className="text-base font-bold text-on-surface">Record Payment</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Create a new transaction record</p>
            </div>
            <Link href="/financial" className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors">
              <span className="sr-only">Close</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            </Link>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-none">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="label-tech block mb-1.5">
                  Registration <span className="text-destructive">*</span>
                </label>
                <Select value={formData.registrationId || '__none__'} onValueChange={v => {
                  const val = v === '__none__' ? '' : v;
                  const syntheticEvent = { target: { name: 'registrationId', value: val } } as React.ChangeEvent<HTMLSelectElement>;
                  handleRegistrationChange(syntheticEvent);
                }}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select a registration" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select a registration</SelectItem>
                    {registrations.map(reg => (
                      <SelectItem key={reg.id} value={reg.id}>
                        {reg.rider.firstName} {reg.rider.lastName} - {reg.event.name} (₹{reg.totalAmount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <h3 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wider text-muted-foreground">Payment Amount</h3>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="label-tech block mb-1.5">
                      Amount <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      required
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="label-tech block mb-1.5">Payment Method</label>
                    <Select value={formData.paymentMethod} onValueChange={v => {
                      const syntheticEvent = { target: { name: 'paymentMethod', value: v } } as React.ChangeEvent<HTMLSelectElement>;
                      handleChange(syntheticEvent as any);
                    }}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select method" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="Debit Card">Debit Card</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* GST Breakdown */}
                <div className="grid grid-cols-3 gap-5 mt-6">
                  <div>
                    <label className="label-tech block mb-1.5">CGST (9%)</label>
                    <input
                      type="number"
                      name="cgstAmount"
                      value={formData.cgstAmount}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="label-tech block mb-1.5">SGST (9%)</label>
                    <input
                      type="number"
                      name="sgstAmount"
                      value={formData.sgstAmount}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="label-tech block mb-1.5">IGST (18%)</label>
                    <input
                      type="number"
                      name="igstAmount"
                      value={formData.igstAmount}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Reference Section */}
              <div className="pt-2">
                <div>
                  <label className="label-tech block mb-1.5">Reference Number</label>
                  <input
                    type="text"
                    name="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={handleChange}
                    placeholder="e.g., CHQ-12345, TXN-67890"
                    className={inputClass}
                  />
                </div>

                <div className="mt-5">
                  <label className="label-tech block mb-1.5">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any additional details about this transaction..."
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

            </form>
          </div>

          {/* ── Sticky footer ── */}
          <div className="flex items-center gap-3 px-6 py-4 border-t border-border/40 flex-shrink-0">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 btn-cta rounded-xl text-sm font-bold"
            >
              {loading ? 'Creating...' : 'Record Payment'}
            </button>
            <Link
              href="/financial"
              className="flex-1 py-2.5 bg-surface-container rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/50 text-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
    </BoneyardSkeleton>
  );
}

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { ArrowLeft } from 'lucide-react';

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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-8">
            <Link href="/financial" className="transition-colors flex items-center gap-2">
              <ArrowLeft /> Back to Financial
            </Link>
          </div>

          <div className="bento-card overflow-hidden">
            {/* Title Section */}
            <div className="px-8 py-6 ">
              <h1 className="text-2xl font-bold">Record Payment</h1>
              <p className="text-muted-foreground mt-2">Create a new transaction record</p>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {error && (
                <div className="bg-red-900 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg p-4">
                  <p className="text-destructive font-medium">{error}</p>
                </div>
              )}

              {/* Registration - Mandatory */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Registration <span className="text-destructive">*</span>
                </label>
                <select
                  name="registrationId"
                  value={formData.registrationId}
                  onChange={handleRegistrationChange}
                  required
                  className="input"
                >
                  <option value="">Select a registration</option>
                  {registrations.map(reg => (
                    <option key={reg.id} value={reg.id} className="bg-slate-800 text-on-surface">
                      {reg.rider.firstName} {reg.rider.lastName} - {reg.event.name} (₹{reg.totalAmount})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Section */}
              <div className="pt-0 pt-6">
                <h3 className="text-sm font-semibold text-on-surface mb-4">Payment Amount</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">
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
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Payment Method</label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="Credit Card" className="bg-slate-800 text-on-surface">Credit Card</option>
                      <option value="Debit Card" className="bg-slate-800 text-on-surface">Debit Card</option>
                      <option value="UPI" className="bg-slate-800 text-on-surface">UPI</option>
                      <option value="Bank Transfer" className="bg-slate-800 text-on-surface">Bank Transfer</option>
                      <option value="Cheque" className="bg-slate-800 text-on-surface">Cheque</option>
                      <option value="Cash" className="bg-slate-800 text-on-surface">Cash</option>
                    </select>
                  </div>
                </div>

                {/* GST Breakdown */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">CGST (9%)</label>
                    <input
                      type="number"
                      name="cgstAmount"
                      value={formData.cgstAmount}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">SGST (9%)</label>
                    <input
                      type="number"
                      name="sgstAmount"
                      value={formData.sgstAmount}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">IGST (18%)</label>
                    <input
                      type="number"
                      name="igstAmount"
                      value={formData.igstAmount}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* Reference Section */}
              <div className="pt-0 pt-6">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Reference Number</label>
                  <input
                    type="text"
                    name="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={handleChange}
                    placeholder="e.g., CHQ-12345, TXN-67890"
                    className="input"
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-semibold text-on-surface mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any additional details about this transaction..."
                    rows={4}
                    className="input"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-6 pt-0">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary"
                >
                  {loading ? 'Creating...' : 'Record Payment'}
                </button>
                <Link
                  href="/financial"
                  className="flex-1 text-center btn-secondary"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

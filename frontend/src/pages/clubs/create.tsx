import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import AddressMapPicker from '@/components/AddressMapPicker';

export default function CreateClub() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    shortCode: '',
    registrationNumber: '',
    contactNumber: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    gstNumber: '',
    description: '',
    primaryContactFirstName: '',
    primaryContactLastName: '',
    primaryContactEmail: '',
    primaryContactGender: 'Male',
    primaryContactMobile: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/api/clubs', formData);
      alert('Club created successfully!');
      router.push('/clubs');
    } catch (error: any) {
      console.error('Failed to create club:', error);
      setError(error.response?.data?.message || 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/clubs" className="text-purple-400 hover:text-purple-300 flex items-center gap-2">
            <FiArrowLeft /> Back to Clubs
          </Link>
          <h1 className="text-3xl font-bold text-white">Create New Club</h1>
        </div>

        <div className="card">
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-400 text-red-200 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Club Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  name="name"
                  placeholder="Club name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Short Code <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  name="shortCode"
                  placeholder="e.g., CLUB01"
                  value={formData.shortCode}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="club@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Phone</label>
                <input
                  type="tel"
                  name="contactNumber"
                  placeholder="+91 9876543210"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  placeholder="Reg. number"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">GST Number</label>
                <input
                  type="text"
                  name="gstNumber"
                  placeholder="GST number"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Address</label>
              <input
                type="text"
                name="address"
                placeholder="Club address"
                value={formData.address}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <AddressMapPicker
              address={formData.address}
              city={formData.city}
              state={formData.state}
              country={formData.country}
              pincode={formData.pincode}
              onAddressChange={(components) => {
                setFormData(prev => ({
                  ...prev,
                  address: components.address || prev.address,
                  city: components.city || prev.city,
                  state: components.state || prev.state,
                  country: components.country || prev.country,
                  pincode: components.pincode || prev.pincode,
                }));
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">State</label>
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Country</label>
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={formData.country}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  placeholder="Pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Description</label>
              <textarea
                name="description"
                placeholder="Club description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="form-input"
              />
            </div>

            <div className="border-t border-white border-opacity-10 pt-6">
              <h2 className="text-xl font-bold text-white mb-4">Primary Contact <span className="text-red-400">*</span></h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">First Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    name="primaryContactFirstName"
                    placeholder="First name"
                    value={formData.primaryContactFirstName}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Last Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    name="primaryContactLastName"
                    placeholder="Last name"
                    value={formData.primaryContactLastName}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Email <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    name="primaryContactEmail"
                    placeholder="contact@example.com"
                    value={formData.primaryContactEmail}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Mobile</label>
                  <input
                    type="tel"
                    name="primaryContactMobile"
                    placeholder="+91 9876543210"
                    value={formData.primaryContactMobile}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Gender</label>
                  <select
                    name="primaryContactGender"
                    value={formData.primaryContactGender}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="Male" className="bg-slate-800 text-white">Male</option>
                    <option value="Female" className="bg-slate-800 text-white">Female</option>
                    <option value="Other" className="bg-slate-800 text-white">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-white border-opacity-10">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Club'}
              </button>
              <Link href="/clubs" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}

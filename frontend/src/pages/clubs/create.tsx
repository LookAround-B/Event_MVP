import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import AddressMapPicker from '@/components/AddressMapPicker';
import toast from 'react-hot-toast';

export default function CreateClub() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    shortCode: '',
    registrationNumber: '',
    contactNumber: '',
    optionalPhone: '',
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
    primaryContactDob: '',
    socialLinks: {
      instagram: '',
      twitter: '',
      facebook: '',
      youtube: '',
      website: '',
      other: '',
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/api/clubs', {
        ...formData,
        socialLinks: Object.values(formData.socialLinks).some(v => v) ? formData.socialLinks : undefined,
      });
      toast.success('Club created successfully!');
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
          <Link href="/clubs" className="transition-colors flex items-center gap-2">
            <ArrowLeft /> Back to Clubs
          </Link>
          <h1 className="text-2xl font-bold">Create New Club</h1>
        </div>

        <div className="bento-card">
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-400 text-red-200 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Club Information */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Club Information</h2>
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
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Club Code <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    name="shortCode"
                    placeholder="e.g., CLUB01"
                    value={formData.shortCode}
                    onChange={handleChange}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Club Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    placeholder="+91 9876543210"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Optional Phone Number</label>
                  <input
                    type="tel"
                    name="optionalPhone"
                    placeholder="+91 9876543210"
                    value={formData.optionalPhone}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Club Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="club@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="input"
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
                    className="input"
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
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Club Address */}
            <div className="pt-0 pt-6">
              <h2 className="text-xl font-bold text-white mb-4">Club Address</h2>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Club address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div className="mt-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                    className="input"
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
                    className="input"
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
                    className="input"
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
                    className="input"
                  />
                </div>
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
                className="input"
              />
            </div>

            {/* Person Details */}
            <div className="pt-0 pt-6">
              <h2 className="text-xl font-bold text-white mb-4">Person Details (Contact Person) <span className="text-red-400">*</span></h2>
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
                    className="input"
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
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Date of Birth</label>
                  <input
                    type="date"
                    name="primaryContactDob"
                    value={formData.primaryContactDob}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Gender</label>
                  <select
                    name="primaryContactGender"
                    value={formData.primaryContactGender}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="Male" className="bg-slate-800 text-white">Male</option>
                    <option value="Female" className="bg-slate-800 text-white">Female</option>
                    <option value="Other" className="bg-slate-800 text-white">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Mobile Number</label>
                  <input
                    type="tel"
                    name="primaryContactMobile"
                    placeholder="+91 9876543210"
                    value={formData.primaryContactMobile}
                    onChange={handleChange}
                    className="input"
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
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-0 pt-6">
              <h2 className="text-xl font-bold text-white mb-4">Social Links</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Instagram</label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/..."
                    value={formData.socialLinks.instagram}
                    onChange={e => handleSocialChange('instagram', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Twitter / X</label>
                  <input
                    type="url"
                    placeholder="https://twitter.com/..."
                    value={formData.socialLinks.twitter}
                    onChange={e => handleSocialChange('twitter', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Facebook</label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/..."
                    value={formData.socialLinks.facebook}
                    onChange={e => handleSocialChange('facebook', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">YouTube</label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/..."
                    value={formData.socialLinks.youtube}
                    onChange={e => handleSocialChange('youtube', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Website</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.socialLinks.website}
                    onChange={e => handleSocialChange('website', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Other Link</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.socialLinks.other}
                    onChange={e => handleSocialChange('other', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 pt-0">
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

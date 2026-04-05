import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { ArrowLeft, Check } from 'lucide-react';
import AddressMapPicker from '@/components/AddressMapPicker';

interface SocialLinks {
  instagram: string;
  twitter: string;
  facebook: string;
  youtube: string;
  website: string;
  other: string;
}

export default function CreateRider() {
  const router = useRouter();
  const { id } = router.query;
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    efiRiderId: '',
    designation: '',
    gender: '',
    dob: '',
    mobile: '',
    optionalPhone: '',
    address: '',
    imageUrl: '',
  });

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: '',
    twitter: '',
    facebook: '',
    youtube: '',
    website: '',
    other: '',
  });

  useEffect(() => {
    if (isEdit && typeof id === 'string') {
      fetchRider();
    }
  }, [id, isEdit]);

  const fetchRider = async () => {
    try {
      const response = await api.get(`/api/riders/${id}`);
      const rider = response.data.data;
      setFormData({
        firstName: rider.firstName || '',
        lastName: rider.lastName || '',
        email: rider.email || '',
        efiRiderId: rider.efiRiderId || '',
        designation: rider.designation || '',
        gender: rider.gender || '',
        dob: rider.dob ? rider.dob.split('T')[0] : '',
        mobile: rider.mobile || '',
        optionalPhone: rider.optionalPhone || '',
        address: rider.address || '',
        imageUrl: rider.imageUrl || '',
      });
      const sl = (rider.socialLinks || {}) as any;
      setSocialLinks({
        instagram: sl.instagram || '',
        twitter: sl.twitter || '',
        facebook: sl.facebook || '',
        youtube: sl.youtube || '',
        website: sl.website || '',
        other: sl.other || '',
      });
    } catch (err) {
      console.error('Error fetching rider:', err);
      setError('Failed to load rider details');
    }
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Invalid email format');
      return false;
    }
    if (!formData.efiRiderId.trim()) {
      setError('EFI Rider ID is required');
      return false;
    }
    if (!formData.gender) {
      setError('Gender is required');
      return false;
    }
    if (!formData.dob) {
      setError('Date of birth is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      setLoading(true);
      const socialLinksClean = Object.fromEntries(
        Object.entries(socialLinks).filter(([_, v]) => v && v.trim())
      );

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        efiRiderId: formData.efiRiderId,
        designation: formData.designation,
        gender: formData.gender,
        dob: formData.dob,
        mobile: formData.mobile,
        optionalPhone: formData.optionalPhone || null,
        address: formData.address,
        imageUrl: formData.imageUrl || null,
        socialLinks: Object.keys(socialLinksClean).length > 0 ? socialLinksClean : null,
      };

      if (isEdit) {
        await api.put(`/api/riders/${id}`, payload);
        toast.success('Rider updated successfully!');
      } else {
        await api.post('/api/riders', payload);
        toast.success('Rider created successfully!');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/riders');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving rider:', err);
      const message = err?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} rider.`;
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  if (success) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-purple-900">
          <div className="bento-card p-12 text-center max-w-md">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-600 bg-opacity-20 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
            <p className="text-gray-300">
              Rider {isEdit ? 'updated' : 'created'} successfully. Redirecting...
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Link href="/riders" className="transition-colors flex items-center gap-2">
              <ArrowLeft /> Back to Riders
            </Link>
          </div>

          <div className="bento-card overflow-hidden">
            <div className="px-8 py-6 ">
              <h1 className="text-2xl font-bold">
                {isEdit ? 'Edit Rider' : 'Register New Rider'}
              </h1>
              <p className="text-gray-300 mt-2">
                {isEdit ? 'Update rider profile' : 'Create a new rider profile'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {error && (
                <div className="bg-red-900 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg p-4">
                  <p className="text-red-300 font-medium">{error}</p>
                </div>
              )}

              {/* Personal Information */}
              <div>
                <h2 className="text-xl font-bold text-white mb-6 pb-3 ">
                  Personal Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="First name"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Last name (optional)"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="rider@example.com"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Gender <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="input"
                      required
                    >
                      <option value="" className="bg-slate-800 text-white">Select Gender</option>
                      <option value="Male" className="bg-slate-800 text-white">Male</option>
                      <option value="Female" className="bg-slate-800 text-white">Female</option>
                      <option value="Other" className="bg-slate-800 text-white">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Date of Birth <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Mobile
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="+91 9876543210"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Optional Phone
                    </label>
                    <input
                      type="tel"
                      name="optionalPhone"
                      value={formData.optionalPhone}
                      onChange={handleInputChange}
                      placeholder="Alternative number"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Image URL
                    </label>
                    <input
                      type="text"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      placeholder="https://..."
                      className="input"
                    />
                  </div>
                </div>

                {/* Address with Map */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter address"
                    rows={3}
                    className="input"
                  />
                  <AddressMapPicker
                    address={formData.address}
                    onAddressChange={(components) => {
                      const parts = [components.address, components.city, components.state, components.country, components.pincode].filter(Boolean);
                      setFormData(prev => ({ ...prev, address: parts.join(', ') }));
                    }}
                  />
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h2 className="text-xl font-bold text-white mb-6 pb-3 ">
                  Professional Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      EFI Rider ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="efiRiderId"
                      value={formData.efiRiderId}
                      onChange={handleInputChange}
                      placeholder="EFI identifier (required)"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Designation
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      placeholder="e.g., Professional, Amateur, Youth"
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h2 className="text-xl font-bold text-white mb-6 pb-3 ">
                  Social Links
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Instagram</label>
                    <input
                      type="text"
                      value={socialLinks.instagram}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                      placeholder="Instagram URL or handle"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Twitter</label>
                    <input
                      type="text"
                      value={socialLinks.twitter}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                      placeholder="Twitter URL or handle"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Facebook</label>
                    <input
                      type="text"
                      value={socialLinks.facebook}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, facebook: e.target.value }))}
                      placeholder="Facebook URL"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">YouTube</label>
                    <input
                      type="text"
                      value={socialLinks.youtube}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, youtube: e.target.value }))}
                      placeholder="YouTube URL"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Website</label>
                    <input
                      type="text"
                      value={socialLinks.website}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="Website URL"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Other</label>
                    <input
                      type="text"
                      value={socialLinks.other}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, other: e.target.value }))}
                      placeholder="Other link"
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 pt-0">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary"
                >
                  {loading
                    ? (isEdit ? 'Updating Rider...' : 'Creating Rider...')
                    : (isEdit ? 'Update Rider' : 'Create Rider')
                  }
                </button>
                <Link
                  href="/riders"
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

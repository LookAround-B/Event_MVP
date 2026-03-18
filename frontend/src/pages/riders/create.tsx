import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';

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
    address: '',
  });

  // Load rider data if editing
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
        address: rider.address || '',
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
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
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

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        efiRiderId: formData.efiRiderId,
        designation: formData.designation,
        gender: formData.gender,
        dob: formData.dob,
        mobile: formData.mobile,
        address: formData.address,
      };

      if (isEdit) {
        await api.put(`/api/riders/${id}`, payload);
      } else {
        await api.post('/api/riders', payload);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/riders');
      }, 1500);
    } catch (err) {
      console.error('Error saving rider:', err);
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEdit ? 'update' : 'create'} rider. Please try again.`
      );
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
          <div className="card p-12 text-center max-w-md">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-600 bg-opacity-20 rounded-full flex items-center justify-center">
                <FiCheck className="w-8 h-8 text-green-400" />
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
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/riders" className="text-purple-400 hover:text-purple-300 flex items-center gap-2">
              <FiArrowLeft /> Back to Riders
            </Link>
          </div>

          <div className="card overflow-hidden">
            {/* Title Section */}
            <div className="px-8 py-6 border-b border-white border-opacity-10">
              <h1 className="text-3xl font-bold text-white">
                {isEdit ? 'Edit Rider' : 'Register New Rider'}
              </h1>
              <p className="text-gray-300 mt-2">
                {isEdit ? 'Update rider profile' : 'Create a new rider profile'}
              </p>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Error Message */}
            {error && (
              <div className="bg-red-900 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg p-4">
                <p className="text-red-300 font-medium">{error}</p>
              </div>
            )}

            {/* Personal Information Section */}
            <div>
              <h2 className="text-xl font-bold text-white mb-6 pb-3 border-b border-white border-opacity-10">
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* First Name */}
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
                    className="form-input"
                    required
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last name"
                    className="form-input"
                    required
                  />
                </div>

                {/* Email */}
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
                    className="form-input"
                    required
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Gender <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="" className="bg-slate-800 text-white">Select Gender</option>
                    <option value="Male" className="bg-slate-800 text-white">Male</option>
                    <option value="Female" className="bg-slate-800 text-white">Female</option>
                    <option value="Other" className="bg-slate-800 text-white">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Date of Birth <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                {/* Mobile */}
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
                    className="form-input"
                  />
                </div>
              </div>

              {/* Address */}
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
                  className="form-input"
                />
              </div>
            </div>

            {/* Professional Information Section */}
            <div>
              <h2 className="text-xl font-bold text-white mb-6 pb-3 border-b border-white border-opacity-10">
                Professional Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* EFI Rider ID */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    EFI Rider ID
                  </label>
                  <input
                    type="text"
                    name="efiRiderId"
                    value={formData.efiRiderId}
                    onChange={handleInputChange}
                    placeholder="Optional EFI identifier"
                    className="form-input"
                  />
                </div>

                {/* Designation */}
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
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-white border-opacity-10">
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

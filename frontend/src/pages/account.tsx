import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { FiEdit2, FiSave, FiX } from 'react-icons/fi';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  designation?: string;
  phone?: string;
  gender?: string;
  address?: string;
  eId?: string;
  efiRiderId?: string;
  dob?: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editData, setEditData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('authToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Fetch from user endpoint or decode token
      // For now, we'll assume there's an endpoint to get current user profile
      const response = await api.get('/api/users/profile');
      setProfile(response.data.data);
      setEditData(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...profile });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      await api.put('/api/users/profile', editData);
      setProfile({ ...profile, ...editData } as UserProfile);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading profile...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <div className="text-center py-8">
          <p className="text-gray-600">Profile not found</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account & Profile</h1>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiEdit2 /> Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>

              <div className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="firstName"
                        value={editData.firstName || ''}
                        onChange={handleChange}
                        className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{profile.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="lastName"
                        value={editData.lastName || ''}
                        onChange={handleChange}
                        className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{profile.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <p className="text-gray-900">{profile.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="designation"
                      value={editData.designation || ''}
                      onChange={handleChange}
                      placeholder="e.g., Head Coach"
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.designation || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>

              <div className="space-y-4">
                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="dob"
                      value={editData.dob || ''}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.dob ? new Date(profile.dob).toLocaleDateString() : '-'}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={editData.gender || ''}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{profile.gender || '-'}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={editData.phone || ''}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.phone || '-'}</p>
                  )}
                </div>

                {/* EFI Rider ID */}
                {profile.efiRiderId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">EFI Rider ID</label>
                    <p className="text-gray-900">{profile.efiRiderId}</p>
                  </div>
                )}

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  {isEditing ? (
                    <textarea
                      name="address"
                      value={editData.address || ''}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-line">{profile.address || '-'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick Info */}
          <div className="bg-white rounded-lg shadow p-6 h-fit">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Information</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Platform ID (E_ID)</p>
                <p className="text-lg font-semibold text-gray-900">{profile.eId}</p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">Account Created</p>
                <p className="text-gray-900">-</p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-gray-900">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-4 pt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <FiX /> Cancel
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

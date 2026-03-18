import React, { useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/api';

export default function CreateClub() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

    try {
      await api.post('/api/clubs', formData);
      router.push('/clubs');
    } catch (error: any) {
      console.error('Failed to create club:', error);
      alert(error.response?.data?.message || 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Create New Club</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Club Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Short Code *</label>
            <input
              type="text"
              name="shortCode"
              value={formData.shortCode}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Phone</label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Registration Number</label>
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">GST Number</label>
            <input
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-2">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Country</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Pincode</label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <h2 className="text-xl font-bold mb-4 mt-8">Primary Contact *</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-2">First Name *</label>
            <input
              type="text"
              name="primaryContactFirstName"
              value={formData.primaryContactFirstName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Last Name *</label>
            <input
              type="text"
              name="primaryContactLastName"
              value={formData.primaryContactLastName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Email *</label>
            <input
              type="email"
              name="primaryContactEmail"
              value={formData.primaryContactEmail}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Mobile</label>
            <input
              type="tel"
              name="primaryContactMobile"
              value={formData.primaryContactMobile}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Gender</label>
            <select
              name="primaryContactGender"
              value={formData.primaryContactGender}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Club'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { FiArrowLeft, FiAlertCircle } from 'react-icons/fi';

export default function CreateHorse() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    color: '',
    gender: 'Mare',
    yearOfBirth: new Date().getFullYear() - 5,
    passportNumber: '',
    horseCode: '',
  });

  const [useHorseCode, setUseHorseCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (!formData.name || !formData.gender || !formData.yearOfBirth) {
      setError('Horse name, gender, and year of birth are required');
      setLoading(false);
      return;
    }

    if (!useHorseCode && !formData.passportNumber) {
      setError('Passport number or horse code is required');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: formData.name,
        color: formData.color || null,
        gender: formData.gender,
        yearOfBirth: formData.yearOfBirth,
        ...(useHorseCode
          ? { horseCode: formData.horseCode }
          : { passportNumber: formData.passportNumber }
        ),
      };

      await api.post('/api/horses', payload);
      alert('Horse registered successfully!');
      router.push('/horses');
    } catch (err: any) {
      console.error('Failed to create horse:', err);
      setError(err.response?.data?.message || 'Failed to register horse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/horses" className="text-blue-600 hover:text-blue-900 flex items-center gap-2">
            <FiArrowLeft /> Back to Horses
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Register New Horse</h2>
        </div>

        <div className="max-w-2xl bg-white rounded-lg shadow p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex gap-2">
              <FiAlertCircle className="flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Horse Name - Mandatory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horse Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Thunder"
                className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="e.g., Bay, Chestnut, Gray"
                className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Year of Birth - Mandatory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="yearOfBirth"
                value={formData.yearOfBirth}
                onChange={handleChange}
                required
                min="1900"
                max={new Date().getFullYear()}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Gender - Mandatory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="Mare">Mare (Female)</option>
                <option value="Stallion">Stallion (Male)</option>
                <option value="Gelding">Gelding (Castrated Male)</option>
              </select>
            </div>

            {/* Passport/Horse Code */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Identification</h3>
              <p className="text-xs text-gray-600 mb-4">Choose one: Passport Number or Horse Code</p>

              <div className="space-y-4">
                {!useHorseCode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passport Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleChange}
                      placeholder="e.g., FRA040500000123"
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                {useHorseCode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horse Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="horseCode"
                      value={formData.horseCode}
                      onChange={handleChange}
                      placeholder="e.g., HC-2024-001"
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useHorseCode}
                    onChange={() => {
                      setUseHorseCode(!useHorseCode);
                      setFormData(prev => ({
                        ...prev,
                        passportNumber: '',
                        horseCode: '',
                      }));
                    }}
                    className="w-4 h-4 border border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Use Horse Code instead of Passport Number</span>
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Registering...' : 'Register Horse'}
              </button>
              <Link
                href="/horses"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}

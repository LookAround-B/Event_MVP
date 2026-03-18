import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { FiArrowLeft } from 'react-icons/fi';

export default function CreateHorse() {
  const router = useRouter();
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    color: '',
    height: '',
    gender: 'Mare',
    yearOfBirth: new Date().getFullYear() - 5,
    passportNumber: '',
    horseCode: '',
  });

  const [useHorseCode, setUseHorseCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (router.query.id) {
      setIsEdit(true);
      fetchHorse(router.query.id as string);
    }
  }, [router.query.id]);

  const fetchHorse = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/horses/${id}`);
      const horse = response.data.data;
      setFormData({
        name: horse.name || '',
        breed: horse.breed || '',
        color: horse.color || '',
        height: horse.height ? horse.height.toString() : '',
        gender: horse.gender || 'Mare',
        yearOfBirth: horse.yearOfBirth || new Date().getFullYear() - 5,
        passportNumber: horse.passportNumber || '',
        horseCode: horse.horseCode || '',
      });
      setUseHorseCode(!!horse.horseCode);
    } catch (err) {
      console.error('Failed to fetch horse:', err);
      setError('Failed to load horse details');
    } finally {
      setLoading(false);
    }
  };

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
        breed: formData.breed || null,
        color: formData.color || null,
        height: formData.height ? parseFloat(formData.height) : null,
        gender: formData.gender,
        yearOfBirth: formData.yearOfBirth,
        ...(useHorseCode
          ? { horseCode: formData.horseCode }
          : { passportNumber: formData.passportNumber }
        ),
      };

      if (isEdit) {
        await api.put(`/api/horses/${router.query.id}`, payload);
        alert('Horse updated successfully!');
      } else {
        await api.post('/api/horses', payload);
        alert('Horse registered successfully!');
      }
      router.push('/horses');
    } catch (err: any) {
      console.error('Failed to save horse:', err);
      setError(err.response?.data?.message || 'Failed to save horse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-8">
            <Link href="/horses" className="text-purple-400 hover:text-purple-300 flex items-center gap-2">
              <FiArrowLeft /> Back to Horses
            </Link>
          </div>

          <div className="card overflow-hidden">
            {/* Title Section */}
            <div className="px-8 py-6 border-b border-white border-opacity-10">
              <h1 className="text-3xl font-bold text-white">{isEdit ? 'Edit Horse' : 'Register New Horse'}</h1>
              <p className="text-gray-300 mt-2">{isEdit ? 'Update horse profile' : 'Create a new horse profile'}</p>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {error && (
                <div className="bg-red-900 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg p-4">
                  <p className="text-red-300 font-medium">{error}</p>
                </div>
              )}
              {/* Horse Name - Mandatory */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Horse Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Thunder"
                  className="form-input"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="e.g., Bay, Chestnut, Gray"
                  className="form-input"
                />
              </div>

              {/* Breed */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Breed</label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed}
                  onChange={handleChange}
                  placeholder="e.g., Thoroughbred, Arabian, Quarter Horse"
                  className="form-input"
                />
              </div>

              {/* Height */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Height (hands)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="e.g., 15.2"
                  step="0.1"
                  min="0"
                  className="form-input"
                />
              </div>

              {/* Year of Birth - Mandatory */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Year of Birth <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="yearOfBirth"
                  value={formData.yearOfBirth}
                  onChange={handleChange}
                  required
                  min="1900"
                  max={new Date().getFullYear()}
                  className="form-input"
                />
              </div>

              {/* Gender - Mandatory */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Gender <span className="text-red-400">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="Mare" className="bg-slate-800 text-white">Mare (Female)</option>
                  <option value="Stallion" className="bg-slate-800 text-white">Stallion (Male)</option>
                  <option value="Gelding" className="bg-slate-800 text-white">Gelding (Castrated Male)</option>
                </select>
              </div>

              {/* Passport/Horse Code */}
              <div className="border-t border-white border-opacity-10 pt-6">
              <h3 className="text-sm font-semibold text-white mb-4">Identification</h3>
              <p className="text-xs text-gray-300 mb-4">Choose one: Passport Number or Horse Code</p>

              <div className="space-y-4">
                {!useHorseCode && (
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Passport Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleChange}
                      placeholder="e.g., FRA040500000123"
                      className="form-input"
                    />
                  </div>
                )}

                {useHorseCode && (
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Horse Code <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="horseCode"
                      value={formData.horseCode}
                      onChange={handleChange}
                      placeholder="e.g., HC-2024-001"
                      className="form-input"
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
                  <span className="text-sm text-gray-300">Use Horse Code instead of Passport Number</span>
                </label>
              </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-6 border-t border-white border-opacity-10">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? (isEdit ? 'Updating...' : 'Registering...') : (isEdit ? 'Update Horse' : 'Register Horse')}
              </button>
              <Link
                href="/horses"
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

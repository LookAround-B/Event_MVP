import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { ArrowLeft } from 'lucide-react';

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
    embassyId: '',
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
        embassyId: horse.embassyId || '',
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
      toast.error('Horse name, gender, and year of birth are required');
      setLoading(false);
      return;
    }

    if (!useHorseCode && !formData.passportNumber) {
      toast.error('Passport number or horse code is required');
      setLoading(false);
      return;
    }

    if (formData.embassyId && !/^EIRSHR\d{5}$/.test(formData.embassyId)) {
      toast.error('Embassy ID must be in format EIRSHR followed by 5 digits (e.g., EIRSHR00076)');
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
        embassyId: formData.embassyId || null,
        ...(useHorseCode
          ? { horseCode: formData.horseCode }
          : { passportNumber: formData.passportNumber }
        ),
      };

      let response;
      if (isEdit) {
        response = await api.put(`/api/horses/${router.query.id}`, payload);
      } else {
        response = await api.post('/api/horses', payload);
      }

      if (!response.data.success) {
        toast.error(response.data.message || 'Failed to save horse');
        return;
      }

      toast.success(isEdit ? 'Horse updated successfully!' : 'Horse registered successfully!');
      router.push('/horses');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to save horse';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-8">
            <Link href="/horses" className="transition-colors flex items-center gap-2">
              <ArrowLeft /> Back to Horses
            </Link>
          </div>

          <div className="bento-card overflow-hidden">
            {/* Title Section */}
            <div className="px-8 py-6 ">
              <h1 className="text-2xl font-bold">{isEdit ? 'Edit Horse' : 'Register New Horse'}</h1>
              <p className="text-muted-foreground mt-2">{isEdit ? 'Update horse profile' : 'Create a new horse profile'}</p>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {error && (
                <div className="bg-red-900 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg p-4">
                  <p className="text-destructive font-medium">{error}</p>
                </div>
              )}
              {/* Horse Name - Mandatory */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Horse Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Thunder"
                  className="input"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="e.g., Bay, Chestnut, Gray"
                  className="input"
                />
              </div>

              {/* Breed */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Breed</label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed}
                  onChange={handleChange}
                  placeholder="e.g., Thoroughbred, Arabian, Quarter Horse"
                  className="input"
                />
              </div>

              {/* Height */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Height (hands)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="e.g., 15.2"
                  step="0.1"
                  min="0"
                  className="input"
                />
              </div>

              {/* Year of Birth - Mandatory */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Year of Birth <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  name="yearOfBirth"
                  value={formData.yearOfBirth}
                  onChange={handleChange}
                  required
                  min="1900"
                  max={new Date().getFullYear()}
                  className="input"
                />
              </div>

              {/* Gender - Mandatory */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Gender <span className="text-destructive">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="Mare" className="bg-slate-800 text-on-surface">Mare (Female)</option>
                  <option value="Stallion" className="bg-slate-800 text-on-surface">Stallion (Male)</option>
                  <option value="Gelding" className="bg-slate-800 text-on-surface">Gelding (Castrated Male)</option>
                </select>
              </div>

              {/* Passport/Horse Code */}
              <div className="pt-0 pt-6">
              <h3 className="text-sm font-semibold text-on-surface mb-4">Identification</h3>
              <p className="text-xs text-muted-foreground mb-4">Choose one: Passport Number or Horse Code</p>

              <div className="space-y-4">
                {!useHorseCode && (
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">
                      Passport Number <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      name="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleChange}
                      placeholder="e.g., FRA040500000123"
                      className="input"
                    />
                  </div>
                )}

                {useHorseCode && (
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">
                      Horse Code <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      name="horseCode"
                      value={formData.horseCode}
                      onChange={handleChange}
                      placeholder="e.g., HC-2024-001"
                      className="input"
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
                  <span className="text-sm text-muted-foreground">Use Horse Code instead of Passport Number</span>
                </label>

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-on-surface mb-2">
                    Embassy ID
                  </label>
                  <input
                    type="text"
                    name="embassyId"
                    value={formData.embassyId}
                    onChange={handleChange}
                    placeholder="e.g., EIRSHR00076"
                    maxLength={11}
                    className="input font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Format: EIRSHR followed by 5 digits (e.g., EIRSHR00076)</p>
                </div>
              </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-6 pt-0">
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

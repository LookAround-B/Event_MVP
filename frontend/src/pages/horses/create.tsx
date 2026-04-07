import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { ArrowLeft } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

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

    if (!formData.embassyId) {
      toast.error('Embassy ID is mandatory');
      setLoading(false);
      return;
    }

    if (!/^EIRSHR\d{5}$/.test(formData.embassyId)) {
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

  const inputClass = "w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 placeholder:text-muted-foreground";
  const selectClass = "w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 placeholder:text-muted-foreground appearance-none";

  return (
    <ProtectedRoute>
      {/* ── Modal overlay ── */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in" />
        
        {/* ── Modal box ── */}
        <div className="relative z-10 w-full max-w-2xl flex flex-col rounded-2xl border border-border/60 bg-surface-low shadow-2xl shadow-black/40 animate-fade-in pointer-events-auto"
          style={{ maxHeight: "min(90vh, 720px)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 flex-shrink-0">
            <div>
              <h3 className="text-base font-bold text-on-surface">{isEdit ? 'Edit Horse' : 'Register New Horse'}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{isEdit ? 'Update horse profile' : 'Create a new horse profile'}</p>
            </div>
            <Link href="/horses" className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors">
              <span className="sr-only">Close</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            </Link>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-none">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                  {error}
                </div>
              )}
              {/* Horse Name - Mandatory */}
              <div>
                <label className="label-tech block mb-1.5">
                  Horse Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Thunder"
                  className={inputClass}
                />
              </div>

              {/* Color */}
              <div>
                <label className="label-tech block mb-1.5">Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="e.g., Bay, Chestnut, Gray"
                  className={inputClass}
                />
              </div>

              {/* Breed */}
              <div>
                <label className="label-tech block mb-1.5">Breed</label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed}
                  onChange={handleChange}
                  placeholder="e.g., Thoroughbred, Arabian, Quarter Horse"
                  className={inputClass}
                />
              </div>

              {/* Height */}
              <div>
                <label className="label-tech block mb-1.5">Height (hands)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="e.g., 15.2"
                  step="0.1"
                  min="0"
                  className={inputClass}
                />
              </div>

              {/* Year of Birth - Mandatory */}
              <div>
                <label className="label-tech block mb-1.5">
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
                  className={inputClass}
                />
              </div>

              {/* Gender - Mandatory */}
              <div>
                <label className="label-tech block mb-1.5">
                  Gender <span className="text-destructive">*</span>
                </label>
                <Select value={formData.gender} onValueChange={(v) => setFormData(prev => ({ ...prev, gender: v }))}>
                  <SelectTrigger className={selectClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mare">Mare (Female)</SelectItem>
                    <SelectItem value="Stallion">Stallion (Male)</SelectItem>
                    <SelectItem value="Gelding">Gelding (Castrated Male)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Passport/Horse Code */}
              <div className="pt-2">
              <h3 className="text-sm font-semibold text-on-surface mb-2">Identification</h3>
              <p className="text-xs text-muted-foreground mb-4">Choose one: Passport Number or Horse Code</p>

              <div className="space-y-4">
                {!useHorseCode && (
                  <div>
                    <label className="label-tech block mb-1.5">
                      Passport Number <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      name="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleChange}
                      placeholder="e.g., FRA040500000123"
                      className={inputClass}
                    />
                  </div>
                )}

                {useHorseCode && (
                  <div>
                    <label className="label-tech block mb-1.5">
                      Horse Code <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      name="horseCode"
                      value={formData.horseCode}
                      onChange={handleChange}
                      placeholder="e.g., HC-2024-001"
                      className={inputClass}
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
                    className="w-4 h-4 border border-border rounded"
                  />
                  <span className="text-sm text-muted-foreground">Use Horse Code instead of Passport Number</span>
                </label>

                <div className="mt-4">
                  <label className="label-tech block mb-1.5">
                    Embassy ID <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    name="embassyId"
                    value={formData.embassyId}
                    onChange={handleChange}
                    placeholder="e.g., EIRSHR00076"
                    maxLength={11}
                    required
                    className={`${inputClass} font-mono`}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Format: EIRSHR followed by 5 digits (e.g., EIRSHR00076)</p>
                </div>
              </div>
              </div>

            </form>
          </div>

          {/* ── Sticky footer ── */}
          <div className="flex items-center gap-3 px-6 py-4 border-t border-border/40 flex-shrink-0">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 btn-cta rounded-xl text-sm font-bold"
            >
              {loading ? (isEdit ? 'Updating...' : 'Registering...') : (isEdit ? 'Update Horse' : 'Register Horse')}
            </button>
            <Link
              href="/horses"
              className="flex-1 py-2.5 bg-surface-container rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/50 text-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { Pencil, Save, X, Camera, Check, Mail, Phone, MapPin, User, Calendar, Shield, Hash } from 'lucide-react';
import Cropper, { Area } from 'react-easy-crop';

interface UserProfile {
  id: string;
  eId: string;
  email: string;
  firstName: string;
  lastName: string;
  designation?: string;
  phone?: string;
  optionalPhone?: string;
  gender?: string;
  address?: string;
  efiRiderId?: string;
  dob?: string;
  imageUrl?: string;
  isGoogleAuth?: boolean;
  role?: string;
  createdAt?: string;
}

interface InlineFieldProps {
  field: string;
  label: string;
  value?: string | null;
  icon: any;
  type?: string;
  options?: { value: string; label: string }[];
  readOnly?: boolean;
  badge?: React.ReactNode;
  editingField: string | null;
  editValue: string;
  saving: boolean;
  setEditValue: (v: string) => void;
  onSave: (field: string, value: string) => void;
  onStartEdit: (field: string, value: string) => void;
  onCancel: () => void;
}

function InlineField({
  field, label, value, icon: Icon, type = 'text', options, readOnly = false, badge,
  editingField, editValue, saving, setEditValue, onSave, onStartEdit, onCancel,
}: InlineFieldProps) {
  const isEditing = editingField === field;
  const displayValue = field === 'dob' && value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : value;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') onSave(field, editValue);
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="group flex items-center justify-between py-3 px-4 rounded-xl transition-colors transition-all duration-200">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 flex-shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-0.5">{label}</p>
          {isEditing ? (
            <div className="flex items-center gap-2">
              {type === 'select' && options ? (
                <select
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary w-full max-w-xs"
                >
                  <option value="" className="bg-gray-800">Select</option>
                  {options.map((o) => (
                    <option key={o.value} value={o.value} className="bg-gray-800">{o.label}</option>
                  ))}
                </select>
              ) : type === 'textarea' ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  rows={2}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary w-full max-w-md resize-none"
                />
              ) : (
                <input
                  type={type}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary w-full max-w-xs"
                />
              )}
              <button
                onClick={() => onSave(field, editValue)}
                disabled={saving}
                className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={onCancel}
                className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-white text-sm truncate">{displayValue || <span className="text-gray-600 italic">Not set</span>}</p>
              {badge}
            </div>
          )}
        </div>
      </div>
      {!isEditing && !readOnly && (
        <button
          onClick={() => onStartEdit(field, (value || ''))}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-all"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const maxSize = 300;
  const scale = Math.min(maxSize / pixelCrop.width, maxSize / pixelCrop.height, 1);
  canvas.width = Math.round(pixelCrop.width * scale);
  canvas.height = Math.round(pixelCrop.height * scale);
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas to blob failed'));
    }, 'image/jpeg', 0.8);
  });
}

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Image crop state
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('authToken');
      if (!token) { router.push('/auth/login'); return; }
      const response = await api.get('/api/users/profile');
      setProfile(response.data.data);
    } catch (err: any) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value || '');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveField = async (field: string, value: string) => {
    try {
      setSaving(true);
      setError(null);
      const payload: Record<string, string | null> = {};
      if (field === 'name') {
        const parts = value.trim().split(/\s+/);
        payload.firstName = parts[0] || '';
        payload.lastName = parts.slice(1).join(' ') || '';
      } else {
        payload[field] = value || null;
      }
      await api.put('/api/users/profile', payload);
      if (field === 'name') {
        const parts = value.trim().split(/\s+/);
        setProfile((prev) => prev ? { ...prev, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' } : prev);
      } else {
        setProfile((prev) => prev ? { ...prev, [field]: value || null } : prev);
      }
      setEditingField(null);
      setEditValue('');
      setSuccess('Updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') saveField(field, editValue);
    if (e.key === 'Escape') cancelEdit();
  };

  // Image handling
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      setError('Only JPEG, PNG, GIF images are allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowCropModal(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setUploadingImage(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const reader = new FileReader();
      const imageUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(croppedBlob);
      });
      await api.put('/api/users/profile', { imageUrl });
      setProfile((prev) => prev ? { ...prev, imageUrl } : prev);
      setShowCropModal(false);
      setImageSrc(null);
      setSuccess('Profile picture updated');
    } catch (err: any) {
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const getInitials = () => {
    if (!profile) return '';
    return `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase();
  };

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    return `/uploads/${url.replace(/^\/uploads\//, '')}`;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <div className="text-center py-8">
          <p className="text-gray-400">Profile not found</p>
        </div>
      </ProtectedRoute>
    );
  }

  const inlineProps = {
    editingField, editValue, saving, setEditValue,
    onSave: saveField, onStartEdit: startEdit, onCancel: cancelEdit,
  };

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Notifications */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm">
            {success}
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bento-card rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-6">
            {/* Profile Picture */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
                {profile.imageUrl ? (
                  <img
                    src={getImageUrl(profile.imageUrl) || ''}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold">{getInitials()}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Name + Meta */}
            <div className="flex-1 min-w-0">
              <div className="group flex items-center gap-2">
                {editingField === 'name' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 'name')}
                      autoFocus
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-xl font-bold focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => saveField('name', editValue)}
                      disabled={saving}
                      className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-white truncate">
                      {profile.firstName} {profile.lastName}
                    </h1>
                    <button
                      onClick={() => startEdit('name', `${profile.firstName} ${profile.lastName}`)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary-500/20 text-primary-300 text-xs font-semibold">
                  <Shield className="w-3 h-3" />
                  {profile.role || 'Rider'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 text-gray-300 text-xs font-mono">
                  <Hash className="w-3 h-3" />
                  {profile.eId}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bento-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Personal Information</h2>
          </div>
          <div className="p-2 divide-y divide-white/5">
            <InlineField
              field="dob"
              label="Date of Birth"
              value={profile.dob ? profile.dob.split('T')[0] : ''}
              icon={Calendar}
              type="date"
              {...inlineProps}
            />
            <InlineField
              field="gender"
              label="Gender"
              value={profile.gender}
              icon={User}
              type="select"
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
              ]}
              {...inlineProps}
            />
            <InlineField
              field="efiRiderId"
              label="EFI Rider ID"
              value={profile.efiRiderId}
              icon={Hash}
              {...inlineProps}
            />
            <InlineField
              field="phone"
              label="Mobile Number"
              value={profile.phone}
              icon={Phone}
              type="tel"
              {...inlineProps}
            />
            <InlineField
              field="optionalPhone"
              label="Optional Number"
              value={profile.optionalPhone}
              icon={Phone}
              type="tel"
              {...inlineProps}
            />
            <InlineField
              field="address"
              label="Address"
              value={profile.address}
              icon={MapPin}
              type="textarea"
              {...inlineProps}
            />
            <InlineField
              field="email"
              label="Email"
              value={profile.email}
              icon={Mail}
              readOnly
              {...inlineProps}
              badge={
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    profile.isGoogleAuth
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {profile.isGoogleAuth ? (
                    <><Check className="w-3 h-3" /> Verified</>
                  ) : (
                    'Unverified'
                  )}
                </span>
              }
            />
          </div>
        </div>

        {/* Crop Modal */}
        {showCropModal && imageSrc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bento-card rounded-2xl border border-white/20 w-full max-w-lg mx-4 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Crop Profile Picture</h3>
                <button
                  onClick={() => { setShowCropModal(false); setImageSrc(null); }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative w-full h-80 bg-black">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="px-6 py-3 border-t border-white/10">
                <label className="text-xs text-gray-400 mb-1 block">Zoom</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
              </div>
              <div className="px-6 py-4 border-t border-white/10 flex gap-3 justify-end">
                <button
                  onClick={() => { setShowCropModal(false); setImageSrc(null); }}
                  className="px-4 py-2 rounded-xl border border-white/20 text-gray-300 hover:bg-white/10 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropSave}
                  disabled={uploadingImage}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium hover:opacity-90 transition text-sm disabled:opacity-50"
                >
                  {uploadingImage ? 'Uploading...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

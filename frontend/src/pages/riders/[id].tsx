import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ArrowLeft, Pencil, Save, X, Plus, Trash2, ImageIcon, Ban } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import AddressMapPicker from '@/components/AddressMapPicker';

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
  other?: string;
}

interface Horse {
  id: string;
  eId: string;
  name: string;
  breed?: string;
  color?: string;
  gender: string;
  yearOfBirth?: number;
  horseCode?: string;
  height?: number;
  isActive: boolean;
}

interface Club {
  id: string;
  name: string;
  shortCode?: string;
}

interface RiderDetail {
  id: string;
  eId: string;
  efiRiderId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  dob: string | null;
  gender: string | null;
  mobile: string | null;
  optionalPhone: string | null;
  address: string | null;
  imageUrl: string | null;
  socialLinks: SocialLinks | null;
  isActive: boolean;
  clubId: string | null;
  club: Club | null;
  horses: Horse[];
  registrations: any[];
}

interface AvailableHorse {
  id: string;
  name: string;
  breed?: string;
  gender: string;
}

export default function RiderDetail() {
  const router = useRouter();
  const { id, mode } = router.query;
  const isViewMode = mode === 'view';

  const [rider, setRider] = useState<RiderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    optionalPhone: '',
    gender: '',
    dob: '',
    address: '',
    efiRiderId: '',
    eId: '',
    imageUrl: '',
    socialLinks: { instagram: '', twitter: '', facebook: '', youtube: '', website: '', other: '' } as SocialLinks,
  });

  // Horse management
  const [availableHorses, setAvailableHorses] = useState<AvailableHorse[]>([]);
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const [showHorseSelector, setShowHorseSelector] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchRider();
    }
  }, [id]);

  const fetchRider = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/riders/${id}`);
      const data = response.data.data;
      setRider(data);
      const sl = (data.socialLinks || {}) as SocialLinks;
      setEditForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        mobile: data.mobile || '',
        optionalPhone: data.optionalPhone || '',
        gender: data.gender || '',
        dob: data.dob ? data.dob.split('T')[0] : '',
        address: data.address || '',
        efiRiderId: data.efiRiderId || '',
        eId: data.eId || '',
        imageUrl: data.imageUrl || '',
        socialLinks: {
          instagram: sl.instagram || '',
          twitter: sl.twitter || '',
          facebook: sl.facebook || '',
          youtube: sl.youtube || '',
          website: sl.website || '',
          other: sl.other || '',
        },
      });
    } catch (err) {
      console.error('Failed to fetch rider:', err);
      toast.error('Failed to load rider details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableHorses = async () => {
    try {
      const res = await api.get('/api/horses?limit=100');
      const horses = res.data.data?.horses || res.data.data || [];
      // Filter out horses already linked to this rider
      const linkedIds = new Set(rider?.horses.map(h => h.id) || []);
      setAvailableHorses(horses.filter((h: any) => !linkedIds.has(h.id)));
    } catch (err) {
      console.error('Failed to fetch horses:', err);
    }
  };

  const handleSave = async () => {
    if (!editForm.firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!editForm.efiRiderId.trim()) {
      toast.error('EFI Rider ID is required');
      return;
    }
    if (!editForm.email.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      setSaving(true);
      const socialLinks = Object.fromEntries(
        Object.entries(editForm.socialLinks).filter(([_, v]) => v && v.trim())
      );
      await api.put(`/api/riders/${id}`, {
        ...editForm,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
        optionalPhone: editForm.optionalPhone || null,
        imageUrl: editForm.imageUrl || null,
      });
      toast.success('Rider updated successfully');
      setEditing(false);
      fetchRider();
    } catch (err) {
      console.error('Failed to update rider:', err);
      toast.error('Failed to update rider');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkHorse = async () => {
    if (!selectedHorseId) return;
    try {
      await api.put(`/api/horses/${selectedHorseId}`, { riderId: id });
      toast.success('Horse linked to rider');
      setSelectedHorseId('');
      setShowHorseSelector(false);
      fetchRider();
    } catch (err) {
      console.error('Failed to link horse:', err);
      toast.error('Failed to link horse');
    }
  };

  const handleUnlinkHorse = async (horseId: string) => {
    if (!confirm('Remove this horse from the rider?')) return;
    try {
      await api.put(`/api/horses/${horseId}`, { riderId: null });
      toast.success('Horse removed from rider');
      fetchRider();
    } catch (err) {
      console.error('Failed to unlink horse:', err);
      toast.error('Failed to unlink horse');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: 48, borderRadius: 8, background: 'rgba(255,255,255,0.08)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </ProtectedRoute>
    );
  }

  if (!rider) {
    return (
      <ProtectedRoute>
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">Rider not found</p>
          <Link href="/riders" className="text-primary hover:text-primary-300 mt-4 inline-block">
            Back to Riders
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Head><title>{rider.firstName} {rider.lastName} | Rider Details</title></Head>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/riders" className="transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">
              {isViewMode ? 'Rider Details' : 'Rider Profile'}
            </h1>
          </div>
          <div className="flex gap-3">
            {isViewMode ? (
              <button
                onClick={() => router.push(`/riders/${id}`)}
                className="btn-primary flex items-center gap-2"
              >
                <Pencil /> Switch to Edit
              </button>
            ) : !editing ? (
              <>
              <button
                onClick={() => setEditing(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Pencil /> Edit Rider
              </button>
              <button
                onClick={async () => {
                  if (!confirm(`${rider.isActive ? 'Disable' : 'Enable'} this rider?`)) return;
                  try {
                    await api.patch(`/api/riders/${id}/disable`, { isActive: !rider.isActive });
                    toast.success(`Rider ${rider.isActive ? 'disabled' : 'enabled'}`);
                    fetchRider();
                  } catch (err) {
                    toast.error('Failed to update rider status');
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${rider.isActive ? 'text-orange-400 bg-orange-400/10 border-orange-400/20 hover:bg-orange-400/15' : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 hover:bg-emerald-400/15'}`}
              >
                <Ban className="w-4 h-4" /> {rider.isActive ? 'Disable' : 'Enable'}
              </button>
              </>
            ) : (
              <>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                  <Save /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => { setEditing(false); fetchRider(); }} className="btn-secondary flex items-center gap-2">
                  <X /> Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Rider Card */}
        <div className="bento-card p-6">
          <div className="flex gap-6">
            {/* Image */}
            <div className="flex-shrink-0">
              {editing ? (
                <div className="space-y-2">
                  {editForm.imageUrl ? (
                    <Image src={editForm.imageUrl} alt="Rider" width={128} height={128} className="w-32 h-32 rounded-lg object-cover" />
                  ) : (
                    <div className="w-32 h-32 rounded-lg bg-gray-700 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-3 py-2 bg-surface-container rounded-lg text-xs text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/50 cursor-pointer w-32">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    Attach
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append('file', file);
                        try {
                          const res = await api.post('/api/upload', fd);
                          setEditForm(prev => ({ ...prev, imageUrl: res.data.data?.url || res.data.url }));
                          toast.success('Image uploaded');
                        } catch (err) {
                          toast.error('Failed to upload image');
                        }
                      }}
                    />
                  </label>
                </div>
              ) : (
                rider.imageUrl ? (
                  <Image src={rider.imageUrl} alt="Rider" width={128} height={128} className="w-32 h-32 rounded-lg object-cover" />
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-gray-700 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                )
              )}
            </div>

            {/* Info */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Embassy ID</p>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.eId}
                    onChange={(e) => setEditForm(prev => ({ ...prev, eId: e.target.value }))}
                    className="input font-mono"
                  />
                ) : (
                  <p className="text-on-surface font-mono">{rider.eId}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">EFI Rider ID <span className="text-destructive">*</span></p>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.efiRiderId}
                    onChange={(e) => setEditForm(prev => ({ ...prev, efiRiderId: e.target.value }))}
                    className="input"
                    required
                  />
                ) : (
                  <p className="text-on-surface">{rider.efiRiderId || '-'}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">First Name <span className="text-destructive">*</span></p>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="input"
                    required
                  />
                ) : (
                  <p className="text-on-surface font-semibold">{rider.firstName}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Name</p>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="input"
                  />
                ) : (
                  <p className="text-on-surface">{rider.lastName || '-'}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                {editing ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="input"
                    required
                  />
                ) : (
                  <p className="text-on-surface">{rider.email}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                {editing ? (
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                    className="input"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-on-surface">{rider.gender || '-'}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                {editing ? (
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={(e) => setEditForm(prev => ({ ...prev, dob: e.target.value }))}
                    className="input"
                  />
                ) : (
                  <p className="text-on-surface">{rider.dob ? new Date(rider.dob).toLocaleDateString() : '-'}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mobile</p>
                {editing ? (
                  <input
                    type="tel"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm(prev => ({ ...prev, mobile: e.target.value }))}
                    className="input"
                  />
                ) : (
                  <p className="text-on-surface">{rider.mobile || '-'}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Optional Phone</p>
                {editing ? (
                  <input
                    type="tel"
                    value={editForm.optionalPhone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, optionalPhone: e.target.value }))}
                    className="input"
                  />
                ) : (
                  <p className="text-on-surface">{rider.optionalPhone || '-'}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Club</p>
                <p className="text-on-surface">{rider.club?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  rider.isActive
                    ? 'badge-emerald'
                    : 'badge-danger'
                }`}>
                  {rider.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="bento-card p-6">
          <h3 className="text-xl font-bold text-on-surface mb-4">Address</h3>
          {editing ? (
            <div className="space-y-3">
              <textarea
                value={editForm.address}
                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter address"
                rows={3}
                className="input"
              />
              <AddressMapPicker
                address={editForm.address}
                onAddressChange={(components) => {
                  const parts = [components.address, components.city, components.state, components.country, components.pincode].filter(Boolean);
                  setEditForm(prev => ({ ...prev, address: parts.join(', ') }));
                }}
              />
            </div>
          ) : (
            <p className="text-muted-foreground">{rider.address || 'No address provided'}</p>
          )}
        </div>

        {/* Social Links Section */}
        <div className="bento-card p-6">
          <h3 className="text-xl font-bold text-on-surface mb-4">Social Links</h3>
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['instagram', 'twitter', 'facebook', 'youtube', 'website', 'other'] as const).map(platform => (
                <div key={platform}>
                  <label className="block text-sm text-muted-foreground mb-1 capitalize">{platform}</label>
                  <input
                    type="text"
                    value={editForm.socialLinks[platform] || ''}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, [platform]: e.target.value },
                    }))}
                    placeholder={`${platform} URL or handle`}
                    className="input"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rider.socialLinks && typeof rider.socialLinks === 'object' ? (
                Object.entries(rider.socialLinks as SocialLinks)
                  .filter(([_, v]) => v)
                  .map(([platform, url]) => (
                    <div key={platform} className="flex items-center gap-2">
                      <span className="text-muted-foreground capitalize text-sm">{platform}:</span>
                      <a
                        href={url!.startsWith('http') ? url! : `https://${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-300 text-sm truncate"
                      >
                        {url}
                      </a>
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground">No social links added</p>
              )}
            </div>
          )}
        </div>

        {/* Horses Section */}
        <div className="bento-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-on-surface">Horses ({rider.horses.length})</h3>
            {!isViewMode && (
              <button
                onClick={() => { setShowHorseSelector(!showHorseSelector); if (!showHorseSelector) fetchAvailableHorses(); }}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus /> Add Horse
              </button>
            )}
          </div>

          {/* Horse Selector */}
          {showHorseSelector && (
            <div className="mb-4 p-4 rounded-lg  border border-white border-opacity-10">
              <p className="text-sm text-muted-foreground mb-2">Select a horse to link to this rider:</p>
              <div className="flex gap-3">
                <select
                  value={selectedHorseId}
                  onChange={(e) => setSelectedHorseId(e.target.value)}
                  className="input flex-1"
                >
                  <option value="">Choose a horse...</option>
                  {availableHorses.map(h => (
                    <option key={h.id} value={h.id}>{h.name} ({h.breed || h.gender})</option>
                  ))}
                </select>
                <button
                  onClick={handleLinkHorse}
                  disabled={!selectedHorseId}
                  className="btn-primary disabled:opacity-50"
                >
                  Link Horse
                </button>
                <button
                  onClick={() => { setShowHorseSelector(false); setSelectedHorseId(''); }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
              {availableHorses.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No available horses. <Link href="/horses/create" className="text-primary">Create one</Link>.
                </p>
              )}
            </div>
          )}

          {/* Horses Table */}
          {rider.horses.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No horses linked to this rider</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Breed</th>
                  <th>Gender</th>
                  <th>Year of Birth</th>
                  <th>Horse Code</th>
                  <th>Height</th>
                  {!isViewMode && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rider.horses.map(horse => (
                  <tr key={horse.id}>
                    <td className="font-medium">{horse.name}</td>
                    <td>{horse.breed || '-'}</td>
                    <td>{horse.gender}</td>
                    <td>{horse.yearOfBirth || '-'}</td>
                    <td>{horse.horseCode || '-'}</td>
                    <td>{horse.height ? `${horse.height}m` : '-'}</td>
                    {!isViewMode && (
                      <td>
                        <button
                          onClick={() => handleUnlinkHorse(horse.id)}
                          className="text-destructive hover:text-destructive"
                          title="Remove horse"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Registrations Summary */}
        {rider.registrations.length > 0 && (
          <div className="bento-card p-6">
            <h3 className="text-xl font-bold text-on-surface mb-4">Event Registrations ({rider.registrations.length})</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Horse</th>
                  <th>Payment</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {rider.registrations.map((reg: any) => (
                  <tr key={reg.id}>
                    <td>{reg.event?.name || '-'}</td>
                    <td>{reg.horse?.name || '-'}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        reg.paymentStatus === 'PAID'
                          ? 'badge-emerald'
                          : 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                      }`}>
                        {reg.paymentStatus}
                      </span>
                    </td>
                    <td>₹{reg.totalAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

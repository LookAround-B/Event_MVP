import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { FiArrowLeft, FiPlus, FiTrash2, FiEdit2, FiSave, FiX, FiImage } from 'react-icons/fi';

interface Rider {
  id: string;
  eId: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  efiRiderId: string;
  gender: string;
  dob: string;
  address: string;
}

interface Horse {
  id: string;
  eId: string;
  name: string;
  breed: string;
  color: string;
  gender: string;
  yearOfBirth: number;
  passportNumber: string;
  horseCode: string;
  height: number;
}

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
  other?: string;
}

interface Club {
  id: string;
  eId: string;
  name: string;
  shortCode: string;
  email: string;
  contactNumber: string;
  optionalPhone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  description: string;
  logoUrl: string;
  socialLinks: SocialLinks | null;
  isActive: boolean;
  primaryContact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    gender: string;
    phone: string;
    dob: string;
  };
}

export default function ClubDetail() {
  const router = useRouter();
  const { id, mode } = router.query;
  const isViewMode = mode === 'view';
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'riders' | 'horses'>('riders');
  const [riders, setRiders] = useState<Rider[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [showAddRider, setShowAddRider] = useState(false);
  const [showAddHorse, setShowAddHorse] = useState(false);
  const [editingRiderId, setEditingRiderId] = useState<string | null>(null);
  const [editingHorseId, setEditingHorseId] = useState<string | null>(null);
  const [editClub, setEditClub] = useState(false);
  const [editEmbassyId, setEditEmbassyId] = useState('');
  const [riderForm, setRiderForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    efiRiderId: '',
    dob: '',
    gender: 'Male',
    address: '',
  });
  const [editRiderForm, setEditRiderForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    efiRiderId: '',
    dob: '',
    gender: '',
    address: '',
  });
  const [horseForm, setHorseForm] = useState({
    name: '',
    color: '',
    gender: 'Mare',
    yearOfBirth: new Date().getFullYear(),
    passportNumber: '',
    breed: '',
    horseCode: '',
    height: '',
  });
  const [editHorseForm, setEditHorseForm] = useState({
    name: '',
    color: '',
    gender: '',
    yearOfBirth: 0,
    passportNumber: '',
    breed: '',
    horseCode: '',
    height: '',
  });
  const [clubEditForm, setClubEditForm] = useState({
    name: '',
    shortCode: '',
    email: '',
    contactNumber: '',
    optionalPhone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    description: '',
    logoUrl: '',
    eId: '',
    socialLinks: { instagram: '', twitter: '', facebook: '', youtube: '', website: '', other: '' } as SocialLinks,
  });

  useEffect(() => {
    if (id) {
      fetchClubDetails();
    }
  }, [id]);

  const fetchClubDetails = async () => {
    try {
      const response = await api.get(`/api/clubs/${id}`);
      const data = response.data.data;
      setClub(data);
      setEditEmbassyId(data.eId || '');
      setClubEditForm({
        name: data.name || '',
        shortCode: data.shortCode || '',
        email: data.email || '',
        contactNumber: data.contactNumber || '',
        optionalPhone: data.optionalPhone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        pincode: data.pincode || '',
        description: data.description || '',
        logoUrl: data.logoUrl || '',
        eId: data.eId || '',
        socialLinks: {
          instagram: data.socialLinks?.instagram || '',
          twitter: data.socialLinks?.twitter || '',
          facebook: data.socialLinks?.facebook || '',
          youtube: data.socialLinks?.youtube || '',
          website: data.socialLinks?.website || '',
          other: data.socialLinks?.other || '',
        },
      });
      await Promise.all([fetchRiders(), fetchHorses()]);
    } catch (error) {
      console.error('Failed to fetch club details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiders = async () => {
    try {
      const response = await api.get(`/api/clubs/${id}/riders`);
      setRiders(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch riders:', error);
    }
  };

  const fetchHorses = async () => {
    try {
      const response = await api.get(`/api/clubs/${id}/horses`);
      setHorses(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch horses:', error);
    }
  };

  const saveClubEdit = async () => {
    try {
      await api.put(`/api/clubs/${id}`, {
        ...clubEditForm,
        socialLinks: clubEditForm.socialLinks,
      });
      toast.success('Club updated successfully');
      setEditClub(false);
      fetchClubDetails();
    } catch (error) {
      console.error('Failed to update club:', error);
      toast.error('Failed to update club');
    }
  };

  const addRider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/api/clubs/${id}/riders`, riderForm);
      setRiderForm({ firstName: '', lastName: '', email: '', mobile: '', efiRiderId: '', dob: '', gender: 'Male', address: '' });
      setShowAddRider(false);
      fetchRiders();
      toast.success('Rider added successfully');
    } catch (error) {
      console.error('Failed to add rider:', error);
      toast.error('Failed to add rider');
    }
  };

  const updateRider = async (riderId: string) => {
    try {
      await api.put(`/api/riders/${riderId}`, editRiderForm);
      setEditingRiderId(null);
      fetchRiders();
      toast.success('Rider updated successfully');
    } catch (error) {
      console.error('Failed to update rider:', error);
      toast.error('Failed to update rider');
    }
  };

  const startEditRider = (rider: Rider) => {
    setEditingRiderId(rider.id);
    setEditRiderForm({
      firstName: rider.firstName || '',
      lastName: rider.lastName || '',
      email: rider.email || '',
      mobile: rider.mobile || '',
      efiRiderId: rider.efiRiderId || '',
      dob: rider.dob ? rider.dob.split('T')[0] : '',
      gender: rider.gender || '',
      address: rider.address || '',
    });
  };

  const addHorse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/api/clubs/${id}/horses`, {
        ...horseForm,
        yearOfBirth: horseForm.yearOfBirth ? Number(horseForm.yearOfBirth) : undefined,
        height: horseForm.height ? Number(horseForm.height) : undefined,
      });
      setHorseForm({ name: '', color: '', gender: 'Mare', yearOfBirth: new Date().getFullYear(), passportNumber: '', breed: '', horseCode: '', height: '' });
      setShowAddHorse(false);
      fetchHorses();
      toast.success('Horse added successfully');
    } catch (error) {
      console.error('Failed to add horse:', error);
      toast.error('Failed to add horse');
    }
  };

  const updateHorse = async (horseId: string) => {
    try {
      await api.put(`/api/horses/${horseId}`, {
        ...editHorseForm,
        yearOfBirth: editHorseForm.yearOfBirth ? Number(editHorseForm.yearOfBirth) : undefined,
        height: editHorseForm.height ? Number(editHorseForm.height) : undefined,
      });
      setEditingHorseId(null);
      fetchHorses();
      toast.success('Horse updated successfully');
    } catch (error) {
      console.error('Failed to update horse:', error);
      toast.error('Failed to update horse');
    }
  };

  const startEditHorse = (horse: Horse) => {
    setEditingHorseId(horse.id);
    setEditHorseForm({
      name: horse.name || '',
      color: horse.color || '',
      gender: horse.gender || '',
      yearOfBirth: horse.yearOfBirth || 0,
      passportNumber: horse.passportNumber || '',
      breed: horse.breed || '',
      horseCode: horse.horseCode || '',
      height: horse.height ? String(horse.height) : '',
    });
  };

  const deleteRider = async (riderId: string) => {
    if (confirm('Delete this rider?')) {
      try {
        await api.delete(`/api/riders/${riderId}`);
        fetchRiders();
        toast.success('Rider deleted');
      } catch (error) {
        console.error('Failed to delete rider:', error);
        toast.error('Failed to delete rider');
      }
    }
  };

  const deleteHorse = async (horseId: string) => {
    if (confirm('Delete this horse?')) {
      try {
        await api.delete(`/api/horses/${horseId}`);
        fetchHorses();
        toast.success('Horse deleted');
      } catch (error) {
        console.error('Failed to delete horse:', error);
        toast.error('Failed to delete horse');
      }
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-300 mt-2">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!club) {
    return (
      <ProtectedRoute>
        <div className="text-center py-8 text-gray-400">Club not found</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/clubs" className="text-purple-400 hover:text-purple-300 flex items-center gap-2">
            <FiArrowLeft /> Back to Clubs
          </Link>
          {isViewMode && (
            <Link href={`/clubs/${id}`} className="btn-secondary text-sm ml-auto">
              <FiEdit2 className="inline mr-1" /> Switch to Edit
            </Link>
          )}
        </div>

        {/* Club Details Card */}
        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              {/* Club Logo/Image */}
              <div className="w-20 h-20 rounded-lg bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600">
                {club.logoUrl ? (
                  <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
                ) : (
                  <FiImage className="text-gray-400" size={32} />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{club.name}</h1>
                <p className="text-gray-400 text-sm mt-1">Embassy ID: {club.eId || '—'}</p>
              </div>
            </div>
            {!isViewMode && !editClub && (
              <button onClick={() => setEditClub(true)} className="btn-secondary flex items-center gap-2">
                <FiEdit2 /> Edit Club
              </button>
            )}
          </div>

          {editClub && !isViewMode ? (
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Club Name</label>
                  <input type="text" value={clubEditForm.name} onChange={e => setClubEditForm({ ...clubEditForm, name: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Club Code</label>
                  <input type="text" value={clubEditForm.shortCode} onChange={e => setClubEditForm({ ...clubEditForm, shortCode: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Embassy ID</label>
                  <input type="text" value={clubEditForm.eId} onChange={e => setClubEditForm({ ...clubEditForm, eId: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Office Email</label>
                  <input type="email" value={clubEditForm.email} onChange={e => setClubEditForm({ ...clubEditForm, email: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Contact Number</label>
                  <input type="tel" value={clubEditForm.contactNumber} onChange={e => setClubEditForm({ ...clubEditForm, contactNumber: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Optional Phone</label>
                  <input type="tel" value={clubEditForm.optionalPhone} onChange={e => setClubEditForm({ ...clubEditForm, optionalPhone: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Logo URL</label>
                  <input type="url" value={clubEditForm.logoUrl} onChange={e => setClubEditForm({ ...clubEditForm, logoUrl: e.target.value })} className="form-input" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">City</label>
                  <input type="text" value={clubEditForm.city} onChange={e => setClubEditForm({ ...clubEditForm, city: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">State</label>
                  <input type="text" value={clubEditForm.state} onChange={e => setClubEditForm({ ...clubEditForm, state: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Country</label>
                  <input type="text" value={clubEditForm.country} onChange={e => setClubEditForm({ ...clubEditForm, country: e.target.value })} className="form-input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Address</label>
                <input type="text" value={clubEditForm.address} onChange={e => setClubEditForm({ ...clubEditForm, address: e.target.value })} className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Description</label>
                <textarea value={clubEditForm.description} onChange={e => setClubEditForm({ ...clubEditForm, description: e.target.value })} className="form-input" rows={2} />
              </div>

              {/* Social Links */}
              <div className="border-t border-white border-opacity-10 pt-4">
                <h3 className="text-lg font-semibold text-white mb-3">Social Links</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1">Instagram</label>
                    <input type="url" value={clubEditForm.socialLinks.instagram || ''} onChange={e => setClubEditForm({ ...clubEditForm, socialLinks: { ...clubEditForm.socialLinks, instagram: e.target.value } })} className="form-input" placeholder="https://instagram.com/..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1">Twitter / X</label>
                    <input type="url" value={clubEditForm.socialLinks.twitter || ''} onChange={e => setClubEditForm({ ...clubEditForm, socialLinks: { ...clubEditForm.socialLinks, twitter: e.target.value } })} className="form-input" placeholder="https://twitter.com/..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1">Facebook</label>
                    <input type="url" value={clubEditForm.socialLinks.facebook || ''} onChange={e => setClubEditForm({ ...clubEditForm, socialLinks: { ...clubEditForm.socialLinks, facebook: e.target.value } })} className="form-input" placeholder="https://facebook.com/..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1">YouTube</label>
                    <input type="url" value={clubEditForm.socialLinks.youtube || ''} onChange={e => setClubEditForm({ ...clubEditForm, socialLinks: { ...clubEditForm.socialLinks, youtube: e.target.value } })} className="form-input" placeholder="https://youtube.com/..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1">Website</label>
                    <input type="url" value={clubEditForm.socialLinks.website || ''} onChange={e => setClubEditForm({ ...clubEditForm, socialLinks: { ...clubEditForm.socialLinks, website: e.target.value } })} className="form-input" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1">Other</label>
                    <input type="url" value={clubEditForm.socialLinks.other || ''} onChange={e => setClubEditForm({ ...clubEditForm, socialLinks: { ...clubEditForm.socialLinks, other: e.target.value } })} className="form-input" placeholder="https://..." />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={saveClubEdit} className="btn-primary flex items-center gap-2"><FiSave /> Save</button>
                <button onClick={() => setEditClub(false)} className="btn-secondary flex items-center gap-2"><FiX /> Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 text-gray-300 mt-4">
                <div>
                  <span className="text-gray-400">Club Code:</span>
                  <p className="text-white">{club.shortCode}</p>
                </div>
                <div>
                  <span className="text-gray-400">Office Email:</span>
                  <p className="text-white">{club.email || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Contact Number:</span>
                  <p className="text-white">{club.contactNumber || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Optional Phone:</span>
                  <p className="text-white">{club.optionalPhone || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-400">City:</span>
                  <p className="text-white">{club.city || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Address:</span>
                  <p className="text-white">{club.address || '—'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400">Description:</span>
                  <p className="text-white">{club.description || '—'}</p>
                </div>
              </div>

              {/* Social Links Display */}
              {club.socialLinks && Object.values(club.socialLinks).some(v => v) && (
                <div className="mt-4 pt-4 border-t border-white border-opacity-10">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Social Links</h3>
                  <div className="flex flex-wrap gap-3">
                    {club.socialLinks.instagram && (
                      <a href={club.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">Instagram</a>
                    )}
                    {club.socialLinks.twitter && (
                      <a href={club.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">Twitter / X</a>
                    )}
                    {club.socialLinks.facebook && (
                      <a href={club.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">Facebook</a>
                    )}
                    {club.socialLinks.youtube && (
                      <a href={club.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">YouTube</a>
                    )}
                    {club.socialLinks.website && (
                      <a href={club.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">Website</a>
                    )}
                    {club.socialLinks.other && (
                      <a href={club.socialLinks.other} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">Other</a>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Contact Person Card */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">Contact Person</h2>
          <div className="grid grid-cols-2 gap-4 text-gray-300">
            <div>
              <span className="text-gray-400">First Name:</span>
              <p className="text-white">{club.primaryContact?.firstName || '—'}</p>
            </div>
            <div>
              <span className="text-gray-400">Last Name:</span>
              <p className="text-white">{club.primaryContact?.lastName || '—'}</p>
            </div>
            <div>
              <span className="text-gray-400">Gender:</span>
              <p className="text-white">{club.primaryContact?.gender || '—'}</p>
            </div>
            <div>
              <span className="text-gray-400">Date of Birth:</span>
              <p className="text-white">{club.primaryContact?.dob ? new Date(club.primaryContact.dob).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <span className="text-gray-400">Personal Email:</span>
              <p className="text-white">{club.primaryContact?.email || '—'}</p>
            </div>
            <div>
              <span className="text-gray-400">Phone:</span>
              <p className="text-white">{club.primaryContact?.phone || '—'}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="flex border-b border-white border-opacity-10 mb-6">
            <button
              onClick={() => setActiveTab('riders')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'riders'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Riders ({riders.length})
            </button>
            <button
              onClick={() => setActiveTab('horses')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'horses'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Horses ({horses.length})
            </button>
          </div>

          {activeTab === 'riders' && (
            <div>
              {!isViewMode && (
                <button
                  onClick={() => setShowAddRider(!showAddRider)}
                  className="btn-secondary mb-4 flex items-center gap-2"
                >
                  <FiPlus /> Add Rider
                </button>
              )}

              {showAddRider && !isViewMode && (
                <form onSubmit={addRider} className="space-y-4 mb-6 pb-6 border-b border-white border-opacity-10">
                  <h3 className="text-lg font-semibold text-white">Add New Rider</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="First Name *"
                      value={riderForm.firstName}
                      onChange={e => setRiderForm({ ...riderForm, firstName: e.target.value })}
                      required
                      className="form-input"
                    />
                    <input
                      type="text"
                      placeholder="Last Name *"
                      value={riderForm.lastName}
                      onChange={e => setRiderForm({ ...riderForm, lastName: e.target.value })}
                      required
                      className="form-input"
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={riderForm.email}
                      onChange={e => setRiderForm({ ...riderForm, email: e.target.value })}
                      required
                      className="form-input"
                    />
                    <input
                      type="tel"
                      placeholder="Mobile"
                      value={riderForm.mobile}
                      onChange={e => setRiderForm({ ...riderForm, mobile: e.target.value })}
                      className="form-input"
                    />
                    <input
                      type="text"
                      placeholder="EFI Rider ID"
                      value={riderForm.efiRiderId}
                      onChange={e => setRiderForm({ ...riderForm, efiRiderId: e.target.value })}
                      className="form-input"
                    />
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={riderForm.dob}
                        onChange={e => setRiderForm({ ...riderForm, dob: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <select
                      value={riderForm.gender}
                      onChange={e => setRiderForm({ ...riderForm, gender: e.target.value })}
                      className="form-input"
                    >
                      <option value="Male" className="bg-slate-800 text-white">Male</option>
                      <option value="Female" className="bg-slate-800 text-white">Female</option>
                      <option value="Other" className="bg-slate-800 text-white">Other</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Address"
                      value={riderForm.address}
                      onChange={e => setRiderForm({ ...riderForm, address: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary">Save</button>
                    <button type="button" onClick={() => setShowAddRider(false)} className="btn-secondary">Cancel</button>
                  </div>
                </form>
              )}

              {riders.length === 0 ? (
                <p className="text-gray-400">No riders yet</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>EFI Rider ID</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Gender</th>
                        <th>DOB</th>
                        <th>Address</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riders.map(rider => (
                        <tr key={rider.id}>
                          {editingRiderId === rider.id ? (
                            <>
                              <td>
                                <div className="flex gap-1">
                                  <input type="text" value={editRiderForm.firstName} onChange={e => setEditRiderForm({ ...editRiderForm, firstName: e.target.value })} className="form-input text-xs py-1 px-2 w-20" placeholder="First" />
                                  <input type="text" value={editRiderForm.lastName} onChange={e => setEditRiderForm({ ...editRiderForm, lastName: e.target.value })} className="form-input text-xs py-1 px-2 w-20" placeholder="Last" />
                                </div>
                              </td>
                              <td><input type="text" value={editRiderForm.efiRiderId} onChange={e => setEditRiderForm({ ...editRiderForm, efiRiderId: e.target.value })} className="form-input text-xs py-1 px-2 w-24" /></td>
                              <td><input type="email" value={editRiderForm.email} onChange={e => setEditRiderForm({ ...editRiderForm, email: e.target.value })} className="form-input text-xs py-1 px-2 w-32" /></td>
                              <td><input type="tel" value={editRiderForm.mobile} onChange={e => setEditRiderForm({ ...editRiderForm, mobile: e.target.value })} className="form-input text-xs py-1 px-2 w-24" /></td>
                              <td>
                                <select value={editRiderForm.gender} onChange={e => setEditRiderForm({ ...editRiderForm, gender: e.target.value })} className="form-input text-xs py-1 px-2 w-20">
                                  <option value="Male" className="bg-slate-800">Male</option>
                                  <option value="Female" className="bg-slate-800">Female</option>
                                  <option value="Other" className="bg-slate-800">Other</option>
                                </select>
                              </td>
                              <td><input type="date" value={editRiderForm.dob} onChange={e => setEditRiderForm({ ...editRiderForm, dob: e.target.value })} className="form-input text-xs py-1 px-2 w-32" /></td>
                              <td><input type="text" value={editRiderForm.address} onChange={e => setEditRiderForm({ ...editRiderForm, address: e.target.value })} className="form-input text-xs py-1 px-2 w-32" /></td>
                              <td>
                                <div className="flex gap-1">
                                  <button onClick={() => updateRider(rider.id)} className="text-green-400 hover:text-green-300"><FiSave size={16} /></button>
                                  <button onClick={() => setEditingRiderId(null)} className="text-gray-400 hover:text-gray-300"><FiX size={16} /></button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="font-medium">{rider.firstName} {rider.lastName}</td>
                              <td>{rider.efiRiderId || '—'}</td>
                              <td>{rider.email}</td>
                              <td>{rider.mobile || '—'}</td>
                              <td>{rider.gender || '—'}</td>
                              <td>{rider.dob ? new Date(rider.dob).toLocaleDateString() : '—'}</td>
                              <td>{rider.address || '—'}</td>
                              <td>
                                <div className="flex gap-1">
                                  {!isViewMode && (
                                    <>
                                      <button onClick={() => startEditRider(rider)} className="text-blue-400 hover:text-blue-300"><FiEdit2 size={16} /></button>
                                      <button onClick={() => deleteRider(rider.id)} className="text-red-400 hover:text-red-300"><FiTrash2 size={16} /></button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'horses' && (
            <div>
              {!isViewMode && (
                <button
                  onClick={() => setShowAddHorse(!showAddHorse)}
                  className="btn-secondary mb-4 flex items-center gap-2"
                >
                  <FiPlus /> Add Horse
                </button>
              )}

              {showAddHorse && !isViewMode && (
                <form onSubmit={addHorse} className="space-y-4 mb-6 pb-6 border-b border-white border-opacity-10">
                  <h3 className="text-lg font-semibold text-white">Add New Horse</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Horse Name *"
                      value={horseForm.name}
                      onChange={e => setHorseForm({ ...horseForm, name: e.target.value })}
                      required
                      className="form-input"
                    />
                    <input
                      type="text"
                      placeholder="Breed"
                      value={horseForm.breed}
                      onChange={e => setHorseForm({ ...horseForm, breed: e.target.value })}
                      className="form-input"
                    />
                    <input
                      type="text"
                      placeholder="Color"
                      value={horseForm.color}
                      onChange={e => setHorseForm({ ...horseForm, color: e.target.value })}
                      className="form-input"
                    />
                    <select
                      value={horseForm.gender}
                      onChange={e => setHorseForm({ ...horseForm, gender: e.target.value })}
                      className="form-input"
                    >
                      <option value="Stallion" className="bg-slate-800 text-white">Stallion</option>
                      <option value="Mare" className="bg-slate-800 text-white">Mare</option>
                      <option value="Gelding" className="bg-slate-800 text-white">Gelding</option>
                    </select>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Year of Birth</label>
                      <input
                        type="number"
                        placeholder="Year of Birth"
                        value={horseForm.yearOfBirth}
                        onChange={e => setHorseForm({ ...horseForm, yearOfBirth: parseInt(e.target.value) || 0 })}
                        className="form-input"
                        min="1950"
                        max={new Date().getFullYear()}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Passport Number"
                      value={horseForm.passportNumber}
                      onChange={e => setHorseForm({ ...horseForm, passportNumber: e.target.value })}
                      className="form-input"
                    />
                    <input
                      type="text"
                      placeholder="Horse Code"
                      value={horseForm.horseCode}
                      onChange={e => setHorseForm({ ...horseForm, horseCode: e.target.value })}
                      className="form-input"
                    />
                    <input
                      type="text"
                      placeholder="Height (hands)"
                      value={horseForm.height}
                      onChange={e => setHorseForm({ ...horseForm, height: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary">Save</button>
                    <button type="button" onClick={() => setShowAddHorse(false)} className="btn-secondary">Cancel</button>
                  </div>
                </form>
              )}

              {horses.length === 0 ? (
                <p className="text-gray-400">No horses yet</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Breed</th>
                        <th>Color</th>
                        <th>Gender</th>
                        <th>Year of Birth</th>
                        <th>Passport</th>
                        <th>Horse Code</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {horses.map(horse => (
                        <tr key={horse.id}>
                          {editingHorseId === horse.id ? (
                            <>
                              <td><input type="text" value={editHorseForm.name} onChange={e => setEditHorseForm({ ...editHorseForm, name: e.target.value })} className="form-input text-xs py-1 px-2 w-24" /></td>
                              <td><input type="text" value={editHorseForm.breed} onChange={e => setEditHorseForm({ ...editHorseForm, breed: e.target.value })} className="form-input text-xs py-1 px-2 w-20" /></td>
                              <td><input type="text" value={editHorseForm.color} onChange={e => setEditHorseForm({ ...editHorseForm, color: e.target.value })} className="form-input text-xs py-1 px-2 w-20" /></td>
                              <td>
                                <select value={editHorseForm.gender} onChange={e => setEditHorseForm({ ...editHorseForm, gender: e.target.value })} className="form-input text-xs py-1 px-2 w-24">
                                  <option value="Stallion" className="bg-slate-800">Stallion</option>
                                  <option value="Mare" className="bg-slate-800">Mare</option>
                                  <option value="Gelding" className="bg-slate-800">Gelding</option>
                                </select>
                              </td>
                              <td><input type="number" value={editHorseForm.yearOfBirth} onChange={e => setEditHorseForm({ ...editHorseForm, yearOfBirth: parseInt(e.target.value) || 0 })} className="form-input text-xs py-1 px-2 w-20" /></td>
                              <td><input type="text" value={editHorseForm.passportNumber} onChange={e => setEditHorseForm({ ...editHorseForm, passportNumber: e.target.value })} className="form-input text-xs py-1 px-2 w-24" /></td>
                              <td><input type="text" value={editHorseForm.horseCode} onChange={e => setEditHorseForm({ ...editHorseForm, horseCode: e.target.value })} className="form-input text-xs py-1 px-2 w-24" /></td>
                              <td>
                                <div className="flex gap-1">
                                  <button onClick={() => updateHorse(horse.id)} className="text-green-400 hover:text-green-300"><FiSave size={16} /></button>
                                  <button onClick={() => setEditingHorseId(null)} className="text-gray-400 hover:text-gray-300"><FiX size={16} /></button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="font-medium">{horse.name}</td>
                              <td>{horse.breed || '—'}</td>
                              <td>{horse.color || '—'}</td>
                              <td>{horse.gender}</td>
                              <td>{horse.yearOfBirth || '—'}</td>
                              <td>{horse.passportNumber || '—'}</td>
                              <td>{horse.horseCode || '—'}</td>
                              <td>
                                <div className="flex gap-1">
                                  {!isViewMode && (
                                    <>
                                      <button onClick={() => startEditHorse(horse)} className="text-blue-400 hover:text-blue-300"><FiEdit2 size={16} /></button>
                                      <button onClick={() => deleteHorse(horse.id)} className="text-red-400 hover:text-red-300"><FiTrash2 size={16} /></button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { FiArrowLeft, FiPlus, FiTrash2 } from 'react-icons/fi';

interface Rider {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
}

interface Horse {
  id: string;
  name: string;
  color: string;
  gender: string;
  yearOfBirth: number;
  passportNumber: string;
}

interface Club {
  id: string;
  name: string;
  shortCode: string;
  email: string;
  address: string;
  city: string;
  description: string;
}

export default function ClubDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'riders' | 'horses'>('riders');
  const [riders, setRiders] = useState<Rider[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [showAddRider, setShowAddRider] = useState(false);
  const [showAddHorse, setShowAddHorse] = useState(false);
  const [riderForm, setRiderForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    efiRiderId: '',
    dob: '',
    gender: 'Male',
  });
  const [horseForm, setHorseForm] = useState({
    name: '',
    color: '',
    gender: 'Mare',
    yearOfBirth: new Date().getFullYear(),
    passportNumber: '',
  });

  useEffect(() => {
    if (id) {
      fetchClubDetails();
    }
  }, [id]);

  const fetchClubDetails = async () => {
    try {
      const response = await api.get(`/api/clubs/${id}`);
      setClub(response.data.data);
      fetchRiders();
      fetchHorses();
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

  const addRider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/api/clubs/${id}/riders`, riderForm);
      setRiderForm({ firstName: '', lastName: '', email: '', mobile: '', efiRiderId: '', dob: '', gender: 'Male' });
      setShowAddRider(false);
      fetchRiders();
    } catch (error) {
      console.error('Failed to add rider:', error);
    }
  };

  const addHorse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/api/clubs/${id}/horses`, horseForm);
      setHorseForm({ name: '', color: '', gender: 'Mare', yearOfBirth: new Date().getFullYear(), passportNumber: '' });
      setShowAddHorse(false);
      fetchHorses();
    } catch (error) {
      console.error('Failed to add horse:', error);
    }
  };

  const deleteRider = async (riderId: string) => {
    if (confirm('Delete this rider?')) {
      try {
        await api.delete(`/api/riders/${riderId}`);
        fetchRiders();
      } catch (error) {
        console.error('Failed to delete rider:', error);
      }
    }
  };

  const deleteHorse = async (horseId: string) => {
    if (confirm('Delete this horse?')) {
      try {
        await api.delete(`/api/horses/${horseId}`);
        fetchHorses();
      } catch (error) {
        console.error('Failed to delete horse:', error);
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
        </div>

        {/* Club Details Card */}
        <div className="card">
          <h1 className="text-3xl font-bold text-white mb-4">{club.name}</h1>
          <div className="grid grid-cols-2 gap-4 text-gray-300">
            <div>
              <span className="text-gray-400">Code:</span> 
              <p className="text-white">{club.shortCode}</p>
            </div>
            <div>
              <span className="text-gray-400">Email:</span> 
              <p className="text-white">{club.email}</p>
            </div>
            <div>
              <span className="text-gray-400">City:</span> 
              <p className="text-white">{club.city}</p>
            </div>
            <div>
              <span className="text-gray-400">Address:</span> 
              <p className="text-white">{club.address}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400">Description:</span> 
              <p className="text-white">{club.description}</p>
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
              <button
                onClick={() => setShowAddRider(!showAddRider)}
                className="btn-secondary mb-4 flex items-center gap-2"
              >
                <FiPlus /> Add Rider
              </button>

              {showAddRider && (
                <form onSubmit={addRider} className="space-y-4 mb-6 pb-6 border-b border-white border-opacity-10">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={riderForm.firstName}
                      onChange={e => setRiderForm({ ...riderForm, firstName: e.target.value })}
                      required
                      className="form-input"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={riderForm.lastName}
                      onChange={e => setRiderForm({ ...riderForm, lastName: e.target.value })}
                      required
                      className="form-input"
                    />
                    <input
                      type="email"
                      placeholder="Email"
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
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddRider(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
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
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riders.map(rider => (
                        <tr key={rider.id}>
                          <td className="font-medium">{rider.firstName} {rider.lastName}</td>
                          <td>{rider.email}</td>
                          <td>{rider.mobile}</td>
                          <td>
                            <button
                              onClick={() => deleteRider(rider.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <FiTrash2 />
                            </button>
                          </td>
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
              <button
                onClick={() => setShowAddHorse(!showAddHorse)}
                className="btn-secondary mb-4 flex items-center gap-2"
              >
                <FiPlus /> Add Horse
              </button>

              {showAddHorse && (
                <form onSubmit={addHorse} className="space-y-4 mb-6 pb-6 border-b border-white border-opacity-10">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Horse Name"
                      value={horseForm.name}
                      onChange={e => setHorseForm({ ...horseForm, name: e.target.value })}
                      required
                      className="form-input"
                    />
                    <input
                      type="text"
                      placeholder="Color"
                      value={horseForm.color}
                      onChange={e => setHorseForm({ ...horseForm, color: e.target.value })}
                      className="form-input"
                    />
                    <input
                      type="text"
                      placeholder="Passport Number"
                      value={horseForm.passportNumber}
                      onChange={e => setHorseForm({ ...horseForm, passportNumber: e.target.value })}
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
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddHorse(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
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
                        <th>Color</th>
                        <th>Gender</th>
                        <th>Year of Birth</th>
                        <th>Passport</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {horses.map(horse => (
                        <tr key={horse.id}>
                          <td className="font-medium">{horse.name}</td>
                          <td>{horse.color}</td>
                          <td>{horse.gender}</td>
                          <td>{horse.yearOfBirth}</td>
                          <td>{horse.passportNumber}</td>
                          <td>
                            <button
                              onClick={() => deleteHorse(horse.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <FiTrash2 />
                            </button>
                          </td>
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

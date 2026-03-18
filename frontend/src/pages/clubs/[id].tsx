import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/api';
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

  if (loading) return <div className="p-6">Loading...</div>;
  if (!club) return <div className="p-6">Club not found</div>;

  return (
    <div className="p-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
      >
        <FiArrowLeft /> Back
      </button>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{club.name}</h1>
        <p className="text-gray-600 mb-4">{club.shortCode}</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Email:</span> {club.email}
          </div>
          <div>
            <span className="font-semibold">City:</span> {club.city}
          </div>
          <div>
            <span className="font-semibold">Address:</span> {club.address}
          </div>
          <div>
            <span className="font-semibold">Description:</span> {club.description}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('riders')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'riders'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Riders ({riders.length})
          </button>
          <button
            onClick={() => setActiveTab('horses')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'horses'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Horses ({horses.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'riders' && (
            <div>
              <button
                onClick={() => setShowAddRider(!showAddRider)}
                className="mb-4 bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
              >
                <FiPlus /> Add Rider
              </button>

              {showAddRider && (
                <form onSubmit={addRider} className="bg-gray-100 p-4 rounded mb-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={riderForm.firstName}
                      onChange={e => setRiderForm({ ...riderForm, firstName: e.target.value })}
                      required
                      className="px-3 py-2 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={riderForm.lastName}
                      onChange={e => setRiderForm({ ...riderForm, lastName: e.target.value })}
                      required
                      className="px-3 py-2 border border-gray-300 rounded"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={riderForm.email}
                      onChange={e => setRiderForm({ ...riderForm, email: e.target.value })}
                      required
                      className="px-3 py-2 border border-gray-300 rounded"
                    />
                    <input
                      type="tel"
                      placeholder="Mobile"
                      value={riderForm.mobile}
                      onChange={e => setRiderForm({ ...riderForm, mobile: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddRider(false)}
                      className="bg-gray-400 text-white px-4 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {riders.length === 0 ? (
                <p className="text-gray-500">No riders yet</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Mobile</th>
                      <th className="px-4 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riders.map(rider => (
                      <tr key={rider.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {rider.firstName} {rider.lastName}
                        </td>
                        <td className="px-4 py-2">{rider.email}</td>
                        <td className="px-4 py-2">{rider.mobile}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => deleteRider(rider.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'horses' && (
            <div>
              <button
                onClick={() => setShowAddHorse(!showAddHorse)}
                className="mb-4 bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
              >
                <FiPlus /> Add Horse
              </button>

              {showAddHorse && (
                <form onSubmit={addHorse} className="bg-gray-100 p-4 rounded mb-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Horse Name"
                      value={horseForm.name}
                      onChange={e => setHorseForm({ ...horseForm, name: e.target.value })}
                      required
                      className="px-3 py-2 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Color"
                      value={horseForm.color}
                      onChange={e => setHorseForm({ ...horseForm, color: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Passport Number"
                      value={horseForm.passportNumber}
                      onChange={e => setHorseForm({ ...horseForm, passportNumber: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded"
                    />
                    <select
                      value={horseForm.gender}
                      onChange={e => setHorseForm({ ...horseForm, gender: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded"
                    >
                      <option>Stallion</option>
                      <option>Mare</option>
                      <option>Gelding</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddHorse(false)}
                      className="bg-gray-400 text-white px-4 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {horses.length === 0 ? (
                <p className="text-gray-500">No horses yet</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Color</th>
                      <th className="px-4 py-2 text-left">Gender</th>
                      <th className="px-4 py-2 text-left">Year of Birth</th>
                      <th className="px-4 py-2 text-left">Passport</th>
                      <th className="px-4 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horses.map(horse => (
                      <tr key={horse.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{horse.name}</td>
                        <td className="px-4 py-2">{horse.color}</td>
                        <td className="px-4 py-2">{horse.gender}</td>
                        <td className="px-4 py-2">{horse.yearOfBirth}</td>
                        <td className="px-4 py-2">{horse.passportNumber}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => deleteHorse(horse.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

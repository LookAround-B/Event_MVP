import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiX } from 'react-icons/fi';

interface Horse {
  id: string;
  name: string;
  color: string;
  gender: string;
  passportNumber?: string;
  embassyId?: string;
  yearOfBirth?: number;
  riderName?: string;
  clubName?: string;
  userType?: string;
  isActive: boolean;
}

export default function Horses() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterGender, setFilterGender] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    setHorses([
      {
        id: '1',
        name: 'Thunder',
        color: 'Bay',
        gender: 'Stallion',
        passportNumber: 'IND-123456',
        embassyId: 'EIRSHR00076',
        yearOfBirth: 2018,
        riderName: 'John Smith',
        clubName: 'Royal Equestrian Club',
        userType: 'Admin',
        isActive: true,
      },
      {
        id: '2',
        name: 'Lady',
        color: 'Chestnut',
        gender: 'Mare',
        passportNumber: 'IND-123457',
        embassyId: 'EIRSHR00077',
        yearOfBirth: 2019,
        riderName: 'Jane Doe',
        clubName: 'Sunrise Stables',
        userType: 'Rider',
        isActive: true,
      },
    ]);
    setLoading(false);
  }, []);

  const filteredHorses = horses.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.passportNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (h.embassyId?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesGender = !filterGender || h.gender === filterGender;
    const matchesStatus = filterStatus === '' || (filterStatus === 'true' ? h.isActive : !h.isActive);
    return matchesSearch && matchesGender && matchesStatus;
  });

  const clearFilters = () => {
    setFilterGender('');
    setFilterStatus('');
  };

  const activeFilterCount = [filterGender, filterStatus].filter(Boolean).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Horses</h2>
        <Link href="/horses/create" className="btn-primary">
          <FiPlus className="inline mr-2" /> Add Horse
        </Link>
      </div>

      <div className="mb-6 card">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, passport, embassy ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${activeFilterCount > 0 ? 'ring-2 ring-indigo-400' : ''}`}
          >
            <FiFilter className="w-4 h-4" />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Sex</label>
                <select
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                  className="form-input text-sm"
                >
                  <option value="">All</option>
                  <option value="Stallion">Stallion</option>
                  <option value="Mare">Mare</option>
                  <option value="Gelding">Gelding</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="form-input text-sm"
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
              >
                <FiX className="w-3 h-3" /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      <div className="card table-container">
        {filteredHorses.length === 0 ? (
          <div className="text-center py-8">No horses found</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Sex</th>
                <th>Birth Year</th>
                <th>Color</th>
                <th>Passport #</th>
                <th>Embassy ID</th>
                <th>Rider</th>
                <th>Club</th>
                <th>User Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHorses.map((horse) => (
                <tr key={horse.id}>
                  <td className="font-medium">{horse.name}</td>
                  <td>{horse.gender}</td>
                  <td>{horse.yearOfBirth || '-'}</td>
                  <td>{horse.color}</td>
                  <td className="text-xs font-mono">{horse.passportNumber || '-'}</td>
                  <td className="text-xs font-mono">{horse.embassyId || '-'}</td>
                  <td>{horse.riderName || '-'}</td>
                  <td>{horse.clubName || '-'}</td>
                  <td>{horse.userType || '-'}</td>
                  <td>
                    <span className={`badge ${horse.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {horse.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <Link href={`/horses/${horse.id}/edit`} className="text-green-600">
                        <FiEdit className="w-4 h-4" />
                      </Link>
                      <button className="text-red-600">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

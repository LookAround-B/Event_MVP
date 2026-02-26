import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';

interface Horse {
  id: string;
  name: string;
  color: string;
  gender: string;
  passportNumber?: string;
  isActive: boolean;
}

export default function Horses() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setHorses([
      {
        id: '1',
        name: 'Thunder',
        color: 'Bay',
        gender: 'Stallion',
        passportNumber: 'IND-123456',
        isActive: true,
      },
      {
        id: '2',
        name: 'Lady',
        color: 'Chestnut',
        gender: 'Mare',
        passportNumber: 'IND-123457',
        isActive: true,
      },
    ]);
    setLoading(false);
  }, []);

  const filteredHorses = horses.filter(h =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Horses</h2>
        <Link href="/horses/create" className="btn-primary">
          <FiPlus className="inline mr-2" /> Add Horse
        </Link>
      </div>

      <div className="mb-6 card">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search horses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
      </div>

      <div className="card table-container">
        {filteredHorses.length === 0 ? (
          <div className="text-center py-8">No horses found</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Color</th>
                <th>Gender</th>
                <th>Passport #</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHorses.map((horse) => (
                <tr key={horse.id}>
                  <td className="font-medium">{horse.name}</td>
                  <td>{horse.color}</td>
                  <td>{horse.gender}</td>
                  <td>{horse.passportNumber}</td>
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

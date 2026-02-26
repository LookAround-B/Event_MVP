import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';

interface Rider {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  isActive: boolean;
}

export default function Riders() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock data
    setRiders([
      {
        id: '1',
        firstName: 'Arjun',
        lastName: 'Singh',
        email: 'arjun@example.com',
        mobile: '9876543210',
        isActive: true,
      },
      {
        id: '2',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya@example.com',
        mobile: '9876543211',
        isActive: true,
      },
    ]);
    setLoading(false);
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure?')) {
      setRiders(riders.filter(r => r.id !== id));
    }
  };

  const filteredRiders = riders.filter(r =>
    `${r.firstName} ${r.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Riders</h2>
        <Link href="/riders/create" className="btn-primary">
          <FiPlus className="inline mr-2" /> Add Rider
        </Link>
      </div>

      <div className="mb-6 card">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search riders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
      </div>

      <div className="card table-container">
        {filteredRiders.length === 0 ? (
          <div className="text-center py-8">No riders found</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiders.map((rider) => (
                <tr key={rider.id}>
                  <td className="font-medium">{rider.firstName} {rider.lastName}</td>
                  <td>{rider.email}</td>
                  <td>{rider.mobile}</td>
                  <td>
                    <span className={`badge ${rider.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {rider.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <Link href={`/riders/${rider.id}/edit`} className="text-green-600">
                        <FiEdit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(rider.id)} className="text-red-600">
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

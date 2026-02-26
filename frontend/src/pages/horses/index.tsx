import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiEye } from 'react-icons/fi';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';

interface Horse {
  id: string;
  name: string;
  breed: string;
  age: number;
  color: string;
  height: number;
  registrationCount: number;
}

export default function Horses() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchHorses();
  }, [page, searchTerm]);

  const fetchHorses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/horses', {
        params: {
          page,
          limit: 10,
          search: searchTerm,
        },
      });

      setHorses(response.data.data.horses);
      setTotalPages(response.data.data.pagination.pages);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch horses:', err);
      setError('Failed to load horses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this horse?')) return;

    try {
      await api.delete(`/api/horses/${id}`);
      setHorses(horses.filter(h => h.id !== id));
    } catch (err) {
      console.error('Failed to delete horse:', err);
      alert('Failed to delete horse');
    }
  };

  return (
    <ProtectedRoute>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Horses</h2>
          <Link href="/horses/create" className="btn-primary">
            <FiPlus className="inline mr-2" /> New Horse
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="mb-6 card">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search horses by name, breed, color..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="form-input pl-10"
            />
          </div>
        </div>

        <div className="card table-container">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading horses...</p>
            </div>
          ) : horses.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              {searchTerm ? 'No horses match your search' : 'No horses in inventory yet. Add one to get started!'}
            </div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Breed</th>
                    <th>Age</th>
                    <th>Color</th>
                    <th>Height</th>
                    <th>Registrations</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {horses.map((horse) => (
                    <tr key={horse.id}>
                      <td className="font-medium">{horse.name}</td>
                      <td>{horse.breed}</td>
                      <td>{horse.age} years</td>
                      <td>{horse.color || '-'}</td>
                      <td>{horse.height ? `${horse.height}h` : '-'}</td>
                      <td><span className="badge badge-info">{horse.registrationCount}</span></td>
                      <td>
                        <div className="flex space-x-2">
                          <Link href={`/horses/${horse.id}`} className="text-blue-600 hover:text-blue-900">
                            <FiEye className="w-4 h-4" title="View" />
                          </Link>
                          <Link href={`/horses/${horse.id}/edit`} className="text-green-600 hover:text-green-900">
                            <FiEdit className="w-4 h-4" title="Edit" />
                          </Link>
                          <button
                            onClick={() => handleDelete(horse.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiEye, FiDownload } from 'react-icons/fi';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';

interface Horse {
  id: string;
  name: string;
  breed: string | null;
  color: string | null;
  height: number | null;
  gender: string;
  yearOfBirth: number | null;
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

  const handleExportCSV = async () => {
    try {
      const params: any = { format: 'csv' };
      if (searchTerm) params.search = searchTerm;
      const res = await api.get('/api/horses', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'horses.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Horses exported successfully');
    } catch (err) {
      console.error('Failed to export CSV:', err);
      toast.error('Failed to export CSV');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this horse?')) return;

    try {
      await api.delete(`/api/horses/${id}`);
      setHorses(horses.filter(h => h.id !== id));
      toast.success('Horse deleted successfully');
    } catch (err) {
      console.error('Failed to delete horse:', err);
      toast.error('Failed to delete horse');
    }
  };

  return (
    <ProtectedRoute>
      <Head><title>Horses | Equestrian Events</title></Head>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">Horses</h2>
          <div className="flex gap-3">
            <button onClick={handleExportCSV} className="btn-secondary">
              <FiDownload className="inline mr-2" /> Export CSV
            </button>
            <Link href="/horses/create" className="btn-primary">
              <FiPlus className="inline mr-2" /> New Horse
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-15 border border-red-400 border-opacity-30 text-red-300 backdrop-blur-sm px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="mb-6 card">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-500" />
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
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-gray-300 mt-2">Loading horses...</p>
            </div>
          ) : horses.length === 0 ? (
            <div className="text-center py-8 text-gray-300">
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
                  {horses.map((horse) => {
                    const currentYear = new Date().getFullYear();
                    const age = horse.yearOfBirth ? currentYear - horse.yearOfBirth : 0;
                    return (
                    <tr key={horse.id}>
                      <td className="font-medium">{horse.name}</td>
                      <td>{horse.breed || '-'}</td>
                      <td>{age} years</td>
                      <td>{horse.color || '-'}</td>
                      <td>{horse.height ? `${horse.height}h` : '-'}</td>
                      <td><span className="badge badge-info">{horse.registrationCount}</span></td>
                      <td>
                        <div className="flex space-x-2">
                          <Link href={`/horses/${horse.id}`} className="text-blue-400 hover:text-blue-300">
                            <FiEye className="w-4 h-4" title="View" />
                          </Link>
                          <Link href={`/horses/create?id=${horse.id}`} className="text-green-400 hover:text-green-300">
                            <FiEdit className="w-4 h-4" title="Edit" />
                          </Link>
                          <button
                            onClick={() => handleDelete(horse.id)}
                            className="text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
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

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

interface Club {
  id: string;
  eId: string;
  name: string;
  shortCode: string;
  email: string;
  contactNumber: string;
  address: string;
  city: string;
  primaryContact: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  isActive: boolean;
}

export default function ClubsList() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchClubs();
  }, [page, search]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/clubs', {
        params: { page, limit, search },
      });
      setClubs(response.data.clubs || []);
      setTotal(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteClub = async (id: string) => {
    if (confirm('Are you sure you want to delete this club?')) {
      try {
        await api.delete(`/api/clubs/${id}`);
        setClubs(clubs.filter(c => c.id !== id));
      } catch (error) {
        console.error('Failed to delete club:', error);
      }
    }
  };

  const pages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">Clubs</h2>
        <Link href="/clubs/create" className="btn-primary">
          <FiPlus className="inline mr-2" /> Add Club
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6 card">
        <input
          type="text"
          placeholder="Search clubs by name, email, or code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="form-input w-full"
        />
      </div>

      {/* Table */}
      <div className="card table-container">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-gray-300 mt-2">Loading clubs...</p>
          </div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-8 text-gray-300">No clubs found</div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Club Name</th>
                  <th>Code</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>City</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clubs.map(club => (
                  <tr key={club.id}>
                    <td className="font-medium">{club.name}</td>
                    <td>{club.shortCode}</td>
                    <td>
                      {club.primaryContact.firstName} {club.primaryContact.lastName}
                    </td>
                    <td>{club.email || club.primaryContact.email}</td>
                    <td>{club.city}</td>
                    <td>
                      <div className="flex space-x-2">
                        <Link href={`/clubs/${club.id}`} className="text-blue-400 hover:text-blue-300">
                          <FiEdit2 size={18} title="Edit" />
                        </Link>
                        <button
                          onClick={() => deleteClub(club.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {page} of {pages}
                </span>
                <button
                  onClick={() => setPage(Math.min(pages, page + 1))}
                  disabled={page === pages}
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
  );
}

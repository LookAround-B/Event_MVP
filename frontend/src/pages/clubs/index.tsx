import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
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
      const response = await axios.get('/api/clubs', {
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
        await axios.delete(`/api/clubs/${id}`);
        setClubs(clubs.filter(c => c.id !== id));
      } catch (error) {
        console.error('Failed to delete club:', error);
      }
    }
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clubs</h1>
        <Link
          href="/clubs/create"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <FiPlus /> Add Club
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search clubs by name, email, or code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : clubs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No clubs found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Club Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Code</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Contact Person</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">City</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clubs.map(club => (
                <tr key={club.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 font-semibold">{club.name}</td>
                  <td className="px-6 py-3 text-sm">{club.shortCode}</td>
                  <td className="px-6 py-3 text-sm">
                    {club.primaryContact.firstName} {club.primaryContact.lastName}
                  </td>
                  <td className="px-6 py-3 text-sm">{club.email || club.primaryContact.email}</td>
                  <td className="px-6 py-3 text-sm">{club.city}</td>
                  <td className="px-6 py-3 text-sm">
                    <div className="flex gap-2">
                      <Link href={`/clubs/${club.id}`} className="text-blue-600 hover:text-blue-800">
                        <FiEdit2 size={18} />
                      </Link>
                      <button
                        onClick={() => deleteClub(club.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 border rounded ${
                page === p ? 'bg-blue-600 text-white' : 'border-gray-300'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(pages, page + 1))}
            disabled={page === pages}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

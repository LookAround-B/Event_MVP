import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { FiArrowLeft, FiEdit, FiTrash2 } from 'react-icons/fi';

interface Horse {
  id: string;
  name: string;
  breed?: string;
  color?: string;
  height?: number;
  gender: string;
  yearOfBirth?: number;
  passportNumber?: string;
  horseCode?: string;
  embassyId?: string;
  createdAt: string;
}

export default function HorseDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [horse, setHorse] = useState<Horse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchHorse(id as string);
    }
  }, [id]);

  const fetchHorse = async (horseId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/horses/${horseId}`);
      setHorse(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch horse:', err);
      setError('Failed to load horse details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this horse?')) return;

    try {
      await api.delete(`/api/horses/${id}`);
      alert('Horse deleted successfully');
      router.push('/horses');
    } catch (err) {
      console.error('Failed to delete horse:', err);
      alert('Failed to delete horse');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: 48, borderRadius: 8, background: 'rgba(255,255,255,0.08)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !horse) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <Link href="/horses" className="text-purple-400 hover:text-purple-300 flex items-center gap-2 mb-8">
              <FiArrowLeft /> Back to Horses
            </Link>
            <div className="bg-red-900 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg p-6">
              <p className="text-red-300">{error || 'Horse not found'}</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const currentYear = new Date().getFullYear();
  const age = horse.yearOfBirth ? currentYear - horse.yearOfBirth : 'Unknown';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Link href="/horses" className="text-purple-400 hover:text-purple-300 flex items-center gap-2">
              <FiArrowLeft /> Back to Horses
            </Link>
            <div className="flex gap-2">
              <Link 
                href={`/horses/create?id=${horse.id}`}
                className="text-green-400 hover:text-green-300 flex items-center gap-2 px-4 py-2 bg-green-900 bg-opacity-20 rounded border border-green-400 border-opacity-30"
              >
                <FiEdit className="w-4 h-4" /> Edit
              </Link>
              <button
                onClick={handleDelete}
                className="text-red-400 hover:text-red-300 flex items-center gap-2 px-4 py-2 bg-red-900 bg-opacity-20 rounded border border-red-400 border-opacity-30"
              >
                <FiTrash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-white border-opacity-10 bg-gradient-to-r from-purple-900 to-slate-900">
              <h1 className="text-3xl font-bold text-white">{horse.name}</h1>
              <p className="text-gray-300 mt-2">Horse Profile</p>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-400">Gender</label>
                    <p className="text-lg text-white mt-1">{horse.gender}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-400">Year of Birth</label>
                    <p className="text-lg text-white mt-1">{horse.yearOfBirth || 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-400">Age</label>
                    <p className="text-lg text-white mt-1">{age} years</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-400">Color</label>
                    <p className="text-lg text-white mt-1">{horse.color || 'Not specified'}</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-400">Breed</label>
                    <p className="text-lg text-white mt-1">{horse.breed || 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-400">Height (hands)</label>
                    <p className="text-lg text-white mt-1">{horse.height ? `${horse.height}h` : 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-400">Passport Number</label>
                    <p className="text-lg text-white mt-1 font-mono">{horse.passportNumber || '-'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-400">Horse Code</label>
                    <p className="text-lg text-white mt-1 font-mono">{horse.horseCode || '-'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-400">Embassy ID</label>
                    <p className="text-lg text-white mt-1 font-mono">{horse.embassyId || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-8 pt-8 border-t border-white border-opacity-10">
                <p className="text-sm text-gray-400">
                  Created on {new Date(horse.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

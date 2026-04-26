import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { PageSkeleton } from '@/components/PageSkeleton';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';

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
        <PageSkeleton variant="detail" />
      </ProtectedRoute>
    );
  }

  if (error || !horse) {
    return (
      <ProtectedRoute>
        <div className="space-y-6 max-w-4xl mx-auto py-8">
          <Link href="/horses" className="transition-colors flex items-center gap-2 mb-8">
            <ArrowLeft /> Back to Horses
          </Link>
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6">
            <p className="font-semibold">{error || 'Horse not found'}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const currentYear = new Date().getFullYear();
  const age = horse.yearOfBirth ? currentYear - horse.yearOfBirth : 'Unknown';

  return (
    <BoneyardSkeleton name="horse-detail-page" loading={false}>
    <ProtectedRoute>
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/horses" className="transition-colors flex items-center gap-2">
            <ArrowLeft /> Back to Horses
          </Link>
          <div className="flex gap-3">
            <Link 
              href={`/horses/create?id=${horse.id}`}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-2 px-4 py-2 bg-emerald-400/10 rounded-xl border border-emerald-400/20 transition-colors"
            >
              <Edit className="w-4 h-4" /> Edit
            </Link>
            <button
              onClick={handleDelete}
              className="text-destructive hover:text-red-400 flex items-center gap-2 px-4 py-2 bg-destructive/10 rounded-xl border border-destructive/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>

        <div className="bento-card overflow-hidden p-0">
          {/* Header */}
          <div className="px-8 py-6 border-b border-white/[0.08] bg-surface-low rounded-t-2xl">
            <h1 className="text-2xl font-bold text-on-surface">{horse.name}</h1>
            <p className="text-muted-foreground mt-2">Horse Profile</p>
          </div>

            {/* Content */}
            <div className="p-8">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Gender</label>
                    <p className="text-lg text-on-surface mt-1">{horse.gender}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Year of Birth</label>
                    <p className="text-lg text-on-surface mt-1">{horse.yearOfBirth || 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Age</label>
                    <p className="text-lg text-on-surface mt-1">{age} years</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Color</label>
                    <p className="text-lg text-on-surface mt-1">{horse.color || 'Not specified'}</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Breed</label>
                    <p className="text-lg text-on-surface mt-1">{horse.breed || 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Height (hands)</label>
                    <p className="text-lg text-on-surface mt-1">{horse.height ? `${horse.height}h` : 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Passport Number</label>
                    <p className="text-lg text-on-surface mt-1 font-mono">{horse.passportNumber || '-'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Horse Code</label>
                    <p className="text-lg text-on-surface mt-1 font-mono">{horse.horseCode || '-'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Embassy ID</label>
                    <p className="text-lg text-on-surface mt-1 font-mono">{horse.embassyId || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-8 pt-8 border-t border-white/[0.08]">
                <p className="text-sm text-muted-foreground">
                  Created on {new Date(horse.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
    </ProtectedRoute>
    </BoneyardSkeleton>
  );
}

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

interface Stable {
  id: string;
  eId: string;
  number: string;
  capacity: number;
  pricePerStable: number;
  isAvailable: boolean;
  bookingCount: number;
  createdAt: string;
}

interface EventInfo {
  id: string;
  name: string;
}

export default function EventStables() {
  const router = useRouter();
  const { id: eventId } = router.query;
  const [stables, setStables] = useState<Stable[]>([]);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ number: '', capacity: '1', pricePerStable: '0', isAvailable: true });
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    if (eventId) fetchStables();
  }, [eventId]);

  const fetchStables = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/events/${eventId}/stables`);
      setStables(response.data.data.stables);
      setEventInfo(response.data.data.event);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch stables:', err);
      setError('Failed to load stables');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ number: '', capacity: '1', pricePerStable: '0', isAvailable: true });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        number: form.number,
        capacity: parseInt(form.capacity) || 1,
        pricePerStable: parseFloat(form.pricePerStable) || 0,
        isAvailable: form.isAvailable,
      };

      if (editingId) {
        await api.put(`/api/stables/${editingId}`, payload);
      } else {
        await api.post(`/api/events/${eventId}/stables`, payload);
      }
      resetForm();
      fetchStables();
    } catch (err) {
      console.error('Failed to save stable:', err);
      alert('Failed to save stable');
    }
  };

  const handleEdit = (stable: Stable) => {
    setForm({
      number: stable.number,
      capacity: String(stable.capacity),
      pricePerStable: String(stable.pricePerStable),
      isAvailable: stable.isAvailable,
    });
    setEditingId(stable.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stable?')) return;
    try {
      await api.delete(`/api/stables/${id}`);
      setStables(stables.filter(s => s.id !== id));
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to delete stable';
      alert(msg);
    }
  };

  const handleToggleAvailability = async (stable: Stable) => {
    try {
      await api.put(`/api/stables/${stable.id}`, { isAvailable: !stable.isAvailable });
      setStables(stables.map(s => s.id === stable.id ? { ...s, isAvailable: !s.isAvailable } : s));
    } catch (err) {
      console.error('Failed to update availability:', err);
    }
  };

  return (
    <ProtectedRoute>
      <div>
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/events/${eventId}`} className="text-muted-foreground hover:text-on-surface">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold">Stable Management</h2>
            {eventInfo && <p className="text-muted-foreground mt-1">{eventInfo.name}</p>}
          </div>
          <div className="ml-auto">
            <button
              onClick={() => { resetForm(); setShowForm(!showForm); }}
              className="btn-primary"
            >
              <Plus className="inline mr-2" /> Add Stable
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bento-card mb-6">
            <h3 className="text-lg font-semibold text-on-surface mb-4">
              {editingId ? 'Edit Stable' : 'Add New Stable'}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Stable Name/Number</label>
                <input
                  type="text"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  className="input"
                  placeholder="e.g. Stable A"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Capacity</label>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="input"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Price per Stable (₹)</label>
                <input
                  type="number"
                  value={form.pricePerStable}
                  onChange={(e) => setForm({ ...form, pricePerStable: e.target.value })}
                  className="input"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                    className="rounded border-border bg-gray-700 text-primary-500"
                  />
                  Available
                </label>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stables Table */}
        <div className="bento-card table-container">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading stables...</p>
            </div>
          ) : stables.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No stables configured for this event. Click &quot;Add Stable&quot; to get started.
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name/Number</th>
                  <th>Capacity</th>
                  <th>Price (₹)</th>
                  <th>Available</th>
                  <th>Bookings</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stables.slice((page - 1) * perPage, page * perPage).map((stable) => (
                  <tr key={stable.id}>
                    <td className="font-medium text-on-surface">{stable.number}</td>
                    <td>{stable.capacity}</td>
                    <td>₹{stable.pricePerStable.toLocaleString('en-IN')}</td>
                    <td>
                      <button
                        onClick={() => handleToggleAvailability(stable)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium cursor-pointer ${
                          stable.isAvailable
                            ? 'badge-emerald'
                            : 'bg-red-500 bg-opacity-20 text-destructive'
                        }`}
                      >
                        {stable.isAvailable ? <><Check size={12} /> Yes</> : <><X size={12} /> No</>}
                      </button>
                    </td>
                    <td>{stable.bookingCount}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(stable)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        {stable.bookingCount === 0 && (
                          <button
                            onClick={() => handleDelete(stable.id)}
                            className="text-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {(() => { const totalPages = Math.ceil(stables.length / perPage); return totalPages > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/10">
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages} ({stables.length} total)</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-sm rounded-lg border border-border/20 hover:bg-muted/50 disabled:opacity-40 transition-all">Previous</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 text-sm rounded-lg border border-border/20 hover:bg-muted/50 disabled:opacity-40 transition-all">Next</button>
              </div>
            </div>
          ); })()}
        </div>

        {/* Summary */}
        {stables.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bento-card text-center">
              <p className="text-muted-foreground text-sm">Total Stables</p>
              <p className="text-2xl font-bold text-on-surface">{stables.length}</p>
            </div>
            <div className="bento-card text-center">
              <p className="text-muted-foreground text-sm">Available</p>
              <p className="text-2xl font-bold text-emerald-400">{stables.filter(s => s.isAvailable).length}</p>
            </div>
            <div className="bento-card text-center">
              <p className="text-muted-foreground text-sm">Total Bookings</p>
              <p className="text-2xl font-bold text-blue-400">{stables.reduce((sum, s) => sum + s.bookingCount, 0)}</p>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

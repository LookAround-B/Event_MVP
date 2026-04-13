import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, Save, X, MapPin } from 'lucide-react';
import AddressMapPicker from '@/components/AddressMapPicker';
import dynamic from 'next/dynamic';
import { PageSkeleton } from '@/components/PageSkeleton';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/lib/protected-route';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

interface EventType {
  id: string;
  name: string;
  shortCode: string;
}

interface EventCategory {
  id: string;
  name: string;
  price: number;
  cgst: number;
  sgst: number;
  igst: number;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface Venue {
  id?: string;
  name: string;
  address: string;
}

type TabKey = 'venue' | 'stables' | 'timings' | 'eventTypes' | 'roles' | 'eventCategories' | 'termsConditions';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabKey>('venue');
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [eventCategories, setEventCategories] = useState<EventCategory[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Venue
  const [venue, setVenue] = useState<Venue>({ name: '', address: '' });

  // Stables
  const [stablesSettings, setStablesSettings] = useState({
    stable_count: '0',
    stable_price: '0',
  });

  // Timings
  const [timingsSettings, setTimingsSettings] = useState({
    event_start_time: '06:00',
    event_end_time: '18:00',
    cutoff_time_hours: '24',
    registration_close_hours: '48',
  });

  // Terms
  const [termsConditions, setTermsConditions] = useState('');

  // Inline forms
  const [newEventType, setNewEventType] = useState({ name: '', shortCode: '' });
  const [newCategory, setNewCategory] = useState({ name: '', price: '', cgst: '', sgst: '', igst: '' });
  const [newRole, setNewRole] = useState({ name: '', description: '' });

  // Edit states
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryData, setEditCategoryData] = useState({ name: '', price: '', cgst: '', sgst: '', igst: '' });

  // Pagination
  const [etPage, setEtPage] = useState(1);
  const [rolePage, setRolePage] = useState(1);
  const [catPage, setCatPage] = useState(1);
  const settingsPerPage = 10;

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [types, categories, rolesRes, settingsRes, venueRes] = await Promise.all([
        api.get('/api/settings/event-types'),
        api.get('/api/settings/event-categories'),
        api.get('/api/settings/roles'),
        api.get('/api/settings'),
        api.get('/api/settings/venue'),
      ]);
      setEventTypes(types.data.data || []);
      setEventCategories(categories.data.data || []);
      setRoles(rolesRes.data.data || []);

      if (venueRes.data.data) {
        setVenue({
          name: venueRes.data.data.name || '',
          address: venueRes.data.data.address || '',
        });
      }

      const s = settingsRes.data.data || {};
      setStablesSettings({
        stable_count: String(s.stable_count || '0'),
        stable_price: String(s.stable_price || '0'),
      });
      setTimingsSettings({
        event_start_time: s.event_start_time || '06:00',
        event_end_time: s.event_end_time || '18:00',
        cutoff_time_hours: String(s.cutoff_time_hours || '24'),
        registration_close_hours: String(s.registration_close_hours || '48'),
      });
      setTermsConditions(s.terms_and_conditions || '');
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveVenue = async () => {
    if (!venue.name.trim()) {
      toast.error('Venue name is required');
      return;
    }
    try {
      setSaving(true);
      await api.put('/api/settings/venue', venue);
      toast.success('Venue saved successfully');
    } catch (error) {
      console.error('Failed to save venue:', error);
      toast.error('Failed to save venue');
    } finally {
      setSaving(false);
    }
  };

  const saveStablesSettings = async () => {
    try {
      setSaving(true);
      await api.put('/api/settings', stablesSettings);
      toast.success('Stable settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const saveTimingsSettings = async () => {
    try {
      setSaving(true);
      await api.put('/api/settings', timingsSettings);
      toast.success('Timing settings saved successfully');
    } catch (error) {
      console.error('Failed to save timings:', error);
      toast.error('Failed to save timings');
    } finally {
      setSaving(false);
    }
  };

  const saveTermsConditions = async () => {
    await toast.promise(
      api.put('/api/settings', { terms_and_conditions: termsConditions }),
      {
        loading: 'Saving Terms & Conditions...',
        success: 'Terms & Conditions saved!',
        error: 'Failed to save Terms & Conditions',
      }
    );
  };

  // Event Types CRUD
  const addEventType = async () => {
    if (!newEventType.name.trim() || !newEventType.shortCode.trim()) {
      toast.error('Name and short code are required');
      return;
    }
    try {
      await api.post('/api/settings/event-types', newEventType);
      setNewEventType({ name: '', shortCode: '' });
      fetchSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add event type');
    }
  };

  const deleteEventType = async (id: string) => {
    if (!confirm('Delete this event type?')) return;
    try {
      await api.delete('/api/settings/event-types', { data: { id } });
      fetchSettings();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete event type');
    }
  };

  // Event Categories CRUD
  const addEventCategory = async () => {
    if (!newCategory.name.trim() || !newCategory.price) {
      toast.error('Name and price are required');
      return;
    }
    try {
      await api.post('/api/settings/event-categories', {
        name: newCategory.name.trim(),
        price: parseFloat(newCategory.price),
        cgst: parseFloat(newCategory.cgst) || 0,
        sgst: parseFloat(newCategory.sgst) || 0,
        igst: parseFloat(newCategory.igst) || 0,
      });
      setNewCategory({ name: '', price: '', cgst: '', sgst: '', igst: '' });
      fetchSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add category');
    }
  };

  const startEditCategory = (cat: EventCategory) => {
    setEditingCategory(cat.id);
    setEditCategoryData({
      name: cat.name,
      price: String(cat.price),
      cgst: String(cat.cgst),
      sgst: String(cat.sgst),
      igst: String(cat.igst),
    });
  };

  const saveEditCategory = async () => {
    if (!editingCategory) return;
    try {
      await api.put('/api/settings/event-categories', {
        id: editingCategory,
        name: editCategoryData.name.trim(),
        price: parseFloat(editCategoryData.price),
        cgst: parseFloat(editCategoryData.cgst) || 0,
        sgst: parseFloat(editCategoryData.sgst) || 0,
        igst: parseFloat(editCategoryData.igst) || 0,
      });
      setEditingCategory(null);
      fetchSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update category');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete('/api/settings/event-categories', { data: { id } });
      fetchSettings();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete category');
    }
  };

  // Roles CRUD
  const addRole = async () => {
    if (!newRole.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    try {
      await api.post('/api/settings/roles', { name: newRole.name.trim(), description: newRole.description.trim() || null });
      setNewRole({ name: '', description: '' });
      fetchSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add role');
    }
  };

  const deleteRole = async (id: string) => {
    if (!confirm('Delete this role?')) return;
    try {
      await api.delete('/api/settings/roles', { data: { id } });
      fetchSettings();
    } catch (error) {
      console.error('Failed to delete role:', error);
      toast.error('Failed to delete role');
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'venue', label: 'Venue' },
    { key: 'stables', label: 'Stables' },
    { key: 'timings', label: 'Timings' },
    { key: 'eventTypes', label: 'Event Types' },
    { key: 'roles', label: 'User Roles' },
    { key: 'eventCategories', label: 'Event Categories' },
    { key: 'termsConditions', label: 'T&C' },
  ];

  const settingsActionButtonClass = "btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg shadow-primary/20 disabled:opacity-50";

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="p-4 sm:p-6">
        <Head><title>Settings | Equestrian Events</title></Head>
        <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl mb-6">System <span className="gradient-text">Settings</span></h1>

      {/* Tabs */}
      <div className="bento-card">
        <div className="flex overflow-x-auto border-b border-border/30">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 sm:px-6 py-3 font-semibold whitespace-nowrap text-sm sm:text-base transition-colors"
              style={
                activeTab === tab.key
                  ? { borderBottom: '2px solid hsl(var(--primary))', color: 'hsl(var(--primary))' }
                  : { color: 'hsl(var(--muted-foreground))' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <PageSkeleton variant="form" />
          ) : activeTab === 'venue' ? (
            /* ───── VENUE TAB ───── */
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin /> Venue
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="form-label">Venue Name</label>
                  <input
                    type="text"
                    value={venue.name}
                    onChange={e => setVenue({ ...venue, name: e.target.value })}
                    className="input"
                    placeholder="Enter venue name"
                  />
                </div>
                <div>
                  <label className="form-label">Venue Address</label>
                  <input
                    type="text"
                    value={venue.address}
                    onChange={e => setVenue({ ...venue, address: e.target.value })}
                    className="input"
                    placeholder="Enter venue address"
                  />
                </div>
              </div>
              <div className="mb-6">
                <AddressMapPicker
                  address={venue.address}
                  onAddressChange={(components) => {
                    const parts = [components.address, components.city, components.state, components.country, components.pincode].filter(Boolean);
                    setVenue(prev => ({ ...prev, address: parts.join(', ') }));
                  }}
                />
              </div>
              <button
                onClick={saveVenue}
                disabled={saving}
                className={settingsActionButtonClass}
              >
                <Save /> {saving ? 'Saving...' : 'Save Venue'}
              </button>
            </div>

          ) : activeTab === 'stables' ? (
            /* ───── STABLES TAB ───── */
            <div>
              <h2 className="text-xl font-bold mb-4">Stable Settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="form-label">Number of Stables</label>
                  <input
                    type="number"
                    min="0"
                    value={stablesSettings.stable_count}
                    onChange={e => setStablesSettings({ ...stablesSettings, stable_count: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="form-label">Stable Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={stablesSettings.stable_price}
                    onChange={e => setStablesSettings({ ...stablesSettings, stable_price: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <button
                onClick={saveStablesSettings}
                disabled={saving}
                className={settingsActionButtonClass}
              >
                <Save /> {saving ? 'Saving...' : 'Save Stable Settings'}
              </button>
            </div>

          ) : activeTab === 'timings' ? (
            /* ───── TIMINGS TAB ───── */
            <div>
              <h2 className="text-xl font-bold mb-4 text-on-surface">Timing Settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="form-label">Event Start Time</label>
                  <input
                    type="time"
                    value={timingsSettings.event_start_time}
                    onChange={e => setTimingsSettings({ ...timingsSettings, event_start_time: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="form-label">Event End Time</label>
                  <input
                    type="time"
                    value={timingsSettings.event_end_time}
                    onChange={e => setTimingsSettings({ ...timingsSettings, event_end_time: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="form-label">Cutoff Time (hours before event)</label>
                  <input
                    type="number"
                    min="0"
                    value={timingsSettings.cutoff_time_hours}
                    onChange={e => setTimingsSettings({ ...timingsSettings, cutoff_time_hours: e.target.value })}
                    className="input"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Hours before event when changes are locked</p>
                </div>
                <div>
                  <label className="form-label">Registration Close (hours before event)</label>
                  <input
                    type="number"
                    min="0"
                    value={timingsSettings.registration_close_hours}
                    onChange={e => setTimingsSettings({ ...timingsSettings, registration_close_hours: e.target.value })}
                    className="input"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Hours before event when registration closes</p>
                </div>
              </div>
              <button
                onClick={saveTimingsSettings}
                disabled={saving}
                className={settingsActionButtonClass}
              >
                <Save /> {saving ? 'Saving...' : 'Save Timings'}
              </button>
            </div>

          ) : activeTab === 'eventTypes' ? (
            /* ───── EVENT TYPES TAB ───── */
            <div>
              <h2 className="text-xl font-bold mb-4 text-on-surface">Event Types</h2>
              <div className="bento-card mb-4 p-4">
                <h3 className="text-sm font-bold text-muted-foreground mb-3">Add Event Type</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Event Type Name"
                    value={newEventType.name}
                    onChange={e => setNewEventType({ ...newEventType, name: e.target.value })}
                    className="input"
                    maxLength={100}
                  />
                  <input
                    type="text"
                    placeholder="Short Code (e.g. KSEC)"
                    value={newEventType.shortCode}
                    onChange={e => setNewEventType({ ...newEventType, shortCode: e.target.value.toUpperCase() })}
                    className="input"
                    maxLength={20}
                  />
                </div>
                <button onClick={addEventType} className={settingsActionButtonClass}>
                  <Plus /> Add Event Type
                </button>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Event Type</th>
                      <th>Short Code</th>
                      <th className="w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventTypes.length === 0 ? (
                      <tr><td colSpan={3} className="text-center text-muted-foreground py-8">No event types yet</td></tr>
                    ) : eventTypes.slice((etPage - 1) * settingsPerPage, etPage * settingsPerPage).map(et => (
                      <tr key={et.id}>
                        <td className="text-sm text-muted-foreground">{et.name}</td>
                        <td><span className="badge badge-info">{et.shortCode}</span></td>
                        <td>
                          <button
                            onClick={() => deleteEventType(et.id)}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {eventTypes.length > 0 && (
                <div className="flex justify-center items-center gap-2 py-3 border-t border-border/30">
                  <button onClick={() => setEtPage(Math.max(1, etPage - 1))} disabled={etPage === 1} className="btn-secondary disabled:opacity-50 text-sm px-3 py-1.5">Previous</button>
                  <span className="px-4 py-2 text-muted-foreground text-sm">Page {etPage} of {Math.ceil(eventTypes.length / settingsPerPage) || 1} ({eventTypes.length} total)</span>
                  <button onClick={() => setEtPage(Math.min(Math.ceil(eventTypes.length / settingsPerPage), etPage + 1))} disabled={etPage >= Math.ceil(eventTypes.length / settingsPerPage)} className="btn-secondary disabled:opacity-50 text-sm px-3 py-1.5">Next</button>
                </div>
              )}
            </div>

          ) : activeTab === 'roles' ? (
            /* ───── USER ROLES TAB ───── */
            <div>
              <h2 className="text-xl font-bold mb-4 text-on-surface">User Roles</h2>
              <div className="bento-card mb-4 p-4">
                <h3 className="text-sm font-bold text-muted-foreground mb-3">Add User Role</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Role Name"
                    value={newRole.name}
                    onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                    className="input"
                    maxLength={50}
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newRole.description}
                    onChange={e => setNewRole({ ...newRole, description: e.target.value })}
                    className="input"
                    maxLength={200}
                  />
                </div>
                <button onClick={addRole} className={settingsActionButtonClass}>
                  <Plus /> Add User Role
                </button>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User Role</th>
                      <th className="hidden sm:table-cell">Description</th>
                      <th className="w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.length === 0 ? (
                      <tr><td colSpan={3} className="text-center text-muted-foreground py-8">No roles yet</td></tr>
                    ) : roles.slice((rolePage - 1) * settingsPerPage, rolePage * settingsPerPage).map(role => (
                      <tr key={role.id}>
                        <td className="font-medium text-on-surface">{role.name}</td>
                        <td className="hidden sm:table-cell text-muted-foreground">{role.description || '-'}</td>
                        <td>
                          <button
                            onClick={() => deleteRole(role.id)}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {roles.length > 0 && (
                <div className="flex justify-center items-center gap-2 py-3 border-t border-border/30">
                  <button onClick={() => setRolePage(Math.max(1, rolePage - 1))} disabled={rolePage === 1} className="btn-secondary disabled:opacity-50 text-sm px-3 py-1.5">Previous</button>
                  <span className="px-4 py-2 text-muted-foreground text-sm">Page {rolePage} of {Math.ceil(roles.length / settingsPerPage) || 1} ({roles.length} total)</span>
                  <button onClick={() => setRolePage(Math.min(Math.ceil(roles.length / settingsPerPage), rolePage + 1))} disabled={rolePage >= Math.ceil(roles.length / settingsPerPage)} className="btn-secondary disabled:opacity-50 text-sm px-3 py-1.5">Next</button>
                </div>
              )}
            </div>

          ) : activeTab === 'eventCategories' ? (
            /* ───── EVENT CATEGORIES TAB ───── */
            <div>
              <h2 className="text-xl font-bold mb-4 text-on-surface">Event Categories</h2>
              <div className="bento-card mb-4 p-4">
                <h3 className="text-sm font-bold text-muted-foreground mb-3">Add Event Category</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Category Name"
                    value={newCategory.name}
                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="input col-span-2 sm:col-span-1"
                    maxLength={100}
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    min="0"
                    step="0.01"
                    value={newCategory.price}
                    onChange={e => setNewCategory({ ...newCategory, price: e.target.value })}
                    className="input"
                  />
                  <input
                    type="number"
                    placeholder="CGST %"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newCategory.cgst}
                    onChange={e => setNewCategory({ ...newCategory, cgst: e.target.value })}
                    className="input"
                  />
                  <input
                    type="number"
                    placeholder="SGST %"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newCategory.sgst}
                    onChange={e => setNewCategory({ ...newCategory, sgst: e.target.value })}
                    className="input"
                  />
                  <input
                    type="number"
                    placeholder="IGST %"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newCategory.igst}
                    onChange={e => setNewCategory({ ...newCategory, igst: e.target.value })}
                    className="input"
                  />
                </div>
                <button onClick={addEventCategory} className={settingsActionButtonClass}>
                  <Plus /> Add Event Category
                </button>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Event Category</th>
                      <th>Price</th>
                      <th className="hidden sm:table-cell">CGST%</th>
                      <th className="hidden sm:table-cell">SGST%</th>
                      <th className="hidden sm:table-cell">IGST%</th>
                      <th className="w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventCategories.length === 0 ? (
                      <tr><td colSpan={6} className="text-center text-muted-foreground py-8">No categories yet</td></tr>
                    ) : eventCategories.slice((catPage - 1) * settingsPerPage, catPage * settingsPerPage).map(cat => (
                      editingCategory === cat.id ? (
                        <tr key={cat.id}>
                          <td>
                            <input
                              type="text"
                              value={editCategoryData.name}
                              onChange={e => setEditCategoryData({ ...editCategoryData, name: e.target.value })}
                              className="input text-sm py-1"
                              maxLength={100}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={editCategoryData.price}
                              onChange={e => setEditCategoryData({ ...editCategoryData, price: e.target.value })}
                              className="input text-sm py-1 w-24"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="hidden sm:table-cell">
                            <input
                              type="number"
                              value={editCategoryData.cgst}
                              onChange={e => setEditCategoryData({ ...editCategoryData, cgst: e.target.value })}
                              className="input text-sm py-1 w-20"
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </td>
                          <td className="hidden sm:table-cell">
                            <input
                              type="number"
                              value={editCategoryData.sgst}
                              onChange={e => setEditCategoryData({ ...editCategoryData, sgst: e.target.value })}
                              className="input text-sm py-1 w-20"
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </td>
                          <td className="hidden sm:table-cell">
                            <input
                              type="number"
                              value={editCategoryData.igst}
                              onChange={e => setEditCategoryData({ ...editCategoryData, igst: e.target.value })}
                              className="input text-sm py-1 w-20"
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </td>
                          <td>
                            <div className="flex gap-1">
                              <button
                                onClick={saveEditCategory}
                                className="p-2 text-emerald-400 transition-colors rounded-lg transition-colors"
                                title="Save"
                              >
                                <Save />
                              </button>
                              <button
                                onClick={() => setEditingCategory(null)}
                                className="p-2 text-muted-foreground transition-colors rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <X />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={cat.id}>
                          <td className="font-medium text-on-surface">{cat.name}</td>
                          <td className="text-muted-foreground">₹{cat.price.toFixed(2)}</td>
                          <td className="hidden sm:table-cell text-muted-foreground">{cat.cgst}%</td>
                          <td className="hidden sm:table-cell text-muted-foreground">{cat.sgst}%</td>
                          <td className="hidden sm:table-cell text-muted-foreground">{cat.igst}%</td>
                          <td>
                            <div className="flex gap-1">
                              <button
                                onClick={() => startEditCategory(cat)}
                                className="p-2 text-muted-foreground hover:text-blue-400 transition-colors rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Pencil />
                              </button>
                              <button
                                onClick={() => deleteCategory(cat.id)}
                                className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
              {eventCategories.length > 0 && (
                <div className="flex justify-center items-center gap-2 py-3 border-t border-border/30">
                  <button onClick={() => setCatPage(Math.max(1, catPage - 1))} disabled={catPage === 1} className="btn-secondary disabled:opacity-50 text-sm px-3 py-1.5">Previous</button>
                  <span className="px-4 py-2 text-muted-foreground text-sm">Page {catPage} of {Math.ceil(eventCategories.length / settingsPerPage) || 1} ({eventCategories.length} total)</span>
                  <button onClick={() => setCatPage(Math.min(Math.ceil(eventCategories.length / settingsPerPage), catPage + 1))} disabled={catPage >= Math.ceil(eventCategories.length / settingsPerPage)} className="btn-secondary disabled:opacity-50 text-sm px-3 py-1.5">Next</button>
                </div>
              )}
            </div>

          ) : activeTab === 'termsConditions' ? (
            /* ───── TERMS & CONDITIONS TAB ───── */
            <div>
              <h2 className="text-xl font-bold mb-4 text-on-surface">Terms & Conditions</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Default terms & conditions applied to new events. Supports rich text formatting. Use Ctrl+S or the save button in the editor to save.
              </p>
              <RichTextEditor
                value={termsConditions}
                onChange={(data: string) => setTermsConditions(data)}
                onSave={saveTermsConditions}
                placeholder="Enter default terms and conditions..."
                allowFullscreen={false}
              />
            </div>
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import api from '@/lib/api';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

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

type TabKey = 'general' | 'eventTypes' | 'eventCategories' | 'roles' | 'timings' | 'termsConditions';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [eventCategories, setEventCategories] = useState<EventCategory[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  const [generalSettings, setGeneralSettings] = useState({
    venue_address: '',
    stable_count: '0',
    stable_price: '0',
    event_start_time: '06:00',
    event_end_time: '18:00',
  });

  const [timingsSettings, setTimingsSettings] = useState({
    default_event_duration_hours: '8',
    registration_close_hours_before: '24',
    check_in_start_hours_before: '2',
  });

  const [termsConditions, setTermsConditions] = useState('');

  const [newEventType, setNewEventType] = useState({ name: '', shortCode: '' });
  const [newCategory, setNewCategory] = useState({
    name: '',
    price: '',
    cgst: '',
    sgst: '',
    igst: '',
  });
  const [newRole, setNewRole] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [types, categories, rolesRes, settingsRes] = await Promise.all([
        api.get('/api/settings/event-types'),
        api.get('/api/settings/event-categories'),
        api.get('/api/settings/roles'),
        api.get('/api/settings'),
      ]);
      setEventTypes(types.data.data || []);
      setEventCategories(categories.data.data || []);
      setRoles(rolesRes.data.data || []);

      const s = settingsRes.data.data || {};
      setGeneralSettings({
        venue_address: s.venue_address || '',
        stable_count: String(s.stable_count || '0'),
        stable_price: String(s.stable_price || '0'),
        event_start_time: s.event_start_time || '06:00',
        event_end_time: s.event_end_time || '18:00',
      });
      setTimingsSettings({
        default_event_duration_hours: String(s.default_event_duration_hours || '8'),
        registration_close_hours_before: String(s.registration_close_hours_before || '24'),
        check_in_start_hours_before: String(s.check_in_start_hours_before || '2'),
      });
      setTermsConditions(s.terms_and_conditions || '');
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGeneralSettings = async () => {
    try {
      await api.put('/api/settings', generalSettings);
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const saveTimingsSettings = async () => {
    try {
      await api.put('/api/settings', timingsSettings);
      alert('Timing settings saved successfully');
    } catch (error) {
      console.error('Failed to save timings:', error);
    }
  };

  const saveTermsConditions = async () => {
    try {
      await api.put('/api/settings', { terms_and_conditions: termsConditions });
      alert('Terms & Conditions saved successfully');
    } catch (error) {
      console.error('Failed to save T&C:', error);
    }
  };

  const addEventType = async () => {
    if (!newEventType.name || !newEventType.shortCode) {
      alert('Name and short code are required');
      return;
    }
    try {
      await api.post('/api/settings/event-types', newEventType);
      setNewEventType({ name: '', shortCode: '' });
      fetchSettings();
    } catch (error) {
      console.error('Failed to add event type:', error);
    }
  };

  const deleteEventType = async (id: string) => {
    if (confirm('Delete this event type?')) {
      try {
        await api.delete('/api/settings/event-types', { data: { id } });
        fetchSettings();
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  const addEventCategory = async () => {
    if (!newCategory.name || !newCategory.price) {
      alert('Name and price are required');
      return;
    }
    try {
      await api.post('/api/settings/event-categories', newCategory);
      setNewCategory({ name: '', price: '', cgst: '', sgst: '', igst: '' });
      fetchSettings();
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  const deleteCategory = async (id: string) => {
    if (confirm('Delete this category?')) {
      try {
        await api.delete('/api/settings/event-categories', { data: { id } });
        fetchSettings();
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  const addRole = async () => {
    if (!newRole.name) {
      alert('Role name is required');
      return;
    }
    try {
      await api.post('/api/settings/roles', newRole);
      setNewRole({ name: '', description: '' });
      fetchSettings();
    } catch (error) {
      console.error('Failed to add role:', error);
    }
  };

  const deleteRole = async (id: string) => {
    if (confirm('Delete this role?')) {
      try {
        await api.delete('/api/settings/roles', { data: { id } });
        fetchSettings();
      } catch (error) {
        console.error('Failed to delete role:', error);
      }
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'eventTypes', label: 'Event Types' },
    { key: 'eventCategories', label: 'Event Categories' },
    { key: 'roles', label: 'User Roles' },
    { key: 'timings', label: 'Timings' },
    { key: 'termsConditions', label: 'T&C' },
  ];

  return (
    <div className="p-6">
      <Head><title>Settings | Equestrian Events</title></Head>
      <h1 className="text-3xl font-bold mb-6 text-white">Settings</h1>

      {/* Tabs */}
      <div className="glass">
        <div className="flex border-b overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-b-2 border-primary-500 text-primary-400'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {loading ? (
            <p>Loading...</p>
          ) : activeTab === 'general' ? (
            <div>
              <h2 className="text-xl font-bold mb-4 text-white">General Settings</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">Venue Address</label>
                  <input
                    type="text"
                    value={generalSettings.venue_address}
                    onChange={e =>
                      setGeneralSettings({ ...generalSettings, venue_address: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">Number of Stables</label>
                  <input
                    type="number"
                    value={generalSettings.stable_count}
                    onChange={e =>
                      setGeneralSettings({ ...generalSettings, stable_count: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">Price per Stable</label>
                  <input
                    type="number"
                    value={generalSettings.stable_price}
                    onChange={e =>
                      setGeneralSettings({ ...generalSettings, stable_price: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">Event Start Time</label>
                  <input
                    type="time"
                    value={generalSettings.event_start_time}
                    onChange={e =>
                      setGeneralSettings({ ...generalSettings, event_start_time: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">Event End Time</label>
                  <input
                    type="time"
                    value={generalSettings.event_end_time}
                    onChange={e =>
                      setGeneralSettings({ ...generalSettings, event_end_time: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
              </div>
              <button
                onClick={saveGeneralSettings}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Save Settings
              </button>
            </div>
          ) : activeTab === 'eventTypes' ? (
            <div>
              <h2 className="text-xl font-bold mb-4 text-white">Event Types</h2>
              <div className="card mb-4 p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Event Type Name"
                    value={newEventType.name}
                    onChange={e => setNewEventType({ ...newEventType, name: e.target.value })}
                    className="form-input"
                  />
                  <input
                    type="text"
                    placeholder="Short Code"
                    value={newEventType.shortCode}
                    onChange={e =>
                      setNewEventType({ ...newEventType, shortCode: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <button
                  onClick={addEventType}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiPlus /> Add Event Type
                </button>
              </div>

              <div className="card table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Short Code</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventTypes.map(et => (
                      <tr key={et.id}>
                        <td className="text-sm text-gray-300">{et.name}</td>
                        <td className="text-sm text-gray-300">{et.shortCode}</td>
                        <td>
                          <button
                            onClick={() => deleteEventType(et.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'eventCategories' ? (
            <div>
              <h2 className="text-xl font-bold mb-4">Event Categories</h2>
              <div className="bg-gray-100 p-4 rounded mb-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Category Name"
                    value={newCategory.name}
                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={newCategory.price}
                    onChange={e => setNewCategory({ ...newCategory, price: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    placeholder="CGST %"
                    value={newCategory.cgst}
                    onChange={e => setNewCategory({ ...newCategory, cgst: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    placeholder="SGST %"
                    value={newCategory.sgst}
                    onChange={e => setNewCategory({ ...newCategory, sgst: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    placeholder="IGST %"
                    value={newCategory.igst}
                    onChange={e => setNewCategory({ ...newCategory, igst: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <button
                  onClick={addEventCategory}
                  className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
                >
                  <FiPlus /> Add Category
                </button>
              </div>

              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Price</th>
                    <th className="px-4 py-2 text-left">CGST%</th>
                    <th className="px-4 py-2 text-left">SGST%</th>
                    <th className="px-4 py-2 text-left">IGST%</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {eventCategories.map(cat => (
                    <tr key={cat.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{cat.name}</td>
                      <td className="px-4 py-2">₹{cat.price.toFixed(2)}</td>
                      <td className="px-4 py-2">{cat.cgst}%</td>
                      <td className="px-4 py-2">{cat.sgst}%</td>
                      <td className="px-4 py-2">{cat.igst}%</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'roles' ? (
            <div>
              <h2 className="text-xl font-bold mb-4">User Roles</h2>
              <div className="bg-gray-100 p-4 rounded mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Role Name"
                    value={newRole.name}
                    onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newRole.description}
                    onChange={e => setNewRole({ ...newRole, description: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <button
                  onClick={addRole}
                  className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
                >
                  <FiPlus /> Add Role
                </button>
              </div>

              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map(role => (
                    <tr key={role.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{role.name}</td>
                      <td className="px-4 py-2 text-gray-600">{role.description || '-'}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => deleteRole(role.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'timings' ? (
            <div>
              <h2 className="text-xl font-bold mb-4 text-white">Timing Defaults</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">Default Event Duration (hours)</label>
                  <input
                    type="number"
                    value={timingsSettings.default_event_duration_hours}
                    onChange={e =>
                      setTimingsSettings({ ...timingsSettings, default_event_duration_hours: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">Registration Closes (hours before event)</label>
                  <input
                    type="number"
                    value={timingsSettings.registration_close_hours_before}
                    onChange={e =>
                      setTimingsSettings({ ...timingsSettings, registration_close_hours_before: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">Check-in Starts (hours before event)</label>
                  <input
                    type="number"
                    value={timingsSettings.check_in_start_hours_before}
                    onChange={e =>
                      setTimingsSettings({ ...timingsSettings, check_in_start_hours_before: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
              </div>
              <button
                onClick={saveTimingsSettings}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Save Timings
              </button>
            </div>
          ) : activeTab === 'termsConditions' ? (
            <div>
              <h2 className="text-xl font-bold mb-4 text-white">Terms & Conditions</h2>
              <p className="text-gray-400 text-sm mb-4">
                Default terms & conditions applied to new events. Supports plain text.
              </p>
              <textarea
                value={termsConditions}
                onChange={e => setTermsConditions(e.target.value)}
                rows={12}
                className="form-input w-full mb-4"
                placeholder="Enter default terms and conditions..."
              />
              <button
                onClick={saveTermsConditions}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Save Terms & Conditions
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

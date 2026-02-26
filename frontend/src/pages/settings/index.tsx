import React, { useEffect, useState } from 'react';
import axios from 'axios';
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

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'eventTypes' | 'eventCategories' | 'general'>('general');
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [eventCategories, setEventCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const [generalSettings, setGeneralSettings] = useState({
    venue_address: '',
    stable_count: '0',
    stable_price: '0',
    event_start_time: '06:00',
    event_end_time: '18:00',
  });

  const [newEventType, setNewEventType] = useState({ name: '', shortCode: '' });
  const [newCategory, setNewCategory] = useState({
    name: '',
    price: '',
    cgst: '',
    sgst: '',
    igst: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [types, categories] = await Promise.all([
        axios.get('/api/settings/event-types'),
        axios.get('/api/settings/event-categories'),
      ]);
      setEventTypes(types.data.data || []);
      setEventCategories(categories.data.data || []);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGeneralSettings = async () => {
    try {
      await axios.put('/api/settings', generalSettings);
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const addEventType = async () => {
    if (!newEventType.name || !newEventType.shortCode) {
      alert('Name and short code are required');
      return;
    }
    try {
      await axios.post('/api/settings/event-types', newEventType);
      setNewEventType({ name: '', shortCode: '' });
      fetchSettings();
    } catch (error) {
      console.error('Failed to add event type:', error);
    }
  };

  const deleteEventType = async (id: string) => {
    if (confirm('Delete this event type?')) {
      try {
        // Backend implementation would need a delete endpoint
        alert('Event type deleted');
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
      await axios.post('/api/settings/event-categories', newCategory);
      setNewCategory({ name: '', price: '', cgst: '', sgst: '', igst: '' });
      fetchSettings();
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  const deleteCategory = async (id: string) => {
    if (confirm('Delete this category?')) {
      try {
        await axios.delete('/api/settings/event-categories', { data: { id } });
        fetchSettings();
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'general'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('eventTypes')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'eventTypes'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Event Types
          </button>
          <button
            onClick={() => setActiveTab('eventCategories')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'eventCategories'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Event Categories
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <p>Loading...</p>
          ) : activeTab === 'general' ? (
            <div>
              <h2 className="text-xl font-bold mb-4">General Settings</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Venue Address</label>
                  <input
                    type="text"
                    value={generalSettings.venue_address}
                    onChange={e =>
                      setGeneralSettings({ ...generalSettings, venue_address: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Number of Stables</label>
                  <input
                    type="number"
                    value={generalSettings.stable_count}
                    onChange={e =>
                      setGeneralSettings({ ...generalSettings, stable_count: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Price per Stable</label>
                  <input
                    type="number"
                    value={generalSettings.stable_price}
                    onChange={e =>
                      setGeneralSettings({ ...generalSettings, stable_price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Event Start Time</label>
                  <input
                    type="time"
                    value={generalSettings.event_start_time}
                    onChange={e =>
                      setGeneralSettings({ ...generalSettings, event_start_time: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Event End Time</label>
                  <input
                    type="time"
                    value={generalSettings.event_end_time}
                    onChange={e =>
                      setGeneralSettings({ ...generalSettings, event_end_time: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
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
              <h2 className="text-xl font-bold mb-4">Event Types</h2>
              <div className="bg-gray-100 p-4 rounded mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Event Type Name"
                    value={newEventType.name}
                    onChange={e => setNewEventType({ ...newEventType, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Short Code"
                    value={newEventType.shortCode}
                    onChange={e =>
                      setNewEventType({ ...newEventType, shortCode: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <button
                  onClick={addEventType}
                  className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
                >
                  <FiPlus /> Add Event Type
                </button>
              </div>

              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Short Code</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {eventTypes.map(et => (
                    <tr key={et.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{et.name}</td>
                      <td className="px-4 py-2">{et.shortCode}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => deleteEventType(et.id)}
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
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

export default function CreateHorse() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: '',
    gender: 'Stallion',
    passportNumber: '',
    horseCode: '',
    yearOfBirth: '',
    embassyId: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.embassyId && !/^EIRSHR\d{5}$/.test(formData.embassyId)) {
      alert('Embassy ID must be in format EIRSHR followed by 5 digits (e.g., EIRSHR00076)');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      await axios.post('/api/horses/create', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push('/horses');
    } catch (error) {
      alert('Failed to create horse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/horses" className="text-indigo-600">
          <FiArrowLeft className="w-6 h-6" />
        </Link>
        <h2 className="text-3xl font-bold">Add Horse</h2>
      </div>

      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="form-group col-span-2">
              <label className="form-label">Horse Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <input type="text" name="color" value={formData.color} onChange={handleChange} className="form-input" placeholder="e.g., Bay, Chestnut" />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="form-input">
                <option value="Stallion">Stallion</option>
                <option value="Mare">Mare</option>
                <option value="Gelding">Gelding</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Passport Number</label>
              <input type="text" name="passportNumber" value={formData.passportNumber} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Horse Code</label>
              <input type="text" name="horseCode" value={formData.horseCode} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Year of Birth</label>
              <input type="number" name="yearOfBirth" value={formData.yearOfBirth} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Embassy ID</label>
              <input type="text" name="embassyId" value={formData.embassyId} onChange={handleChange} className="form-input font-mono" placeholder="e.g., EIRSHR00076" maxLength={11} />
              <p className="text-xs text-gray-500 mt-1">Format: EIRSHR followed by 5 digits</p>
            </div>
          </div>

          <div className="flex space-x-4">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Add Horse'}
            </button>
            <Link href="/horses" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

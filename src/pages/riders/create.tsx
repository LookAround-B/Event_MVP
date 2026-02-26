import React, { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

export default function CreateRider() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dob: '',
    mobile: '',
    address: '',
    aadhaarNumber: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      await axios.post('/api/riders/create', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push('/riders');
    } catch (error) {
      alert('Failed to create rider');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/riders" className="text-indigo-600">
          <FiArrowLeft className="w-6 h-6" />
        </Link>
        <h2 className="text-3xl font-bold">Add Rider</h2>
      </div>

      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile</label>
              <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Aadhaar Number</label>
              <input type="text" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group col-span-2">
              <label className="form-label">Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} className="form-input" rows={3} />
            </div>
          </div>

          <div className="flex space-x-4">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Add Rider'}
            </button>
            <Link href="/riders" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

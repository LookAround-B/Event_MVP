import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import AddressMapPicker from '@/components/AddressMapPicker';
import toast from 'react-hot-toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DatePicker } from '@/components/DatePicker';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';

export default function CreateClub() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    shortCode: '',
    contactNumber: '',
    optionalPhone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    gstNumber: '',
    description: '',
    primaryContactFirstName: '',
    primaryContactLastName: '',
    primaryContactEmail: '',
    primaryContactGender: 'Male',
    primaryContactMobile: '',
    primaryContactDob: '',
    socialLinks: {
      instagram: '',
      twitter: '',
      facebook: '',
      youtube: '',
      website: '',
      other: '',
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/api/clubs', {
        ...formData,
        socialLinks: Object.values(formData.socialLinks).some(v => v) ? formData.socialLinks : undefined,
      });
      toast.success('Club created successfully!');
      router.push('/clubs');
    } catch (error: any) {
      console.error('Failed to create club:', error);
      setError(error.response?.data?.message || 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 placeholder:text-muted-foreground";
  const selectClass = "w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 placeholder:text-muted-foreground appearance-none";

  return (
    <BoneyardSkeleton name="clubs-create-page" loading={false}>
    <ProtectedRoute>
      {/* ── Modal overlay ── */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in" />
        
        {/* ── Modal box ── */}
        <div className="relative z-10 w-full max-w-4xl flex flex-col rounded-2xl border border-border/60 bg-surface-low shadow-2xl shadow-black/40 animate-fade-in pointer-events-auto"
          style={{ maxHeight: "min(90vh, 720px)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 flex-shrink-0">
            <div>
              <h3 className="text-base font-bold text-on-surface">Create New Club</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Register a new club</p>
            </div>
            <Link href="/clubs" className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors">
              <span className="sr-only">Close</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            </Link>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-none">

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Club Information */}
            <div>
              <h4 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wider text-muted-foreground">Club Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label-tech block mb-1.5">Club Name <span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Club name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">Club Code <span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    name="shortCode"
                    placeholder="e.g., CLUB01"
                    value={formData.shortCode}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">Club Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    placeholder="+91 9876543210"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">Optional Phone Number</label>
                  <input
                    type="tel"
                    name="optionalPhone"
                    placeholder="+91 9876543210"
                    value={formData.optionalPhone}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">Club Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="club@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="label-tech block mb-1.5">GST Number</label>
                  <input
                    type="text"
                    name="gstNumber"
                    placeholder="GST number"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Club Address */}
            <div>
              <h4 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wider text-muted-foreground mt-6 pt-6 border-t border-border/40">Club Address</h4>
              <div>
                <label className="label-tech block mb-1.5">Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Club address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`${inputClass} mb-3`}
                />
              </div>

              <div className="mt-4">
                <AddressMapPicker
                  address={formData.address}
                  city={formData.city}
                  state={formData.state}
                  country={formData.country}
                  pincode={formData.pincode}
                  onAddressChange={(components) => {
                    setFormData(prev => ({
                      ...prev,
                      address: components.address || prev.address,
                      city: components.city || prev.city,
                      state: components.state || prev.state,
                      country: components.country || prev.country,
                      pincode: components.pincode || prev.pincode,
                    }));
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                <div>
                  <label className="label-tech block mb-1.5">City</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">State</label>
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">Country</label>
                  <input
                    type="text"
                    name="country"
                    placeholder="Country"
                    value={formData.country}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    placeholder="Pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="label-tech block mb-1.5">Description</label>
              <textarea
                name="description"
                placeholder="Club description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Person Details */}
            <div>
              <h4 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wider text-muted-foreground mt-6 pt-6 border-t border-border/40">Person Details (Contact Person) <span className="text-destructive">*</span></h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label-tech block mb-1.5">First Name <span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    name="primaryContactFirstName"
                    placeholder="First name"
                    value={formData.primaryContactFirstName}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">Last Name <span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    name="primaryContactLastName"
                    placeholder="Last name"
                    value={formData.primaryContactLastName}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">Date of Birth</label>
                  <DatePicker
                    value={formData.primaryContactDob}
                    onChange={(v) => setFormData(prev => ({ ...prev, primaryContactDob: v }))}
                    placeholder="Select date of birth"
                  />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">Gender</label>
                  <Select value={formData.primaryContactGender} onValueChange={(v) => setFormData(prev => ({ ...prev, primaryContactGender: v }))}>
                    <SelectTrigger className={selectClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="label-tech block mb-1.5">Mobile Number</label>
                  <input
                    type="tel"
                    name="primaryContactMobile"
                    placeholder="+91 9876543210"
                    value={formData.primaryContactMobile}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">Email <span className="text-destructive">*</span></label>
                  <input
                    type="email"
                    name="primaryContactEmail"
                    placeholder="contact@example.com"
                    value={formData.primaryContactEmail}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wider text-muted-foreground mt-6 pt-6 border-t border-border/40">Social Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label-tech block mb-1.5">Instagram</label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/..."
                    value={formData.socialLinks.instagram}
                    onChange={e => handleSocialChange('instagram', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">Twitter / X</label>
                  <input
                    type="url"
                    placeholder="https://twitter.com/..."
                    value={formData.socialLinks.twitter}
                    onChange={e => handleSocialChange('twitter', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">Facebook</label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/..."
                    value={formData.socialLinks.facebook}
                    onChange={e => handleSocialChange('facebook', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">YouTube</label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/..."
                    value={formData.socialLinks.youtube}
                    onChange={e => handleSocialChange('youtube', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">Website</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.socialLinks.website}
                    onChange={e => handleSocialChange('website', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="label-tech block mb-1.5">Other Link</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.socialLinks.other}
                    onChange={e => handleSocialChange('other', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

          </form>
          </div>
          
          {/* ── Sticky footer ── */}
          <div className="flex items-center gap-3 px-6 py-4 border-t border-border/40 flex-shrink-0">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 btn-cta rounded-xl text-sm font-bold"
            >
              {loading ? 'Creating...' : 'Create Club'}
            </button>
            <Link href="/clubs" className="flex-1 py-2.5 bg-surface-container rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/50 text-center">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
    </BoneyardSkeleton>
  );
}

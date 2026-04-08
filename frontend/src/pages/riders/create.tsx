import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { ArrowLeft, Check, Paperclip } from 'lucide-react';
import AddressMapPicker from '@/components/AddressMapPicker';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DatePicker } from '@/components/DatePicker';

interface SocialLinks {
  instagram: string;
  twitter: string;
  facebook: string;
  youtube: string;
  website: string;
  other: string;
}

export default function CreateRider() {
  const router = useRouter();
  const { id } = router.query;
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    efiRiderId: '',
    gender: '',
    dob: '',
    mobile: '',
    optionalPhone: '',
    address: '',
    imageUrl: '',
    aadharNumber: '',
  });

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: '',
    twitter: '',
    facebook: '',
    youtube: '',
    website: '',
    other: '',
  });

  useEffect(() => {
    if (isEdit && typeof id === 'string') {
      fetchRider();
    }
  }, [id, isEdit]);

  const fetchRider = async () => {
    try {
      const response = await api.get(`/api/riders/${id}`);
      const rider = response.data.data;
      setFormData({
        firstName: rider.firstName || '',
        lastName: rider.lastName || '',
        email: rider.email || '',
        efiRiderId: rider.efiRiderId || '',
        gender: rider.gender || '',
        dob: rider.dob ? rider.dob.split('T')[0] : '',
        mobile: rider.mobile || '',
        optionalPhone: rider.optionalPhone || '',
        address: rider.address || '',
        imageUrl: rider.imageUrl || '',
        aadharNumber: rider.aadharNumber || '',
      });
      const sl = (rider.socialLinks || {}) as any;
      setSocialLinks({
        instagram: sl.instagram || '',
        twitter: sl.twitter || '',
        facebook: sl.facebook || '',
        youtube: sl.youtube || '',
        website: sl.website || '',
        other: sl.other || '',
      });
    } catch (err) {
      console.error('Error fetching rider:', err);
      setError('Failed to load rider details');
    }
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Invalid email format');
      return false;
    }
    if (!formData.efiRiderId.trim()) {
      setError('EFI Rider ID is required');
      return false;
    }
    if (!formData.gender) {
      setError('Gender is required');
      return false;
    }
    if (!formData.dob) {
      setError('Date of birth is required');
      return false;
    }
    if (!formData.aadharNumber.trim()) {
      setError('Aadhar Number is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      setLoading(true);
      const socialLinksClean = Object.fromEntries(
        Object.entries(socialLinks).filter(([_, v]) => v && v.trim())
      );

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        efiRiderId: formData.efiRiderId,
        gender: formData.gender,
        dob: formData.dob,
        mobile: formData.mobile,
        optionalPhone: formData.optionalPhone || null,
        address: formData.address,
        imageUrl: formData.imageUrl || null,
        aadharNumber: formData.aadharNumber,
        socialLinks: Object.keys(socialLinksClean).length > 0 ? socialLinksClean : null,
      };

      if (isEdit) {
        await api.put(`/api/riders/${id}`, payload);
        toast.success('Rider updated successfully!');
      } else {
        await api.post('/api/riders', payload);
        toast.success('Rider created successfully!');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/riders');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving rider:', err);
      const message = err?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} rider.`;
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  if (success) {
    return (
      <ProtectedRoute>
        {/* ── Modal overlay ── */}
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in" />
          
          <div className="relative z-10 w-full max-w-sm flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-surface-low shadow-2xl p-8 animate-fade-in">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-on-surface mb-2">Success!</h2>
            <p className="text-muted-foreground text-center">
              Rider {isEdit ? 'updated' : 'created'} successfully. Redirecting...
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const inputClass = "w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 placeholder:text-muted-foreground";
  const selectClass = "w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 placeholder:text-muted-foreground appearance-none";

  return (
    <ProtectedRoute>
      {/* ── Modal overlay ── */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in" />
        
        {/* ── Modal box ── */}
        <div className="relative z-10 w-full max-w-2xl flex flex-col rounded-2xl border border-border/60 bg-surface-low shadow-2xl shadow-black/40 animate-fade-in pointer-events-auto"
          style={{ maxHeight: "min(90vh, 720px)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 flex-shrink-0">
            <div>
              <h3 className="text-base font-bold text-on-surface">{isEdit ? 'Edit Rider' : 'Register New Rider'}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{isEdit ? 'Update rider profile' : 'Create a new rider profile'}</p>
            </div>
            <Link href="/riders" className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors">
              <span className="sr-only">Close</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            </Link>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-none">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                  {error}
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wider text-muted-foreground">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="label-tech block mb-1.5">
                      First Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="First name"
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="label-tech block mb-1.5">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Last name (optional)"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="label-tech block mb-1.5">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="rider@example.com"
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="label-tech block mb-1.5">
                      Gender <span className="text-destructive">*</span>
                    </label>
                    <Select value={formData.gender || '__none__'} onValueChange={(v) => { setFormData(prev => ({ ...prev, gender: v === '__none__' ? '' : v })); if (error) setError(null); }}>
                      <SelectTrigger className={selectClass}>
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select Gender</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="label-tech block mb-1.5">
                      Date of Birth <span className="text-destructive">*</span>
                    </label>
                    <DatePicker
                      value={formData.dob}
                      onChange={(v) => { setFormData(prev => ({ ...prev, dob: v })); if (error) setError(null); }}
                      placeholder="Select date of birth"
                    />
                  </div>
                  <div>
                    <label className="label-tech block mb-1.5">Mobile</label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="+91 9876543210"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="label-tech block mb-1.5">Optional Phone</label>
                    <input
                      type="tel"
                      name="optionalPhone"
                      value={formData.optionalPhone}
                      onChange={handleInputChange}
                      placeholder="Alternative number"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="label-tech block mb-1.5">
                      Aadhar Number <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      name="aadharNumber"
                      value={formData.aadharNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., 1234 5678 9012"
                      maxLength={14}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="label-tech block mb-1.5">Profile Photo</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/50 cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                        Attach Image
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const fd = new FormData();
                            fd.append('file', file);
                            try {
                              const res = await api.post('/api/upload', fd);
                              setFormData(prev => ({ ...prev, imageUrl: res.data.data?.url || res.data.url }));
                              toast.success('Image uploaded');
                            } catch (err) {
                              toast.error('Failed to upload image');
                            }
                          }}
                        />
                      </label>
                      {formData.imageUrl && <span className="text-xs text-emerald-400 truncate max-w-[150px]">Attached</span>}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label-tech block mb-1.5">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter address"
                    rows={3}
                    className={`${inputClass} resize-none mb-3`}
                  />
                  <AddressMapPicker
                    address={formData.address}
                    onAddressChange={(components) => {
                      const parts = [components.address, components.city, components.state, components.country, components.pincode].filter(Boolean);
                      setFormData(prev => ({ ...prev, address: parts.join(', ') }));
                    }}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wider text-muted-foreground mt-6 pt-6 border-t border-border/40">Professional Info</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label-tech block mb-1.5">
                      EFI Rider ID <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      name="efiRiderId"
                      value={formData.efiRiderId}
                      onChange={handleInputChange}
                      placeholder="EFI identifier (required)"
                      className={inputClass}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wider text-muted-foreground mt-6 pt-6 border-t border-border/40">Social Links</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label-tech block mb-1.5">Instagram</label>
                    <input
                      type="text"
                      value={socialLinks.instagram}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                      placeholder="Instagram URL or handle"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="label-tech block mb-1.5">Twitter</label>
                    <input
                      type="text"
                      value={socialLinks.twitter}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                      placeholder="Twitter URL or handle"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="label-tech block mb-1.5">Facebook</label>
                    <input
                      type="text"
                      value={socialLinks.facebook}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, facebook: e.target.value }))}
                      placeholder="Facebook URL"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="label-tech block mb-1.5">YouTube</label>
                    <input
                      type="text"
                      value={socialLinks.youtube}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, youtube: e.target.value }))}
                      placeholder="YouTube URL"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="label-tech block mb-1.5">Website</label>
                    <input
                      type="text"
                      value={socialLinks.website}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="Website URL"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="label-tech block mb-1.5">Other</label>
                    <input
                      type="text"
                      value={socialLinks.other}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, other: e.target.value }))}
                      placeholder="Other link"
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
              {loading ? (isEdit ? 'Updating Rider...' : 'Creating Rider...') : (isEdit ? 'Update Rider' : 'Create Rider')}
            </button>
            <Link
              href="/riders"
              className="flex-1 py-2.5 bg-surface-container rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/50 text-center"
            >
              Cancel
            </Link>
          </div>
          </div>
        </div>
    </ProtectedRoute>
  );
}

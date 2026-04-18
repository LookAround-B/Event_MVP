import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import apiClient from '@/lib/api';
import AddressMapPicker from '@/components/AddressMapPicker';
import { DatePicker } from '@/components/DatePicker';
import { PageSkeleton } from '@/components/PageSkeleton';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

type OnboardingRole = 'rider' | 'club';

const emptySocialLinks = {
  instagram: '',
  twitter: '',
  facebook: '',
  youtube: '',
  website: '',
  other: '',
};

export default function CompleteProfile() {
  const router = useRouter();
  const [role, setRole] = useState<OnboardingRole>('rider');
  const [bootLoading, setBootLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    gender: '',
    phone: '',
    dob: '',
    address: '',
    optionalPhone: '',
    efiRiderId: '',
    aadhaarNumber: '',
    imageUrl: '',
    clubName: '',
    shortCode: '',
    registrationNumber: '',
    contactNumber: '',
    clubEmail: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    gstNumber: '',
    description: '',
    socialLinks: emptySocialLinks,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      const token = Cookies.get('authToken');

      if (!token) {
        router.replace('/rider/login');
        return;
      }

      try {
        const response = await apiClient.get('/api/users/profile');
        const profile = response.data.data;
        const resolvedRole = profile?.role === 'club' ? 'club' : 'rider';

        setRole(resolvedRole);
        setFormData((prev) => ({
          ...prev,
          email: profile?.email || '',
          firstName: profile?.firstName || '',
          lastName: profile?.lastName || '',
          gender: profile?.gender || '',
          phone: profile?.phone || '',
          dob: profile?.dob ? profile.dob.split('T')[0] : '',
          address: profile?.address || '',
          optionalPhone: profile?.optionalPhone || '',
          efiRiderId: profile?.efiRiderId || '',
          imageUrl: profile?.imageUrl || '',
        }));
      } catch (err: any) {
        if (err.response?.status === 401) {
          Cookies.remove('authToken');
          router.replace('/rider/login');
          return;
        }
        setError(err.response?.data?.message || 'Failed to load your profile');
      } finally {
        setBootLoading(false);
      }
    };

    initialize();
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  const handleSocialChange = (field: keyof typeof emptySocialLinks, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const socialLinks = Object.fromEntries(
      Object.entries(formData.socialLinks).filter(([, value]) => value.trim())
    );

    const commonPayload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      gender: formData.gender,
      phone: formData.phone,
      dob: formData.dob,
    };

    const payload =
      role === 'club'
        ? {
            clubName: formData.clubName,
            shortCode: formData.shortCode,
            registrationNumber: formData.registrationNumber,
            contactNumber: formData.contactNumber,
            optionalPhone: formData.optionalPhone,
            clubEmail: formData.clubEmail,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            pincode: formData.pincode,
            gstNumber: formData.gstNumber,
            description: formData.description,
            socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
          }
        : {
            ...commonPayload,
            optionalPhone: formData.optionalPhone,
            address: formData.address,
            efiRiderId: formData.efiRiderId,
            aadhaarNumber: formData.aadhaarNumber,
            imageUrl: formData.imageUrl,
            socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
          };

    try {
      const response = await apiClient.post('/api/users/complete-profile', payload);

      if (response.data.success && response.data.data?.token) {
        Cookies.set('authToken', response.data.data.token, { expires: 7 });
        router.push('/pending-approval');
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (bootLoading) {
    return <PageSkeleton variant="form" rows={8} />;
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 placeholder:text-muted-foreground';
  const selectClass =
    'w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 placeholder:text-muted-foreground appearance-none';
  const roleTitle = role === 'club' ? 'Complete Your Club Profile' : 'Complete Your Rider Profile';
  const roleDescription =
    role === 'club'
      ? 'Submit your club details. Admin approval will unlock platform access.'
      : 'Submit your rider details. Admin approval will unlock platform access.';

  return (
    <div className="min-h-screen py-10 px-4 relative overflow-hidden">
      <div className="absolute top-0 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute top-0 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute -bottom-8 left-20 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }} />

      <div className="max-w-4xl mx-auto bento-card">
        <div className="p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 bg-clip-text text-transparent">
              {roleTitle}
            </h1>
            <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
              {roleDescription}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-400/30">
              <p className="text-red-200 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {role === 'rider' ? (
              <>
                <div>
                  <h2 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wider text-muted-foreground">
                    Contact Person
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="label-tech block mb-1.5">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className={`${inputClass} opacity-70 cursor-not-allowed`}
                      />
                    </div>
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
                      <label className="label-tech block mb-1.5">
                        Last Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Last name"
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className="label-tech block mb-1.5">
                        Gender <span className="text-destructive">*</span>
                      </label>
                      <Select
                        value={formData.gender || '__none__'}
                        onValueChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            gender: value === '__none__' ? '' : value,
                          }));
                          if (error) setError(null);
                        }}
                      >
                        <SelectTrigger className={selectClass}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select gender</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                          <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="label-tech block mb-1.5">
                        Phone Number <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 9876543210"
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className="label-tech block mb-1.5">
                        Date of Birth <span className="text-destructive">*</span>
                      </label>
                      <DatePicker
                        value={formData.dob}
                        onChange={(value) => {
                          setFormData((prev) => ({ ...prev, dob: value }));
                          if (error) setError(null);
                        }}
                        placeholder="Select date of birth"
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
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wider text-muted-foreground mt-6 pt-6 border-t border-border/40">
                    Rider Profile
                  </h2>
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
                        placeholder="EFI rider ID"
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className="label-tech block mb-1.5">
                        Aadhaar Number <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        name="aadhaarNumber"
                        value={formData.aadhaarNumber}
                        onChange={handleInputChange}
                        placeholder="1234 5678 9012"
                        className={inputClass}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
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
                          const parts = [
                            components.address,
                            components.city,
                            components.state,
                            components.country,
                            components.pincode,
                          ].filter(Boolean);
                          setFormData((prev) => ({
                            ...prev,
                            address: parts.join(', '),
                          }));
                        }}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label-tech block mb-1.5">Profile Image URL</label>
                      <input
                        type="url"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        placeholder="https://..."
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wider text-muted-foreground mt-6 pt-6 border-t border-border/40">
                    Social Links
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {Object.keys(emptySocialLinks).map((field) => (
                      <div key={field}>
                        <label className="label-tech block mb-1.5 capitalize">
                          {field === 'other' ? 'Other Link' : field}
                        </label>
                        <input
                          type="text"
                          value={formData.socialLinks[field as keyof typeof emptySocialLinks]}
                          onChange={(e) =>
                            handleSocialChange(field as keyof typeof emptySocialLinks, e.target.value)
                          }
                          placeholder={`${field} URL or handle`}
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wider text-muted-foreground mt-6 pt-6 border-t border-border/40">
                    Club Profile
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="label-tech block mb-1.5">
                        Club Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        name="clubName"
                        value={formData.clubName}
                        onChange={handleInputChange}
                        placeholder="Club name"
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className="label-tech block mb-1.5">
                        Club Code <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        name="shortCode"
                        value={formData.shortCode}
                        onChange={handleInputChange}
                        placeholder="e.g. EQWI01"
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className="label-tech block mb-1.5">Registration Number</label>
                      <input
                        type="text"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleInputChange}
                        placeholder="Registration number"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="label-tech block mb-1.5">Club Contact Number</label>
                      <input
                        type="tel"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleInputChange}
                        placeholder="+91 9876543210"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="label-tech block mb-1.5">Optional Club Phone</label>
                      <input
                        type="tel"
                        name="optionalPhone"
                        value={formData.optionalPhone}
                        onChange={handleInputChange}
                        placeholder="Alternative club phone"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="label-tech block mb-1.5">Club Email</label>
                      <input
                        type="email"
                        name="clubEmail"
                        value={formData.clubEmail}
                        onChange={handleInputChange}
                        placeholder="club@example.com"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="label-tech block mb-1.5">GST Number</label>
                      <input
                        type="text"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleInputChange}
                        placeholder="GST number"
                        className={inputClass}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label-tech block mb-1.5">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Tell admins a bit about your club"
                        rows={3}
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wider text-muted-foreground mt-6 pt-6 border-t border-border/40">
                    Club Address
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="label-tech block mb-1.5">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Club address"
                        className={`${inputClass} mb-3`}
                      />
                      <AddressMapPicker
                        address={formData.address}
                        city={formData.city}
                        state={formData.state}
                        country={formData.country}
                        pincode={formData.pincode}
                        onAddressChange={(components) => {
                          setFormData((prev) => ({
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="label-tech block mb-1.5">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="City"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="label-tech block mb-1.5">State</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="State"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="label-tech block mb-1.5">Country</label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          placeholder="Country"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="label-tech block mb-1.5">Pincode</label>
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          placeholder="Pincode"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wider text-muted-foreground mt-6 pt-6 border-t border-border/40">
                    Club Links
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {Object.keys(emptySocialLinks).map((field) => (
                      <div key={field}>
                        <label className="label-tech block mb-1.5 capitalize">
                          {field === 'other' ? 'Other Link' : field}
                        </label>
                        <input
                          type="url"
                          value={formData.socialLinks[field as keyof typeof emptySocialLinks]}
                          onChange={(e) =>
                            handleSocialChange(field as keyof typeof emptySocialLinks, e.target.value)
                          }
                          placeholder={`https://${field}.com/...`}
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full md:w-auto min-w-[220px] px-6 py-3 rounded-full"
              >
                {loading ? 'Submitting...' : 'Submit for Admin Approval'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

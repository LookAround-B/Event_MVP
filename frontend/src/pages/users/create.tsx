import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';

interface Role {
  id: string;
  name: string;
  description?: string;
}

const EMPTY_FORM_DATA = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  gender: '',
  roleId: '',
};

export default function CreateUser() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState(EMPTY_FORM_DATA);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/api/settings/roles');
        setRoles(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    const resetAutofill = window.setTimeout(() => {
      setFormData(EMPTY_FORM_DATA);
      if (emailInputRef.current) emailInputRef.current.value = '';
      if (passwordInputRef.current) passwordInputRef.current.value = '';
    }, 150);

    return () => window.clearTimeout(resetAutofill);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/api/users', formData);
      router.push('/users');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 placeholder:text-muted-foreground";
  const selectClass = "w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 placeholder:text-muted-foreground appearance-none";

  return (
    <BoneyardSkeleton name="users-create-page" loading={false}>
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
              <h3 className="text-base font-bold text-on-surface">Create New User</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Add a new admin or staff member</p>
            </div>
            <Link href="/users" className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors">
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

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            <div className="absolute -z-10 h-0 w-0 overflow-hidden opacity-0 pointer-events-none" aria-hidden="true">
              <input type="text" name="fake-username" autoComplete="username" tabIndex={-1} />
              <input type="password" name="fake-password" autoComplete="current-password" tabIndex={-1} />
            </div>
            <div>
              <label className="label-tech block mb-1.5">Email</label>
              <input
                ref={emailInputRef}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </div>

            <div>
              <label className="label-tech block mb-1.5">Password</label>
              <input
                ref={passwordInputRef}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={inputClass}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="label-tech block mb-1.5">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
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
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-tech block mb-1.5">Gender</label>
              <Select value={formData.gender || '__none__'} onValueChange={(v) => setFormData({ ...formData, gender: v === '__none__' ? '' : v })}>
                <SelectTrigger className={selectClass}>
                  <SelectValue placeholder="Select Gender (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select Gender (optional)</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="label-tech block mb-1.5">Role</label>
              <Select value={formData.roleId || '__none__'} onValueChange={(v) => setFormData({ ...formData, roleId: v === '__none__' ? '' : v })}>
                <SelectTrigger className={selectClass}>
                  <SelectValue placeholder="Select Role (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select Role (optional)</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {loading ? 'Creating...' : 'Create User'}
            </button>
            <Link href="/users" className="flex-1 py-2.5 bg-surface-container rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/50 text-center">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
    </BoneyardSkeleton>
  );
}

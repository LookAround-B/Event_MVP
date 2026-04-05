import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import apiClient from '@/lib/api';
import Cookies from 'js-cookie';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/api/auth/signup', formData);
      Cookies.set('authToken', response.data.data.token, { expires: 7 });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-dot-grid"
      style={{ background: 'hsl(var(--surface-background))' }}
    >
      <div
        className="w-full max-w-md rounded-2xl animate-fade-in"
        style={{
          background: 'hsl(var(--surface-card))',
          border: '1px solid hsl(var(--border) / 0.5)',
        }}
      >
        <div className="p-8">
          {/* Brand */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black" style={{ color: 'hsl(var(--primary))' }}>
              Equestrian
            </h1>
            <p className="mt-2 font-medium" >
              Create Your Account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    
                  />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="First name"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    
                  />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  
                />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="p-4 rounded-xl text-sm font-medium"
                style={{
                  background: 'hsl(var(--error) / 0.1)',
                  border: '1px solid hsl(var(--error) / 0.3)',
                  color: 'hsl(var(--error))',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-6 py-3 text-base disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid hsl(var(--border) / 0.5)' }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span
                  className="px-2 font-medium"
                  style={{
                    background: 'hsl(var(--surface-card))',
                    color: 'hsl(var(--muted-foreground))',
                  }}
                >
                  Or
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  setError('');
                  setLoading(true);
                  try {
                    const response = await apiClient.post('/api/auth/google', {
                      token: credentialResponse.credential,
                    });
                    Cookies.set('authToken', response.data.data.token, { expires: 7 });
                    if (response.data.data.user?.isApproved === false) {
                      router.push('/pending-approval');
                    } else {
                      router.push('/dashboard');
                    }
                  } catch (err: any) {
                    setError(err.response?.data?.message || 'Google signup failed. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => {
                  setError('Google signup failed. Please try again.');
                }}
              />
            </div>
          </form>

          <div className="mt-6 text-center" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)', paddingTop: '1.5rem' }}>
            <p className="text-sm" >
              Already have an account?{' '}
              <Link href="/auth/login" className="font-bold transition-colors" style={{ color: 'hsl(var(--primary))' }}>
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

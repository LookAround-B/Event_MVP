import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import apiClient from '@/lib/api';
import Cookies from 'js-cookie';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
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
      const response = await apiClient.post('/api/auth/login', formData);
      Cookies.set('authToken', response.data.data.token, { expires: 7 });
      
      if (response.data.data.user?.isApproved === false) {
        router.push('/pending-approval');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-dot-grid"
      style={{ background: 'hsl(var(--surface-background))' }}
    >
      <div
        className="w-full max-w-md rounded-2xl animate-fade-in primary-card-glow"
        style={{
          background: 'hsl(var(--surface-card))',
          border: '1px solid hsl(var(--border) / 0.5)',
        }}
      >
        <div className="p-8">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="text-4xl font-black mb-2" style={{ color: 'hsl(var(--primary))' }}>
              Equestrian
            </div>
            <p className="font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Event Management Platform
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'hsl(var(--secondary))' }}
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

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'hsl(var(--secondary))' }}
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
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-8 py-3 text-base disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid hsl(var(--border) / 0.5)' }}></div>
              </div>
              <div className="relative flex justify-center">
                <span
                  className="px-3 text-sm font-medium"
                  style={{
                    background: 'hsl(var(--surface-card))',
                    color: 'hsl(var(--muted-foreground))',
                  }}
                >
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Login */}
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
                    setError(err.response?.data?.message || 'Google login failed. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => {
                  setError('Google login failed. Please try again.');
                }}
              />
            </div>
          </form>

          {/* Footer link */}
          <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)' }}>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Don't have an account?{' '}
              <Link href="/auth/signup" className="font-bold transition-colors" style={{ color: 'hsl(var(--primary))' }}>
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

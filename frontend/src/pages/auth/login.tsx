import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import apiClient from '@/lib/api';
import Cookies from 'js-cookie';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated floating blobs */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute top-0 -right-40 w-80 h-80 bg-secondary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-8 left-20 w-80 h-80 bg-accent-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>

      <div className="glass w-full max-w-md backdrop-blur-xl border-white border-opacity-20 shadow-glass-lg">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="text-4xl font-black bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 bg-clip-text text-transparent mb-2">Equestrian</div>
            <p className="text-gray-300 font-medium">Event Management Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3.5 text-secondary-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input pl-10"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3.5 text-secondary-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-200 transition"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500 bg-opacity-15 border border-red-400 border-opacity-30 backdrop-blur-sm">
                <p className="text-red-200 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-8"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white border-opacity-20"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-sm text-gray-300 font-medium bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">Or continue with</span>
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

          <div className="mt-8 pt-6 border-t border-white border-opacity-10 text-center">
            <p className="text-gray-300 text-sm">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent font-bold hover:from-primary-300 hover:to-secondary-300 transition">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

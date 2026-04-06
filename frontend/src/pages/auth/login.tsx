import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import apiClient from '@/lib/api';
import Cookies from 'js-cookie';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-black relative py-12 px-4 shadow-[inset_0_0_100px_rgba(var(--primary-rgb),0.05)]">
      {/* Dark ambient overlay */}
      <div className="absolute inset-0 z-[1] bg-black/55" />
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[160px] opacity-10 bg-primary pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.06] pointer-events-none" style={{ background: 'hsl(253,90%,73%)' }} />

      <div className="relative z-[2] w-full max-w-md animate-fade-in">

        {/* Brand */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">
            EQ<span className="text-primary">WI</span>
          </h1>
          <p className="text-on-surface-variant text-sm mt-2 tracking-wide">
            Equestrian Event Management Platform
          </p>
        </div>

        {/* Login Card */}
        <div
          className="p-6 sm:p-8 rounded-2xl border border-white/10"
          style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="label-tech block mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-white/10 transition-all"
                style={{ background: 'rgba(255,255,255,0.07)' }}
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="label-tech block mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-white/10 transition-all pr-12"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-on-surface transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded accent-primary w-3.5 h-3.5" />
                Remember me
              </label>
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
              className="w-full py-3.5 rounded-xl btn-cta text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs font-medium text-muted-foreground" style={{ background: 'rgba(255,255,255,0.06)' }}>
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
        </div>

        {/* Footer link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-bold text-primary hover:text-primary/80 transition-colors">
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center text-muted-foreground text-xs mt-6">
          © 2025 EQWI. All rights reserved.
        </p>
        <p className="text-center text-on-surface-variant/70 text-[11px] mt-2 font-semibold tracking-widest uppercase opacity-80">
          Powered by LookAround.
        </p>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import apiClient from '@/lib/api';
import Cookies from 'js-cookie';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';
import { ShaderAnimation } from '@/components/shader-lines';
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

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.07)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative py-12 px-4"
      style={{ background: '#000', boxShadow: 'inset 0 0 100px hsl(4 85% 52% / 0.05)' }}
    >
      {/* Shader background */}
      <div className="absolute inset-0 z-0">
        <ShaderAnimation />
      </div>
      {/* Dark overlay */}
      <div className="absolute inset-0 z-[1]" style={{ background: 'rgba(0,0,0,0.55)' }} />

      <div className="relative z-[2] w-full max-w-md animate-fade-in">

        {/* Brand */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'hsl(224 100% 98%)' }}>
            EQ<span style={{ color: 'hsl(4 85% 52%)' }}>WI</span>
          </h1>
          <p className="text-sm mt-2 tracking-wide" style={{ color: 'hsl(224 20% 65%)' }}>
            Equestrian Event Management Platform
          </p>
        </div>

        {/* Login Card */}
        <div
          className="p-6 sm:p-8 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
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
                style={inputStyle}
                placeholder="Enter your email"
                required
                onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(4 85% 52% / 0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px hsl(4 85% 52% / 0.12)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
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
                  style={{ ...inputStyle, paddingRight: '3rem' }}
                  placeholder="Enter your password"
                  required
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(4 85% 52% / 0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px hsl(4 85% 52% / 0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'hsl(224 15% 45%)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'hsl(224 15% 45%)' }}>
                <input type="checkbox" className="rounded accent-primary w-3.5 h-3.5" />
                Remember me
              </label>
            </div>

            {/* Error */}
            {error && (
              <div
                className="p-4 rounded-xl text-sm font-medium"
                style={{
                  background: 'hsl(0 84% 60% / 0.1)',
                  border: '1px solid hsl(0 84% 60% / 0.3)',
                  color: 'hsl(0 84% 60%)',
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
              <div className="w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs font-medium" style={{ color: 'hsl(224 15% 45%)', background: 'rgba(255,255,255,0.06)' }}>
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
          <p className="text-sm" style={{ color: 'hsl(224 15% 45%)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-bold transition-colors" style={{ color: 'hsl(4 85% 52%)' }}>
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'hsl(224 15% 45%)' }}>
          © 2025 EQWI. All rights reserved.
        </p>
        <p className="text-center text-[11px] mt-2 font-semibold tracking-widest uppercase" style={{ color: 'hsl(224 20% 65% / 0.7)' }}>
          Powered by LookAround.
        </p>
      </div>
    </div>
  );
}

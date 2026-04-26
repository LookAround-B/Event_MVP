import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import apiClient from '@/lib/api';
import Cookies from 'js-cookie';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';
import { ShaderAnimation } from '@/components/shader-lines';
import GoogleAuthIconButton from '@/components/auth/GoogleAuthIconButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';

export default function Signup() {
  const router = useRouter();
  const [signupRole, setSignupRole] = useState<'rider' | 'club'>('rider');
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

  const isClubSignup = signupRole === 'club';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/api/auth/signup', {
        ...formData,
        role: signupRole,
      });
      Cookies.set('authToken', response.data.data.token, { expires: 7, path: '/' });
      const user = response.data.data.user;

      if (!user?.profileComplete && user?.isApproved === false) {
        router.push('/complete-profile');
      } else if (user?.isApproved === false) {
        router.push('/pending-approval');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BoneyardSkeleton name="signup-page" loading={false}>
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-black">
      {/* Shader background */}
      <div className="pointer-events-none fixed inset-0 z-0 shadow-[inset_0_0_100px_rgba(var(--primary-rgb),0.05)]">
        <ShaderAnimation />
      </div>
      {/* Dark overlay */}
      <div className="pointer-events-none fixed inset-0 z-[1] bg-black/55" />

      <div className="relative z-[2] flex min-h-[100dvh] w-full items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">

        {/* Brand */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">
            EQ<span className="text-primary">WI</span>
          </h1>
          <p className="text-on-surface-variant text-sm mt-2 tracking-wide">
            Create Your Account
          </p>
        </div>

        {/* Signup Card */}
        <Card
          className="rounded-2xl border-white/10 shadow-none"
          style={{
            background: 'rgb(14, 14, 14)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="label-tech">Account Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSignupRole('rider')}
                    className={`rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                      signupRole === 'rider'
                        ? 'bg-white/10 text-primary border-primary/30 hover:bg-white/15'
                        : 'text-white/40 hover:text-white/70 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    Rider
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSignupRole('club')}
                    className={`rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                      signupRole === 'club'
                        ? 'bg-white/10 text-primary border-primary/30 hover:bg-white/15'
                        : 'text-white/40 hover:text-white/70 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    Club
                  </Button>
                </div>
              </div>

              {!isClubSignup && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="label-tech">First Name</Label>
                    <Input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="auth-input h-12 rounded-xl text-white placeholder:text-white/30 text-sm focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-offset-0 border-white/10"
                      style={{ background: 'rgba(255,255,255,0.07)' }}
                      placeholder="First name"
                      required={!isClubSignup}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-tech">Last Name</Label>
                    <Input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="auth-input h-12 rounded-xl text-white placeholder:text-white/30 text-sm focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-offset-0 border-white/10"
                      style={{ background: 'rgba(255,255,255,0.07)' }}
                      placeholder="Last name"
                      required={!isClubSignup}
                    />
                  </div>
                </div>
              )}

              {/* Account Identifier */}
              <div className="space-y-2">
                <Label className="label-tech">{isClubSignup ? 'Username' : 'Email'}</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="auth-input h-12 rounded-xl text-white placeholder:text-white/30 text-sm focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-offset-0 border-white/10"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                  placeholder={isClubSignup ? 'club@email.com' : 'your@email.com'}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label className="label-tech">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="auth-input h-12 rounded-xl text-white placeholder:text-white/30 text-sm focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-offset-0 border-white/10 pr-12"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                    placeholder="Enter your password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-on-surface hover:bg-transparent"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label className="label-tech">Confirm Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="auth-input h-12 rounded-xl text-white placeholder:text-white/30 text-sm focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-offset-0 border-white/10 pr-12"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                    placeholder="Confirm your password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-on-surface hover:bg-transparent"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 rounded-xl text-sm font-medium bg-destructive/10 border border-destructive/30 text-destructive">
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl btn-cta text-sm font-bold uppercase tracking-wider group disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Sign Up'}
                {!loading && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs font-medium text-muted-foreground" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Login */}
            <div className="flex justify-center">
              <GoogleAuthIconButton
                disabled={loading}
                onToken={async (token) => {
                  setError('');
                  setLoading(true);
                  try {
                    const response = await apiClient.post('/api/auth/google', {
                      token,
                      role: signupRole,
                    });
                    Cookies.set('authToken', response.data.data.token, { expires: 7, path: '/' });
                    const user = response.data.data.user;
                    if (!user?.profileComplete && user?.isApproved === false) {
                      router.push('/complete-profile');
                    } else if (user?.isApproved === false) {
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
                onError={(message) => setError(message.replace('login', 'signup'))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Footer link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
              Log in
            </Link>
          </p>
        </div>

        <p className="text-center text-muted-foreground text-xs mt-6">
          &copy; 2025 EQWI. All rights reserved.
        </p>
        <p className="text-center text-on-surface-variant/70 text-[11px] mt-2 font-semibold tracking-widest uppercase opacity-80">
          Powered by LookAround.
        </p>
        </div>
      </div>
    </div>
    </BoneyardSkeleton>
  );
}

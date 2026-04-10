import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import apiClient from '@/lib/api';
import Cookies from 'js-cookie';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';
import { ShaderAnimation } from '@/components/shader-lines';
import { GoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import SplashScreen from '@/components/SplashScreen';

type PortalTab = 'rider-club' | 'admin';
type LoginRole = 'rider' | 'club';
type GoogleAuthRole = LoginRole | 'admin';

export default function Login() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<PortalTab>('rider-club');
  const [loginType, setLoginType] = useState<LoginRole>('rider');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

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

      const user = response.data.data.user;

      if (!user?.profileComplete && user?.isApproved === false) {
        router.push('/complete-profile');
      } else if (user?.isApproved === false) {
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

  const emailLabel =
    activeTab === 'admin'
      ? 'Admin Email'
      : loginType === 'rider'
        ? 'Rider Email'
        : 'Club Email';

  const submitLabel =
    activeTab === 'admin'
      ? 'Admin Sign In'
      : `Sign In as ${loginType === 'rider' ? 'Rider' : 'Club'}`;

  const googleRole: GoogleAuthRole = activeTab === 'admin' ? 'admin' : loginType;

  const handleGoogleLogin = async (credential?: string) => {
    if (!credential) {
      setError('Google login failed. Please try again.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/api/auth/google', {
        token: credential,
        role: googleRole,
      });
      Cookies.set('authToken', response.data.data.token, { expires: 7 });

      const user = response.data.data.user;
      if (!user?.profileComplete && user?.isApproved === false) {
        router.push('/complete-profile');
      } else if (user?.isApproved === false) {
        router.push('/pending-approval');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-black">
      {/* Shader background */}
      {!showSplash && (
        <div className="pointer-events-none fixed inset-0 z-0 shadow-[inset_0_0_100px_rgba(var(--primary-rgb),0.05)]">
          <ShaderAnimation />
        </div>
      )}
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
            Equestrian Event Management Platform
          </p>
        </div>

        {/* Portal Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PortalTab)} className="mb-6 sm:mb-8">
          <TabsList
            className="w-full h-auto rounded-2xl p-1.5 gap-1 border border-white/10 bg-transparent"
            style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
          >
            <TabsTrigger
              value="rider-club"
              className="flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 data-[state=active]:btn-cta data-[state=active]:shadow-none data-[state=inactive]:bg-transparent"
            >
              Rider / Club
            </TabsTrigger>
            <TabsTrigger
              value="admin"
              className="flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 data-[state=active]:btn-cta data-[state=active]:shadow-none data-[state=inactive]:bg-transparent"
            >
              Admin
            </TabsTrigger>
          </TabsList>

          {/* Login Card */}
          <Card
            className="mt-6 sm:mt-8 rounded-2xl border-white/10 bg-transparent shadow-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <CardContent className="p-6 sm:p-8">
              {/* Rider / Club toggle */}
              <TabsContent value="rider-club" className="mt-0">
                <div className="flex gap-3 mb-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLoginType('rider')}
                    className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${
                      loginType === 'rider'
                        ? 'bg-white/10 text-primary border-primary/30 hover:bg-white/15'
                        : 'text-white/40 hover:text-white/70 border-transparent hover:bg-white/5'
                    }`}
                  >
                    Rider
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLoginType('club')}
                    className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${
                      loginType === 'club'
                        ? 'bg-surface-container text-primary border-primary/30 hover:bg-surface-container/80'
                        : 'text-muted-foreground hover:text-on-surface-variant border-transparent hover:bg-white/5'
                    }`}
                  >
                    Club
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="admin" className="mt-0" />

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <Label className="label-tech">{emailLabel}</Label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-12 rounded-xl text-white placeholder:text-white/30 text-sm focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-offset-0 border-white/10"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                    placeholder="Enter your email"
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
                      className="h-12 rounded-xl text-white placeholder:text-white/30 text-sm focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-offset-0 border-white/10 pr-12"
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

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      className="h-3.5 w-3.5 rounded border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer font-normal">
                      Remember me
                    </Label>
                  </div>
                  <Button type="button" variant="link" className="text-primary hover:text-primary/80 h-auto p-0 text-xs font-medium">
                    Forgot password?
                  </Button>
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
                  {loading ? 'Signing in...' : submitLabel}
                  {!loading && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </Button>
              </form>

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

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    void handleGoogleLogin(credentialResponse.credential);
                  }}
                  onError={() => {
                    setError('Google login failed. Please try again.');
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </Tabs>

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
          &copy; 2025 EQWI. All rights reserved.
        </p>
        <p className="text-center text-on-surface-variant/70 text-[11px] mt-2 font-semibold tracking-widest uppercase opacity-80">
          Powered by LookAround.
        </p>
        </div>
      </div>
    </div>
    </>
  );
}

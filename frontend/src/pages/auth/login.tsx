import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import apiClient from '@/lib/api';
import Cookies from 'js-cookie';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';
import GoogleAuthIconButton from '@/components/auth/GoogleAuthIconButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';

type PortalTab = 'rider-club' | 'admin';
type LoginRole = 'rider' | 'club';
type GoogleAuthRole = LoginRole | 'admin';
const backgroundVideos = ['/videos/vid_1.mp4', '/videos/vid_2.mp4', '/videos/vid_3.mp4'];

export default function Login() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PortalTab>('rider-club');
  const [loginType, setLoginType] = useState<LoginRole>('rider');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [failedVideos, setFailedVideos] = useState<Set<number>>(new Set());

  const allVideosFailed = failedVideos.size >= backgroundVideos.length;
  const activeVideoSrc = backgroundVideos[activeVideoIndex];

  useEffect(() => {
    setIsVideoVisible(false);
  }, [activeVideoIndex]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const role = activeTab === 'admin' ? 'admin' : loginType;

    try {
      const response = await apiClient.post('/api/auth/login', { ...formData, role });
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
      setError(err.response?.data?.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BoneyardSkeleton name="login-page" loading={false}>
    <div className="relative min-h-[100dvh] overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0 z-0">
        {!allVideosFailed && <video
          key={activeVideoSrc}
          autoPlay
          muted
          playsInline
          preload="metadata"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity ${
            isVideoVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transitionDuration: '700ms' }}
          onCanPlay={() => setIsVideoVisible(true)}
          onEnded={() => setActiveVideoIndex((i) => (i + 1) % backgroundVideos.length)}
          onError={() => {
            setFailedVideos((prev) => {
              const next = new Set(prev);
              next.add(activeVideoIndex);
              return next;
            });
            setActiveVideoIndex((i) => (i + 1) % backgroundVideos.length);
          }}
          aria-hidden="true"
        >
          <source src={activeVideoSrc} type="video/mp4" />
        </video>}
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-black/38" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),rgba(0,0,0,0.38)_40%,rgba(0,0,0,0.62)_100%)]" />

      <div className="relative z-[2] flex min-h-[100dvh] w-full items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">

        {/* Brand */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            EQ<span className="text-primary">WI</span>
          </h1>
          <p className="mt-2 text-sm tracking-[0.22em] text-white/70">
            Equestrian Event Management Platform
          </p>
        </div>

        {/* Portal Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PortalTab)} className="mb-6 sm:mb-8">
          <TabsList
            className="h-auto w-full gap-1 rounded-[24px] border border-white/15 bg-black/25 p-1.5 backdrop-blur-xl"
          >
            <TabsTrigger
              value="rider-club"
              className="flex-1 rounded-[18px] py-3 text-sm font-bold text-white/75 transition-all duration-300 data-[state=active]:bg-white/14 data-[state=active]:text-white data-[state=active]:shadow-none data-[state=inactive]:bg-transparent"
            >
              Rider / Club
            </TabsTrigger>
            <TabsTrigger
              value="admin"
              className="flex-1 rounded-[18px] py-3 text-sm font-bold text-white/75 transition-all duration-300 data-[state=active]:bg-white/14 data-[state=active]:text-white data-[state=active]:shadow-none data-[state=inactive]:bg-transparent"
            >
              Admin
            </TabsTrigger>
          </TabsList>

          {/* Login Card */}
          <div
            className="mt-6 overflow-hidden rounded-[30px] border border-white/15 bg-black/[0.32] shadow-[0_22px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:mt-8"
            style={{
              boxShadow: '0 22px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          >
            <div className="p-6 sm:p-8">
              {/* Rider / Club toggle */}
              <TabsContent value="rider-club" className="mt-0">
                <div className="flex gap-3 mb-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLoginType('rider')}
                    className={`flex-1 rounded-2xl border py-2.5 text-xs font-bold uppercase tracking-[0.24em] transition-all ${
                      loginType === 'rider'
                        ? 'border-white/20 bg-white/[0.14] text-white hover:bg-white/20'
                        : 'border-white/[0.08] bg-transparent text-white/[0.45] hover:border-white/15 hover:bg-white/[0.06] hover:text-white/75'
                    }`}
                  >
                    Rider
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLoginType('club')}
                    className={`flex-1 rounded-2xl border py-2.5 text-xs font-bold uppercase tracking-[0.24em] transition-all ${
                      loginType === 'club'
                        ? 'border-white/20 bg-white/[0.14] text-white hover:bg-white/20'
                        : 'border-white/[0.08] bg-transparent text-white/[0.45] hover:border-white/15 hover:bg-white/[0.06] hover:text-white/75'
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
                    className="auth-input h-12 rounded-2xl border-white/[0.12] text-sm text-white placeholder:text-white/[0.34] focus-visible:ring-1 focus-visible:ring-white/25 focus-visible:ring-offset-0"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
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
                      className="auth-input h-12 rounded-2xl border-white/[0.12] pr-12 text-sm text-white placeholder:text-white/[0.34] focus-visible:ring-1 focus-visible:ring-white/25 focus-visible:ring-offset-0"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                      placeholder="Enter your password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-white/[0.55] hover:bg-transparent hover:text-white"
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
                      className="h-3.5 w-3.5 rounded border-white/25 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    <Label htmlFor="remember" className="cursor-pointer text-xs font-normal text-white/60">
                      Remember me
                    </Label>
                  </div>
                  <Button type="button" variant="link" className="h-auto p-0 text-xs font-medium text-white/[0.72] hover:text-white">
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
                  className="group h-12 w-full rounded-2xl btn-cta text-sm font-bold uppercase tracking-wider disabled:opacity-50"
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
                  <span className="rounded-full bg-black/[0.18] px-3 text-xs font-medium text-white/[0.55]" style={{ backdropFilter: 'blur(12px)' }}>
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <GoogleAuthIconButton
                  disabled={loading}
                  onToken={handleGoogleLogin}
                  onError={(message) => setError(message)}
                />
              </div>
            </div>
          </div>
        </Tabs>

        {/* Footer link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-white/60">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-bold text-white transition-colors hover:text-primary">
              Sign up
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-white/[0.45]">
          &copy; 2025 EQWI. All rights reserved.
        </p>
        <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.26em] text-white/[0.38]">
          Powered by LookAround.
        </p>
        </div>
      </div>
    </div>
    </BoneyardSkeleton>
  );
}

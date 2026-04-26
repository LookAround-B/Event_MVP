import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { AppearanceProvider } from '@/contexts/AppearanceContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/lib/protected-route';
import ToastProvider from '@/components/ToastProvider';
import { AppShellSkeleton } from '@/components/AppShellSkeleton';
import { PageSkeleton } from '@/components/PageSkeleton';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import '@/styles/globals.css';

type ProtectedSkeletonVariant = 'dashboard' | 'table' | 'detail' | 'form' | 'list';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const PUBLIC_ROUTES = ['/auth/login', '/auth/signup', '/pending-approval', '/complete-profile', '/'];

function normalizeRoutePath(url: string) {
  return url.split('?')[0]?.split('#')[0] || url;
}

function getProtectedSkeletonVariant(path: string): ProtectedSkeletonVariant {
  if (path === '/dashboard') return 'dashboard';
  if (path === '/account' || path === '/settings') return 'form';
  if (path.startsWith('/events/') || path.startsWith('/registrations/') || path.startsWith('/financial/')) {
    return 'detail';
  }
  if (path === '/notifications') return 'list';
  return 'table';
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [routeLoadingPath, setRouteLoadingPath] = useState(router.pathname);
  const routeLoadingStartedAt = useRef<number | null>(null);
  const routeLoadingVisibleAt = useRef<number | null>(null);
  const routeLoadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeLoadingDelayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxLoadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const clearPendingTimeout = () => {
      if (routeLoadingTimeout.current) {
        clearTimeout(routeLoadingTimeout.current);
        routeLoadingTimeout.current = null;
      }
      if (routeLoadingDelayTimeout.current) {
        clearTimeout(routeLoadingDelayTimeout.current);
        routeLoadingDelayTimeout.current = null;
      }
    };

    const resetRouteLoading = () => {
      setIsRouteLoading(false);
      setRouteLoadingPath(router.pathname);
      routeLoadingStartedAt.current = null;
      routeLoadingVisibleAt.current = null;
    };

    const handleStart = (url: string) => {
      if (url !== router.asPath) {
        clearPendingTimeout();
        if (maxLoadingTimeout.current) {
          clearTimeout(maxLoadingTimeout.current);
        }
        routeLoadingStartedAt.current = Date.now();
        setRouteLoadingPath(normalizeRoutePath(url));
        routeLoadingVisibleAt.current = null;
        routeLoadingDelayTimeout.current = setTimeout(() => {
          routeLoadingVisibleAt.current = Date.now();
          setIsRouteLoading(true);
          routeLoadingDelayTimeout.current = null;
        }, 180);
        // Safety net: force-clear skeleton after 8s if routeChangeComplete never fires
        maxLoadingTimeout.current = setTimeout(() => {
          resetRouteLoading();
          maxLoadingTimeout.current = null;
        }, 8000);
      }
    };
    const handleStop = () => {
      if (maxLoadingTimeout.current) {
        clearTimeout(maxLoadingTimeout.current);
        maxLoadingTimeout.current = null;
      }
      clearPendingTimeout();

      if (!routeLoadingVisibleAt.current) {
        resetRouteLoading();
        return;
      }

      const minVisibleMs = 90;
      const elapsed = Date.now() - routeLoadingVisibleAt.current;
      const remaining = Math.max(0, minVisibleMs - elapsed);

      routeLoadingTimeout.current = setTimeout(() => {
        resetRouteLoading();
        routeLoadingTimeout.current = null;
      }, remaining);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleStop);
    router.events.on('routeChangeError', handleStop);

    return () => {
      clearPendingTimeout();
      if (maxLoadingTimeout.current) {
        clearTimeout(maxLoadingTimeout.current);
      }
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleStop);
      router.events.off('routeChangeError', handleStop);
    };
  }, [router]);

  if (!isClient) {
    return isPublicRoute ? <PageSkeleton variant="public" /> : <AppShellSkeleton />;
  }

  if (isPublicRoute) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AppearanceProvider>
            <GoogleOAuthProvider clientId={clientId}>
              <ToastProvider />
              <Head>
                <title>Equestrian Events</title>
                <link rel="icon" type="image/png" href="/logo_new.png" />
              </Head>
              <BoneyardSkeleton name={`page-${normalizeRoutePath(router.asPath).replace(/\//g, '-') || 'home'}`} loading={isRouteLoading}>
                {isRouteLoading ? <PageSkeleton variant="public" /> : <Component {...pageProps} />}
              </BoneyardSkeleton>
            </GoogleOAuthProvider>
          </AppearanceProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AppearanceProvider>
          <GoogleOAuthProvider clientId={clientId}>
            <ToastProvider />
            <Head>
              <title>Equestrian Events</title>
              <link rel="icon" type="image/png" href="/logo_new.png" />
            </Head>
            <ProtectedRoute>
              <Layout>
                <BoneyardSkeleton name={`page-${normalizeRoutePath(routeLoadingPath).replace(/\//g, '-') || 'dashboard'}`} loading={isRouteLoading}>
                  {isRouteLoading ? (
                    <PageSkeleton variant={getProtectedSkeletonVariant(routeLoadingPath)} />
                  ) : (
                    <Component {...pageProps} />
                  )}
                </BoneyardSkeleton>
              </Layout>
            </ProtectedRoute>
          </GoogleOAuthProvider>
        </AppearanceProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

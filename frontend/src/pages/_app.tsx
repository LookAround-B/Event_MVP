import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { AppearanceProvider } from '@/contexts/AppearanceContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/lib/protected-route';
import ToastProvider from '@/components/ToastProvider';
import { AppShellSkeleton } from '@/components/AppShellSkeleton';
import { PageSkeleton } from '@/components/PageSkeleton';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import '@/styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const PUBLIC_ROUTES = ['/auth/login', '/auth/signup', '/pending-approval', '/complete-profile', '/'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const routeLoadingStartedAt = useRef<number | null>(null);
  const routeLoadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientId = '244506553129-rbtnjflpop9gtcfpjs0gbesdvnos5hro.apps.googleusercontent.com';
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
    };

    const handleStart = (url: string) => {
      if (url !== router.asPath) {
        clearPendingTimeout();
        routeLoadingStartedAt.current = Date.now();
        setIsRouteLoading(true);
      }
    };
    const handleStop = () => {
      clearPendingTimeout();
      const startedAt = routeLoadingStartedAt.current;
      const minVisibleMs = 180;
      const elapsed = startedAt ? Date.now() - startedAt : minVisibleMs;
      const remaining = Math.max(0, minVisibleMs - elapsed);

      routeLoadingTimeout.current = setTimeout(() => {
        setIsRouteLoading(false);
        routeLoadingStartedAt.current = null;
        routeLoadingTimeout.current = null;
      }, remaining);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleStop);
    router.events.on('routeChangeError', handleStop);

    return () => {
      clearPendingTimeout();
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
              <Head><title>Equestrian Events</title></Head>
              {isRouteLoading ? <PageSkeleton variant="public" /> : <Component {...pageProps} />}
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
            <Head><title>Equestrian Events</title></Head>
            <ProtectedRoute>
              {isRouteLoading ? (
                <AppShellSkeleton />
              ) : (
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              )}
            </ProtectedRoute>
          </GoogleOAuthProvider>
        </AppearanceProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/lib/protected-route';
import ToastProvider from '@/components/ToastProvider';
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

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  const clientId = '244506553129-rbtnjflpop9gtcfpjs0gbesdvnos5hro.apps.googleusercontent.com';
  const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname);

  if (isPublicRoute) {
    return (
      <QueryClientProvider client={queryClient}>
        <GoogleOAuthProvider clientId={clientId}>
          <ToastProvider />
          <Head><title>Equestrian Events</title></Head>
          <Component {...pageProps} />
        </GoogleOAuthProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={clientId}>
        <ToastProvider />
        <Head><title>Equestrian Events</title></Head>
        <ProtectedRoute>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ProtectedRoute>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

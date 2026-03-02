import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/lib/protected-route';
import '@/styles/globals.css';

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
      <GoogleOAuthProvider clientId={clientId}>
        <Component {...pageProps} />
      </GoogleOAuthProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ProtectedRoute>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ProtectedRoute>
    </GoogleOAuthProvider>
  );
}

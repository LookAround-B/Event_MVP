import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const token = Cookies.get('authToken');
    
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Validate token is still valid
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      // Decode payload (middle part)
      const payload = JSON.parse(
        Buffer.from(tokenParts[1], 'base64').toString('utf-8')
      );
      
      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        Cookies.remove('authToken');
        router.push('/auth/login');
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      Cookies.remove('authToken');
      router.push('/auth/login');
    }
  }, [isClient, router]);

  // Show nothing during SSR
  if (!isClient || isAuthorized === null) {
    return null;
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

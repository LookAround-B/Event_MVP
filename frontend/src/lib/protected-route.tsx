import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { AppShellSkeleton } from '@/components/AppShellSkeleton';

interface DecodedToken {
  id: string;
  email: string;
  role?: string;
  isApproved?: boolean;
  profileComplete?: boolean;
  iat: number;
  exp: number;
}

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
      setIsAuthorized(false);
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
      ) as DecodedToken;
      
      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        Cookies.remove('authToken');
        setIsAuthorized(false);
        router.push('/auth/login');
        return;
      }

      // Check if profile is complete (but skip if user is already approved)
      if (!payload.profileComplete && !payload.isApproved) {
        setIsAuthorized(false);
        router.push('/complete-profile');
        return;
      }

      // Check if user is approved
      if (!payload.isApproved) {
        setIsAuthorized(false);
        router.push('/pending-approval');
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      Cookies.remove('authToken');
      setIsAuthorized(false);
      router.push('/auth/login');
    }
  }, [isClient, router]);

  // Show nothing during SSR
  if (!isClient || isAuthorized === null) {
    return <AppShellSkeleton />;
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

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
  allowedRoles?: Array<'admin' | 'club' | 'rider'>;
}

let authCache: boolean | null = null;

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return authCache;
  });
  const [isClient, setIsClient] = useState(typeof window !== 'undefined');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const rejectAccess = (redirectTo: string) => {
      authCache = false;
      setIsAuthorized(false);
      router.replace(redirectTo);
    };

    if (authCache === true) {
      setIsAuthorized(true);
    }

    const token = Cookies.get('authToken');
    
    if (!token) {
      rejectAccess('/rider/login');
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
        rejectAccess('/rider/login');
        return;
      }

      // Check if profile is complete (but skip if user is already approved)
      if (!payload.profileComplete && !payload.isApproved) {
        rejectAccess('/complete-profile');
        return;
      }

      // Check if user is approved
      if (!payload.isApproved) {
        rejectAccess('/pending-approval');
        return;
      }

      if (allowedRoles && (!payload.role || !allowedRoles.includes(payload.role as 'admin' | 'club' | 'rider'))) {
        rejectAccess('/dashboard');
        return;
      }

      authCache = true;
      setIsAuthorized(true);
    } catch (error) {
      Cookies.remove('authToken');
      rejectAccess('/rider/login');
    }
  }, [allowedRoles, isClient, router, router.asPath]);

  // Show nothing during SSR
  if (!isClient || isAuthorized === null) {
    return <AppShellSkeleton />;
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

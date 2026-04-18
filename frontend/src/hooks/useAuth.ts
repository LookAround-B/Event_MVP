import Cookies from 'js-cookie';
import { useMemo } from 'react';

interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'club' | 'rider';
  isApproved: boolean;
  profileComplete: boolean;
}

interface UseAuthResult {
  user: AuthUser | null;
  role: 'admin' | 'club' | 'rider' | null;
  isAdmin: boolean;
  isClub: boolean;
  isRider: boolean;
  logout: () => void;
}

function decodeToken(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    if (!payload || typeof payload !== 'object') return null;
    return {
      id: payload.id ?? '',
      email: payload.email ?? '',
      role: payload.role ?? 'rider',
      isApproved: payload.isApproved ?? false,
      profileComplete: payload.profileComplete ?? false,
    };
  } catch {
    return null;
  }
}

export function useAuth(): UseAuthResult {
  const user = useMemo<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const token = Cookies.get('authToken');
    if (!token) return null;
    return decodeToken(token);
  }, []);

  const logout = () => {
    Cookies.remove('authToken');
    window.location.href = '/rider/login';
  };

  const role = user?.role ?? null;

  return {
    user,
    role,
    isAdmin: role === 'admin',
    isClub: role === 'club',
    isRider: role === 'rider',
    logout,
  };
}

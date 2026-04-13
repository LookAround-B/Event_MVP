import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

function getImageUrl(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  return `/uploads/${url.replace(/^\/uploads\//, '')}`;
}

export function useUserProfile() {
  const { data } = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await api.get('/api/users/profile');
      return res.data.data as UserProfile;
    },
    staleTime: 60_000,
    retry: false,
  });

  const imageUrl = getImageUrl(data?.imageUrl);
  const displayName =
    data?.firstName && data?.lastName
      ? `${data.firstName} ${data.lastName}`
      : data?.email ?? '';
  const initial = displayName.charAt(0).toUpperCase() || 'U';

  return { profile: data, imageUrl, displayName, initial };
}

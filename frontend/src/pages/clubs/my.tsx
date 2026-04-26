import { useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/api';
import { AppShellSkeleton } from '@/components/AppShellSkeleton';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';

export default function MyClub() {
  const router = useRouter();

  useEffect(() => {
    api.get('/api/clubs/my')
      .then((res) => {
        const clubId = res.data?.data?.id;
        if (clubId) {
          router.replace(`/clubs/${clubId}`);
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => {
        router.replace('/dashboard');
      });
  }, [router]);

  return <AppShellSkeleton />;
}

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { PageSkeleton } from '@/components/PageSkeleton';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';

export default function Home() {
  const router = useRouter();
  const [isClient, setIsClient] = React.useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const token = localStorage.getItem('authToken');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/auth/login');
    }
  }, [isClient, router]);

  return (
    <BoneyardSkeleton name="home-page" loading={true}>
      <PageSkeleton variant="public" />
    </BoneyardSkeleton>
  );
}

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { PageSkeleton } from '@/components/PageSkeleton';

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

  return <PageSkeleton variant="public" />;
}

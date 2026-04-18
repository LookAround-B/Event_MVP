import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { PageSkeleton } from '@/components/PageSkeleton';

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/rider/login');
  }, [router]);

  return <PageSkeleton variant="public" />;
}

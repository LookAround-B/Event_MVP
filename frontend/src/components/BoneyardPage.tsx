import React from 'react';
import { Skeleton } from 'boneyard-js/react';

interface BoneyardPageProps {
  /** Unique name for this page's skeleton snapshot */
  name: string;
  /** Whether the page is in a loading state */
  loading?: boolean;
  /** Fallback content shown while loading (e.g. a PageSkeleton) */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Wrapper component that applies boneyard-js skeleton loading to any page.
 * When `loading` is true, boneyard renders a shimmer skeleton based on
 * the previously captured DOM layout. Falls back to manual skeleton if
 * bone data hasn't been generated yet.
 */
export function BoneyardPage({ name, loading = false, fallback, children }: BoneyardPageProps) {
  return (
    <Skeleton name={name} loading={loading}>
      {loading && fallback ? fallback : children}
    </Skeleton>
  );
}

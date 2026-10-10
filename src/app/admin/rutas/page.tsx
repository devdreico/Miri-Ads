import { Suspense } from 'react';
import { RouteManager } from '@/components/admin/RouteManager';
import { RouteManagerSkeleton } from '@/components/admin/skeletons';

export default function RutasPage() {
  return (
    <Suspense fallback={<RouteManagerSkeleton />}>
      <RouteManager />
    </Suspense>
  );
}

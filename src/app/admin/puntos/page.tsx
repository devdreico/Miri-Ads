import { Suspense } from 'react';
import { PointsManager } from '@/components/admin/PointsManager';
import { PointsManagerSkeleton } from '@/components/admin/skeletons';

export default function PuntosPage() {
  return (
    <Suspense fallback={<PointsManagerSkeleton />}>
      <PointsManager />
    </Suspense>
  );
}

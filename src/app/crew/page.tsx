import { Suspense } from 'react';
import { RouteBoard } from '@/components/crew/RouteBoard';
import { CrewRouteSkeleton } from '@/components/crew/skeletons';

export default function CrewRoutesPage() {
  return (
    <Suspense fallback={<CrewRouteSkeleton />}>
      <RouteBoard />
    </Suspense>
  );
}

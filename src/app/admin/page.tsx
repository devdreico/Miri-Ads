import { Suspense } from 'react';
import { CrewRanking } from '@/components/admin/CrewRanking';
import { CyclePipeline } from '@/components/admin/CyclePipeline';
import { DashboardMap } from '@/components/admin/DashboardMap';
import { EvidenceQueue } from '@/components/admin/EvidenceQueue';
import { KpiGrid } from '@/components/admin/KpiGrid';
import {
  CyclePipelineSkeleton,
  EvidenceQueueSkeleton,
  KpiGridSkeleton,
  MapSkeleton,
  RankingSkeleton,
} from '@/components/admin/skeletons';

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<KpiGridSkeleton />}>
        <KpiGrid />
      </Suspense>
      <Suspense fallback={<CyclePipelineSkeleton />}>
        <CyclePipeline />
      </Suspense>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Suspense fallback={<MapSkeleton />}>
          <DashboardMap />
        </Suspense>
        <Suspense fallback={<EvidenceQueueSkeleton />}>
          <EvidenceQueue />
        </Suspense>
      </div>
      <Suspense fallback={<RankingSkeleton />}>
        <CrewRanking />
      </Suspense>
    </div>
  );
}

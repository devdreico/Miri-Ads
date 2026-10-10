import { Skeleton } from '@/components/ui';

export function AdminChromeSkeleton() {
  return (
    <div className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-4 border-r border-white/8 bg-ink-raised/60 p-5 lg:flex">
      <Skeleton className="h-10 w-36" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
      <Skeleton className="mt-auto h-24 w-full" />
    </div>
  );
}

export function AdminHeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/8 px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-44" />
        <Skeleton className="h-8 w-72" />
      </div>
      <Skeleton className="h-8 w-44" />
    </div>
  );
}

export function KpiGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full" />
      ))}
    </div>
  );
}

export function CyclePipelineSkeleton() {
  return <Skeleton className="h-56 w-full" />;
}

export function MapSkeleton({ className }: { className?: string }) {
  return <Skeleton className={`h-[420px] w-full ${className ?? ''}`} />;
}

export function EvidenceQueueSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-56 w-full" />
      ))}
    </div>
  );
}

export function RankingSkeleton() {
  return <Skeleton className="h-72 w-full" />;
}

export function EvidenceBoardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-72 w-full" />
      ))}
    </div>
  );
}

export function RouteManagerSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function PointsManagerSkeleton() {
  return <Skeleton className="h-[640px] w-full" />;
}

export function SupplyInventorySkeleton() {
  return <Skeleton className="h-96 w-full" />;
}

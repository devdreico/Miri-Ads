import { Skeleton } from '@/components/ui';

export function CrewTopbarSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/8 bg-ink-raised/80 px-4 py-3">
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-9 w-40" />
    </div>
  );
}

export function CrewRouteSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export function CrewRankingSkeleton() {
  return <Skeleton className="h-[480px] w-full" />;
}

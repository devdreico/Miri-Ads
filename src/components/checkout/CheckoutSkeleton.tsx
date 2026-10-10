import { GlassPanel, Skeleton, SkeletonText } from '@/components/ui';

export function CheckoutSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <div role="status" aria-label="Cargando el estado del pedido" className="flex flex-col gap-6">
        <span className="sr-only">Cargando el estado del pedido…</span>
        <GlassPanel className="flex flex-col gap-6 p-6 sm:p-9">
          <Skeleton className="h-6 w-40" rounded="full" />
          <Skeleton className="h-12 w-3/4" />
          <SkeletonText lines={5} />
        </GlassPanel>
        <GlassPanel className="flex flex-col gap-6 p-6 sm:p-9">
          <Skeleton className="h-5 w-32" rounded="full" />
          <SkeletonText lines={4} />
        </GlassPanel>
      </div>
      <GlassPanel className="flex flex-col gap-6 p-6 sm:p-9">
        <Skeleton className="h-6 w-48" rounded="full" />
        <Skeleton className="h-24 w-full" />
        <SkeletonText lines={6} />
        <Skeleton className="h-14 w-full" rounded="xl" />
      </GlassPanel>
    </div>
  );
}

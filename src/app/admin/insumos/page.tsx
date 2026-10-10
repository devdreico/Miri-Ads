import { Suspense } from 'react';
import { SupplyInventory } from '@/components/admin/SupplyInventory';
import { SupplyInventorySkeleton } from '@/components/admin/skeletons';

export default function InsumosPage() {
  return (
    <Suspense fallback={<SupplyInventorySkeleton />}>
      <SupplyInventory />
    </Suspense>
  );
}

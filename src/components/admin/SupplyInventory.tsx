import { db } from '@/lib/db';
import { getCurrentCycle } from './data';
import {
  SupplyInventoryClient,
  type SupplyDto,
  type SupplySummaryDto,
} from './SupplyInventoryClient';

export async function SupplyInventory() {
  const cycle = await getCurrentCycle();
  const supplies = await db.supplyItem.findMany({ orderBy: { name: 'asc' } });
  const assignments = cycle
    ? await db.supplyAssignment.findMany({
        where: { cycleId: cycle.id },
        include: { crew: { select: { handle: true } } },
      })
    : [];

  const supplyDtos: SupplyDto[] = supplies.map((supply) => ({
    id: supply.id,
    name: supply.name,
    unit: supply.unit,
    stock: supply.stock,
    minStock: supply.minStock,
  }));

  const grouped = new Map<string, SupplySummaryDto>();
  for (const assignment of assignments) {
    const current = grouped.get(assignment.crew.handle) ?? {
      crewHandle: assignment.crew.handle,
      totalQuantity: 0,
      totalReturned: 0,
      lines: 0,
    };
    current.totalQuantity += assignment.quantity;
    current.totalReturned += assignment.returned ?? 0;
    current.lines += 1;
    grouped.set(assignment.crew.handle, current);
  }

  return <SupplyInventoryClient supplies={supplyDtos} summary={[...grouped.values()]} />;
}

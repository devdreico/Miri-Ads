import { GlassPanel } from '@/components/ui';
import { db } from '@/lib/db';
import { getCurrentCycle } from './data';
import {
  RouteManagerClient,
  type CrewOption,
  type RouteDto,
  type RouteStopDto,
} from './RouteManagerClient';
import { SupplyAssignPanel, type SupplyAssignmentDto, type SupplyOption } from './SupplyAssignPanel';

export async function RouteManager() {
  const cycle = await getCurrentCycle();
  const [routeRows, crewRows, supplyRows] = await Promise.all([
    db.route.findMany({
      where: cycle ? { cycleId: cycle.id } : undefined,
      orderBy: { code: 'asc' },
      include: {
        crew: { include: { user: { select: { name: true } } } },
        stops: {
          orderBy: { order: 'asc' },
          include: { evidences: { orderBy: { capturedAt: 'desc' }, take: 1 } },
        },
      },
    }),
    db.crewProfile.findMany({
      orderBy: { score: 'desc' },
      include: { user: { select: { name: true } } },
    }),
    db.supplyItem.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const crews: CrewOption[] = crewRows.map((crew) => ({
    id: crew.id,
    handle: crew.handle,
    name: crew.user.name,
  }));

  const routes: RouteDto[] = routeRows.map((route) => {
    const stops: RouteStopDto[] = route.stops.map((stop) => ({
      id: stop.id,
      order: stop.order,
      label: stop.label,
      address: stop.address,
      lat: stop.lat,
      lng: stop.lng,
      kind: stop.kind,
      quantity: stop.quantity,
      status: stop.status,
      doneAt: stop.doneAt ? stop.doneAt.toISOString() : null,
      evidenceUrl: stop.evidences[0]?.fileUrl ?? null,
      evidenceStatus: stop.evidences[0]?.status ?? null,
    }));
    return {
      id: route.id,
      code: route.code,
      name: route.name,
      date: route.date ? route.date.toISOString() : null,
      status: route.status,
      distanceM: route.distanceM,
      estimatedQty: route.estimatedQty,
      notes: route.notes,
      crewId: route.crewId,
      crewLabel: route.crew ? `${route.crew.user.name} (${route.crew.handle})` : 'Sin asignar',
      totalStops: stops.length,
      doneStops: stops.filter((stop) => stop.status === 'DONE').length,
      stops,
    };
  });

  const supplies: SupplyOption[] = supplyRows.map((supply) => ({
    id: supply.id,
    name: supply.name,
    unit: supply.unit,
  }));

  const assignments: SupplyAssignmentDto[] = cycle
    ? (
        await db.supplyAssignment.findMany({
          where: { cycleId: cycle.id },
          orderBy: { createdAt: 'desc' },
          include: {
            supply: { select: { name: true, unit: true } },
            crew: { select: { handle: true } },
          },
        })
      ).map((assignment) => ({
        id: assignment.id,
        supplyName: assignment.supply.name,
        supplyUnit: assignment.supply.unit,
        crewHandle: assignment.crew.handle,
        quantity: assignment.quantity,
        returned: assignment.returned,
      }))
    : [];

  return (
    <div className="flex flex-col gap-6">
      <RouteManagerClient routes={routes} crews={crews} />
      {cycle ? (
        <SupplyAssignPanel supplies={supplies} crews={crews} assignments={assignments} />
      ) : (
        <GlassPanel className="p-6">
          <p className="text-sm text-gray-400">No hay un ciclo activo para asignar insumos.</p>
        </GlassPanel>
      )}
    </div>
  );
}

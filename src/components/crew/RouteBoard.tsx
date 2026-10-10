import { db } from '@/lib/db';
import { getCurrentCrewUser } from './demo-session';
import { RouteBoardClient, type CrewRouteDto, type CrewStopDto } from './RouteBoardClient';

export async function RouteBoard() {
  const session = await getCurrentCrewUser();
  const cycle = await db.batchCycle.findFirst({ orderBy: { weekStart: 'desc' } });

  const scoped = await db.route.findMany({
    where: { crewId: session.crew.id, ...(cycle ? { cycleId: cycle.id } : {}) },
    orderBy: { code: 'asc' },
    include: {
      stops: {
        orderBy: { order: 'asc' },
        include: { evidences: { orderBy: { capturedAt: 'desc' }, take: 1 } },
      },
    },
  });
  const rows =
    scoped.length > 0
      ? scoped
      : await db.route.findMany({
          where: { crewId: session.crew.id },
          orderBy: { code: 'asc' },
          include: {
            stops: {
              orderBy: { order: 'asc' },
              include: { evidences: { orderBy: { capturedAt: 'desc' }, take: 1 } },
            },
          },
        });

  const routes: CrewRouteDto[] = rows.map((route) => {
    const stops: CrewStopDto[] = route.stops.map((stop) => ({
      id: stop.id,
      order: stop.order,
      label: stop.label,
      address: stop.address,
      lat: stop.lat,
      lng: stop.lng,
      kind: stop.kind,
      quantity: stop.quantity,
      status: stop.status,
      evidenceUrl: stop.evidences[0]?.fileUrl ?? null,
    }));
    return {
      id: route.id,
      code: route.code,
      name: route.name,
      date: route.date ? route.date.toISOString() : null,
      status: route.status,
      stops,
    };
  });

  return <RouteBoardClient routes={routes} uploaderId={session.user.id} />;
}

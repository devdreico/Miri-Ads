import { db } from '@/lib/db';

export interface CycleLite {
  id: string;
  weekStart: string;
  weekEnd: string;
  printDate: string | null;
  distributeDate: string | null;
  phase: string;
  cityId: string;
}

export async function getCurrentCycle(cityId?: string | null): Promise<CycleLite | null> {
  const cycle = await db.batchCycle.findFirst({
    where: cityId ? { cityId } : undefined,
    orderBy: { weekStart: 'desc' },
  });
  if (!cycle) return null;
  return {
    id: cycle.id,
    weekStart: cycle.weekStart.toISOString(),
    weekEnd: cycle.weekEnd.toISOString(),
    printDate: cycle.printDate ? cycle.printDate.toISOString() : null,
    distributeDate: cycle.distributeDate ? cycle.distributeDate.toISOString() : null,
    phase: cycle.phase,
    cityId: cycle.cityId,
  };
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number): number => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function zoneRingOf(polygon: unknown): number[][] {
  if (!polygon || typeof polygon !== 'object' || Array.isArray(polygon)) return [];
  const candidate = polygon as { type?: unknown; coordinates?: unknown };
  if (candidate.type !== 'Polygon' || !Array.isArray(candidate.coordinates)) return [];
  const ring = candidate.coordinates[0];
  if (!Array.isArray(ring)) return [];
  return ring.filter(
    (corner): corner is number[] => Array.isArray(corner) && corner.length >= 2,
  );
}

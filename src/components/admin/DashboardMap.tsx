import { db } from '@/lib/db';
import { MapPanel } from './MapPanel';
import { zoneRingOf } from './data';

export async function DashboardMap() {
  const [points, zones] = await Promise.all([
    db.staticPoint.findMany({ orderBy: { name: 'asc' } }),
    db.allowedZone.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <MapPanel
      className="h-[420px] w-full"
      points={points.map((point) => ({
        id: point.id,
        name: point.name,
        address: point.address,
        lat: point.lat,
        lng: point.lng,
        status: point.status,
        extra: point.partnerName ?? undefined,
      }))}
      zones={zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        status: zone.status,
        ring: zoneRingOf(zone.polygon),
      }))}
    />
  );
}

import { db } from '@/lib/db';
import { NETWORK_NODES } from '@/lib/palette';
import { zoneRingOf } from './data';
import { PointsManagerClient, type PointDto, type ZoneDto } from './PointsManagerClient';

export async function PointsManager() {
  const [points, zones] = await Promise.all([
    db.staticPoint.findMany({ orderBy: { name: 'asc' } }),
    db.allowedZone.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const lima = NETWORK_NODES.find((node) => node.hub) ?? NETWORK_NODES[0];
  const center: [number, number] = lima ? [lima.lat, lima.lng] : [-12.05, -77.04];

  const pointDtos: PointDto[] = points.map((point) => ({
    id: point.id,
    name: point.name,
    address: point.address,
    lat: point.lat,
    lng: point.lng,
    partnerName: point.partnerName,
    surface: point.surface,
    status: point.status,
    notes: point.notes,
  }));

  const zoneDtos: ZoneDto[] = zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    status: zone.status,
    notes: zone.notes,
    ring: zoneRingOf(zone.polygon),
  }));

  return <PointsManagerClient points={pointDtos} zones={zoneDtos} center={center} />;
}

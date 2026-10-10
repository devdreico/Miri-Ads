import Link from 'next/link';
import { GlassPanel } from '@/components/ui';
import { db } from '@/lib/db';
import { haversineMeters } from './data';
import { EvidenceCard, type EvidenceCardDto } from './EvidenceCard';

export async function EvidenceQueue() {
  const records = await db.evidence.findMany({
    where: { status: 'PENDING' },
    orderBy: { capturedAt: 'desc' },
    take: 4,
    include: {
      uploader: { select: { name: true } },
      stop: { select: { label: true, lat: true, lng: true, route: { select: { code: true } } } },
      point: { select: { name: true, lat: true, lng: true } },
    },
  });

  const items: EvidenceCardDto[] = records.map((record) => {
    const meta = (record.metadata ?? null) as {
      offRoute?: boolean;
      watermark?: { text?: string };
      hash?: string;
    } | null;
    let distanceM: number | null = null;
    if (record.stop && record.lat !== null && record.lng !== null) {
      distanceM = Math.round(haversineMeters(record.lat, record.lng, record.stop.lat, record.stop.lng));
    } else if (record.point && record.lat !== null && record.lng !== null) {
      distanceM = Math.round(haversineMeters(record.lat, record.lng, record.point.lat, record.point.lng));
    }
    return {
      id: record.id,
      kind: record.kind,
      fileUrl: record.fileUrl,
      status: record.status,
      rejectReason: record.rejectReason,
      lat: record.lat,
      lng: record.lng,
      accuracyM: record.accuracyM,
      capturedAt: record.capturedAt ? record.capturedAt.toISOString() : null,
      uploaderName: record.uploader.name,
      targetLabel: record.stop
        ? `${record.stop.label}${record.stop.route ? ` · ${record.stop.route.code}` : ''}`
        : (record.point?.name ?? 'Punto estático'),
      hash: meta?.hash ?? null,
      offRoute: meta?.offRoute === true,
      distanceM,
      watermark: meta?.watermark?.text ?? null,
    };
  });

  return (
    <GlassPanel className="flex h-full flex-col gap-4 p-5" intensity={1.1}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gray-500">
            Cola de evidencias
          </p>
          <h2 className="mt-1 font-display text-xl text-paper">Pendientes de revisión</h2>
        </div>
        <Link
          href="/admin/evidencias"
          className="text-xs font-medium text-aqua underline-offset-4 hover:underline"
        >
          Ver todas
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/12 px-4 py-10 text-center text-sm text-gray-500">
          No hay evidencias pendientes. ¡Buen trabajo!
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <EvidenceCard key={item.id} evidence={item} compact />
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

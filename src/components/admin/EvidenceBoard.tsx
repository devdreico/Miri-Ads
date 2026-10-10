import Link from 'next/link';
import { Badge } from '@/components/ui';
import { db } from '@/lib/db';
import { haversineMeters } from './data';
import { EvidenceGrid } from './EvidenceGrid';
import type { EvidenceCardDto } from './EvidenceCard';

const FILTERS = [
  { key: 'ALL', label: 'Todas' },
  { key: 'PENDING', label: 'Pendientes' },
  { key: 'APPROVED', label: 'Aprobadas' },
  { key: 'REJECTED', label: 'Rechazadas' },
] as const;

type Estado = (typeof FILTERS)[number]['key'];

function parseEstado(value: string | string[] | undefined): Estado {
  const single = Array.isArray(value) ? value[0] : value;
  return single === 'PENDING' || single === 'APPROVED' || single === 'REJECTED' ? single : 'ALL';
}

export async function EvidenceBoard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const estado = parseEstado(params.estado);

  const records = await db.evidence.findMany({
    where: estado === 'ALL' ? {} : { status: estado },
    orderBy: { capturedAt: 'desc' },
    include: {
      uploader: { select: { name: true } },
      stop: {
        select: {
          label: true,
          lat: true,
          lng: true,
          route: { select: { code: true, name: true, crew: { select: { handle: true } } } },
        },
      },
      point: { select: { name: true, lat: true, lng: true } },
    },
  });

  const grouped = await db.evidence.groupBy({ by: ['status'], _count: { _all: true } });
  const countOf = (status: string): number =>
    grouped.find((entry) => entry.status === status)?._count._all ?? 0;

  const items: EvidenceCardDto[] = records.map((record) => {
    const meta = (record.metadata ?? null) as {
      offRoute?: boolean;
      watermark?: { text?: string };
      hash?: string;
      device?: string;
    } | null;
    let distanceM: number | null = null;
    if (record.lat !== null && record.lng !== null) {
      if (record.stop) {
        distanceM = Math.round(
          haversineMeters(record.lat, record.lng, record.stop.lat, record.stop.lng),
        );
      } else if (record.point) {
        distanceM = Math.round(
          haversineMeters(record.lat, record.lng, record.point.lat, record.point.lng),
        );
      }
    }
    const crewHandle = record.stop?.route?.crew?.handle ?? null;
    const targetLabel = record.stop
      ? `${record.stop.label}${record.stop.route ? ` · ${record.stop.route.code}` : ''}${
          crewHandle ? ` · ${crewHandle}` : ''
        }`
      : (record.point?.name ?? 'Punto estático');
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
      targetLabel,
      hash: meta?.hash ?? null,
      offRoute: meta?.offRoute === true,
      distanceM,
      watermark: meta?.watermark?.text ?? null,
    };
  });

  const counts: Record<Estado, number> = {
    ALL: countOf('PENDING') + countOf('APPROVED') + countOf('REJECTED'),
    PENDING: countOf('PENDING'),
    APPROVED: countOf('APPROVED'),
    REJECTED: countOf('REJECTED'),
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gray-500">
            Validación anti-fraude
          </p>
          <h2 className="mt-1 font-display text-2xl text-paper">Evidencias de campo</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const active = filter.key === estado;
            return (
              <Link
                key={filter.key}
                href={filter.key === 'ALL' ? '/admin/evidencias' : `/admin/evidencias?estado=${filter.key}`}
                className={`inline-flex h-9 items-center rounded-xl border px-3 text-xs font-medium transition-colors ${
                  active
                    ? 'border-aqua/50 bg-aqua/10 text-aqua'
                    : 'border-white/12 bg-white/4 text-gray-400 hover:border-aqua/30 hover:text-paper'
                }`}
              >
                {filter.label}
                <span className="ml-2 text-[10px] opacity-70">{counts[filter.key]}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge tone="neutral">Total en pantalla: {items.length}</Badge>
        <Badge tone="neutral">
          Revisadas: {counts.APPROVED + counts.REJECTED}
        </Badge>
        <Badge tone="aqua">Umbral de distancia: 200 m</Badge>
      </div>

      <EvidenceGrid items={items} />
    </div>
  );
}

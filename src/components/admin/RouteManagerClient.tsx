'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Badge, GlassPanel } from '@/components/ui';
import {
  advanceRouteStatus,
  assignRouteCrew,
  closeRoute,
} from '@/lib/actions/admin';
import { formatDate } from '@/lib/format';

export interface RouteStopDto {
  id: string;
  order: number;
  label: string;
  address: string | null;
  lat: number;
  lng: number;
  kind: string;
  quantity: number;
  status: string;
  doneAt: string | null;
  evidenceUrl: string | null;
  evidenceStatus: string | null;
}

export interface RouteDto {
  id: string;
  code: string;
  name: string;
  date: string | null;
  status: string;
  distanceM: number | null;
  estimatedQty: number | null;
  notes: string | null;
  crewId: string | null;
  crewLabel: string;
  totalStops: number;
  doneStops: number;
  stops: RouteStopDto[];
}

export interface CrewOption {
  id: string;
  handle: string;
  name: string;
}

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planificada',
  DISTRIBUTED: 'Distribuida',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
  FAILED: 'Fallida',
};

const STOP_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  DONE: 'Hecha',
  MISSED: 'Omitida',
  REJECTED: 'Rechazada',
};

const KIND_LABELS: Record<string, string> = {
  FLYER: 'Volanteo',
  PASTE: 'Pegado',
  STICKER: 'Sticker',
  HANDBILL: 'Hoja',
};

function RouteCard({ route, crews }: { route: RouteDto; crews: CrewOption[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const progress = route.totalStops > 0 ? Math.round((route.doneStops / route.totalStops) * 100) : 0;

  const run = (task: () => Promise<{ ok: boolean; error?: string }>, success: string): void => {
    setMessage(null);
    startTransition(async () => {
      const result = await task();
      setMessage(result.ok ? success : (result.error ?? 'La operación falló.'));
      router.refresh();
    });
  };

  return (
    <GlassPanel className="flex flex-col gap-4 p-5" intensity={1.1}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg text-aqua">{route.code}</span>
            <Badge tone={route.status === 'COMPLETED' ? 'aqua' : 'neutral'}>
              {STATUS_LABELS[route.status] ?? route.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-paper">{route.name}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">
            {route.date ? formatDate(route.date) : 'Sin fecha'} ·{' '}
            {route.distanceM !== null ? `${(route.distanceM / 1000).toFixed(1)} km` : '—'} ·{' '}
            {route.estimatedQty ?? '—'} unidades estimadas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`crew-${route.id}`}>
            Crew asignada
          </label>
          <select
            id={`crew-${route.id}`}
            value={route.crewId ?? ''}
            disabled={isPending}
            onChange={(event) => {
              const value = event.target.value || null;
              run(() => assignRouteCrew(route.id, value), 'Crew reasignada.');
            }}
            className="h-10 rounded-xl border border-white/12 bg-ink/70 px-3 text-sm text-paper outline-none transition-colors hover:border-aqua/40 focus-visible:border-aqua disabled:opacity-60"
          >
            <option value="" className="bg-ink">
              Sin crew asignada
            </option>
            {crews.map((crew) => (
              <option key={crew.id} value={crew.id} className="bg-ink">
                {crew.name} ({crew.handle})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={isPending || route.status === 'COMPLETED'}
            onClick={() => run(() => advanceRouteStatus(route.id), 'Fase de ruta actualizada.')}
            className="h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-medium text-paper transition hover:border-aqua/40 hover:text-aqua disabled:opacity-50"
          >
            Avanzar fase
          </button>
          <button
            type="button"
            disabled={isPending || route.status === 'COMPLETED'}
            onClick={() =>
              run(() => closeRoute(route.id), 'Ruta cerrada con estadísticas recalculadas.')
            }
            className="h-10 rounded-xl bg-aqua px-3 text-xs font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
          >
            Cerrar ruta
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <span>
            {route.doneStops}/{route.totalStops} paradas completadas
          </span>
          <span className="tabular-nums text-aqua">{progress}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/6">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-aqua-deep to-aqua"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">Asignada a: {route.crewLabel}</Badge>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="inline-flex h-9 items-center rounded-lg border border-white/12 bg-white/5 px-3 text-xs font-medium text-gray-300 transition hover:border-aqua/40 hover:text-aqua"
        >
          {expanded ? 'Ocultar paradas' : `Ver ${route.stops.length} paradas`}
        </button>
        {message ? <Badge tone="aqua">{message}</Badge> : null}
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2 overflow-hidden"
          >
            {route.stops.map((stop) => (
              <li
                key={stop.id}
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/5 text-[11px] text-gray-300">
                  {stop.order}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-paper">{stop.label}</p>
                  <p className="truncate text-[11px] text-gray-500">
                    {stop.address ?? 'Sin dirección'} · {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)} ·{' '}
                    {KIND_LABELS[stop.kind] ?? stop.kind} · {stop.quantity} un
                  </p>
                </div>
                <Badge
                  tone={stop.status === 'DONE' ? 'aqua' : stop.status === 'PENDING' ? 'neutral' : 'dark'}
                  className="shrink-0 px-2 py-0.5 text-[9px]"
                >
                  {STOP_LABELS[stop.status] ?? stop.status}
                </Badge>
                {stop.evidenceUrl ? (
                  <span className="relative block h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10">
                    <Image
                      src={stop.evidenceUrl}
                      alt={`Evidencia de ${stop.label}`}
                      width={96}
                      height={72}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  </span>
                ) : (
                  <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/12 text-[9px] uppercase tracking-[0.12em] text-gray-600">
                    Sin ev.
                  </span>
                )}
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </GlassPanel>
  );
}

export function RouteManagerClient({
  routes,
  crews,
}: {
  routes: RouteDto[];
  crews: CrewOption[];
}) {
  if (routes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/12 px-6 py-16 text-center text-sm text-gray-500">
        El ciclo actual no tiene rutas planificadas.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {routes.map((route) => (
        <RouteCard key={route.id} route={route} crews={crews} />
      ))}
    </div>
  );
}

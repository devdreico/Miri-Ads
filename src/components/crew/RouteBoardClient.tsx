'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Badge, GlassPanel } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { CaptureEvidence } from './CaptureEvidence';

export interface CrewStopDto {
  id: string;
  order: number;
  label: string;
  address: string | null;
  lat: number;
  lng: number;
  kind: string;
  quantity: number;
  status: string;
  evidenceUrl: string | null;
}

export interface CrewRouteDto {
  id: string;
  code: string;
  name: string;
  date: string | null;
  status: string;
  stops: CrewStopDto[];
}

const KIND_LABELS: Record<string, string> = {
  FLYER: 'Volanteo',
  PASTE: 'Pegado',
  STICKER: 'Sticker',
  HANDBILL: 'Hoja',
};

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planificada',
  DISTRIBUTED: 'Distribuida',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
  FAILED: 'Fallida',
};

export function RouteBoardClient({
  routes,
  uploaderId,
}: {
  routes: CrewRouteDto[];
  uploaderId: string;
}) {
  const [routeId, setRouteId] = useState(routes[0]?.id ?? '');
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<string[]>([]);

  const route = useMemo(() => routes.find((item) => item.id === routeId) ?? routes[0], [routes, routeId]);
  const stops = useMemo(
    () =>
      route
        ? route.stops.map((stop) => ({
            ...stop,
            status: doneIds.includes(stop.id) ? 'DONE' : stop.status,
          }))
        : [],
    [route, doneIds],
  );
  const doneCount = stops.filter((stop) => stop.status === 'DONE').length;
  const progress = stops.length > 0 ? Math.round((doneCount / stops.length) * 100) : 0;
  const activeStop = stops.find((stop) => stop.id === activeStopId) ?? null;

  if (routes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/12 px-6 py-16 text-center text-sm text-gray-500">
        Aún no tienes rutas asignadas esta semana. El administrador de ciudad te asignará una pronto.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <GlassPanel className="flex flex-col gap-4 p-5" intensity={1.2}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">
              Mi jornada
            </p>
            <h1 className="mt-1 font-display text-2xl text-paper">Mis rutas</h1>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="crew-route-select" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
              Ruta activa
            </label>
            <select
              id="crew-route-select"
              value={routeId}
              onChange={(event) => {
                setRouteId(event.target.value);
                setActiveStopId(null);
              }}
              className="h-11 rounded-xl border border-white/12 bg-ink/70 px-3 text-sm text-paper outline-none transition-colors hover:border-aqua/40 focus-visible:border-aqua"
            >
              {routes.map((item) => (
                <option key={item.id} value={item.id} className="bg-ink">
                  {item.code} · {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {route ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="aqua">{route.code}</Badge>
            <Badge tone="neutral">{STATUS_LABELS[route.status] ?? route.status}</Badge>
            <Badge tone="neutral">{route.date ? formatDate(route.date) : 'Sin fecha'}</Badge>
          </div>
        ) : null}

        <div>
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>
              {doneCount}/{stops.length} paradas completadas
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
      </GlassPanel>

      <ul className="flex flex-col gap-3">
        {stops.map((stop) => {
          const isDone = stop.status === 'DONE';
          const isActive = stop.id === activeStopId;
          return (
            <li key={stop.id}>
              <GlassPanel
                className={`flex flex-col gap-3 p-4 transition-colors ${isActive ? 'border-aqua/40' : ''}`}
                intensity={isActive ? 1.5 : 1}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-display text-sm ${
                      isDone
                        ? 'border-aqua/50 bg-aqua/15 text-aqua'
                        : 'border-white/12 bg-white/5 text-gray-400'
                    }`}
                  >
                    {stop.order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-paper">{stop.label}</p>
                      <Badge tone={isDone ? 'aqua' : 'neutral'} className="px-2 py-0.5 text-[9px]">
                        {isDone ? 'Hecha' : stop.status === 'MISSED' ? 'Omitida' : 'Pendiente'}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
                      {stop.address ?? 'Sin dirección'} · {KIND_LABELS[stop.kind] ?? stop.kind} ·{' '}
                      {stop.quantity} unidades · {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
                    </p>
                  </div>
                  {stop.evidenceUrl ? (
                    <span className="relative block h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-white/10">
                      <Image
                        src={stop.evidenceUrl}
                        alt={`Evidencia de ${stop.label}`}
                        width={120}
                        height={90}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    </span>
                  ) : null}
                </div>

                {isDone ? null : (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveStopId(isActive ? null : stop.id)}
                      className="inline-flex h-10 items-center rounded-xl bg-aqua px-4 text-sm font-semibold text-ink shadow-glow-aqua transition hover:brightness-110"
                    >
                      Hecho
                    </button>
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {isActive && activeStop ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <CaptureEvidence
                        stop={activeStop}
                        uploaderId={uploaderId}
                        onClose={() => setActiveStopId(null)}
                        onSuccess={() => setDoneIds((current) => [...current, stop.id])}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </GlassPanel>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

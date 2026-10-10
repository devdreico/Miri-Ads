'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { motion } from 'motion/react';
import { Badge, GlassPanel } from '@/components/ui';
import { advanceCyclePhase, resetCycleWeek } from '@/lib/actions/admin';
import { formatDate } from '@/lib/format';

export interface CyclePipelineDto {
  id: string;
  weekStart: string;
  weekEnd: string;
  printDate: string | null;
  distributeDate: string | null;
  phase: string;
}

const STEPS = [
  { key: 'SALES', title: 'Semana de venta', caption: 'Lun a Vie' },
  { key: 'PRINTING', title: 'Sábado impresión', caption: 'Batch de imprenta' },
  { key: 'DISTRIBUTION', title: 'Domingo reparto', caption: 'Insumos a crews' },
  { key: 'DEPLOYMENT', title: 'Despliegue', caption: 'Lun a Vie con evidencias' },
] as const;

export function CyclePipelineClient({ cycle }: { cycle: CyclePipelineDto }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const currentIndex = STEPS.findIndex((step) => step.key === cycle.phase);
  const closing = cycle.phase === 'CLOSING';

  const run = (task: () => Promise<{ ok: boolean; error?: string }>, success: string): void => {
    setMessage(null);
    startTransition(async () => {
      const result = await task();
      if (result.ok) {
        setMessage(success);
        router.refresh();
      } else {
        setMessage(result.error ?? 'La operación falló.');
      }
    });
  };

  return (
    <GlassPanel className="p-5 sm:p-6" intensity={1.2}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gray-500">
            Ciclo batch semanal
          </p>
          <h2 className="mt-1 font-display text-xl text-paper">
            {formatDate(cycle.weekStart)} — {formatDate(cycle.weekEnd)}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {closing ? <Badge tone="aqua" dot>Cierre de semana</Badge> : null}
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(() => advanceCyclePhase(cycle.id), 'Fase del ciclo actualizada.')
            }
            className="inline-flex h-10 items-center rounded-xl bg-aqua px-4 text-sm font-semibold text-ink shadow-glow-aqua transition hover:brightness-110 disabled:opacity-60"
          >
            {isPending ? 'Aplicando…' : 'Avanzar fase'}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (!window.confirm('¿Reiniciar la semana del ciclo a lunes y fase de venta?')) return;
              run(() => resetCycleWeek(cycle.id), 'Semana reiniciada a lunes de venta.');
            }}
            className="inline-flex h-10 items-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-medium text-paper transition hover:border-aqua/50 hover:text-aqua disabled:opacity-60"
          >
            Reiniciar semana
          </button>
        </div>
      </div>

      <ol className="mt-6 grid gap-3 md:grid-cols-4">
        {STEPS.map((step, index) => {
          const active = index === currentIndex;
          const done = closing || (currentIndex >= 0 && index < currentIndex);
          return (
            <li key={step.key} className="relative">
              <div
                className={`flex h-full flex-col gap-2 rounded-xl border p-4 transition-colors ${
                  active
                    ? 'border-aqua/50 bg-aqua/10 shadow-glow-aqua'
                    : done
                      ? 'border-aqua/20 bg-white/4'
                      : 'border-white/10 bg-white/3'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                      active ? 'bg-aqua text-ink' : done ? 'bg-aqua/25 text-aqua' : 'bg-white/8 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">
                    {step.caption}
                  </span>
                </div>
                <p className={`font-display text-base ${active ? 'text-aqua' : 'text-paper'}`}>
                  {step.title}
                </p>
                {active ? (
                  <motion.span
                    layoutId="cycle-phase-active"
                    className="mt-auto h-0.5 rounded-full bg-aqua"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                ) : (
                  <span className="mt-auto h-0.5 rounded-full bg-white/6" />
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex flex-wrap gap-2">
        <Badge tone="neutral">Impresión: {cycle.printDate ? formatDate(cycle.printDate) : '—'}</Badge>
        <Badge tone="neutral">
          Reparto: {cycle.distributeDate ? formatDate(cycle.distributeDate) : '—'}
        </Badge>
        {message ? <Badge tone="aqua">{message}</Badge> : null}
      </div>
    </GlassPanel>
  );
}

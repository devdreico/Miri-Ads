'use client';

import { Badge, GlassPanel, Reveal } from '@/components/ui';
import { cx } from '@/components/ui/cx';
import { formatMoney } from '@/lib/format';
import { CADENCE_LABEL, planPrice, type Plan, type PlanCadence } from '@/lib/plans';
import { getSavings, useCadence } from './cadence-store';

const CADENCES: PlanCadence[] = ['monthly', 'quarterly', 'annual'];

const GUARANTEES = [
  'Sin permanencia ni letra chica',
  'Cancela cuando quieras',
  'Soporte humano por WhatsApp',
];

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="mt-0.5 h-4 w-4 shrink-0 text-aqua"
    >
      <path
        d="M3 8.4l3.3 3.3L13 4.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlanSummary({ plan }: { plan: Plan }) {
  const cadence = useCadence();
  const savings = getSavings(plan, cadence);
  const cadenceLabel = CADENCE_LABEL[cadence];

  return (
    <Reveal delay={0.05} className="h-full">
      <GlassPanel className="flex h-full flex-col gap-8 p-6 sm:p-9" intensity={1.4} glow>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="aqua" dot>
              Pack seleccionado
            </Badge>
            {plan.featured ? <Badge tone="neutral">Más elegido</Badge> : null}
          </div>
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-paper sm:text-4xl">
            {plan.name}
          </h2>
          <p className="text-base leading-relaxed text-gray-400">{plan.tagline}</p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-white/8 bg-white/4 p-5">
          <div className="flex flex-wrap items-end gap-3">
            <span className="font-display text-5xl font-semibold tracking-tight text-paper sm:text-6xl">
              {formatMoney(planPrice(plan, cadence) * 100, plan.currency)}
            </span>
            <span className="pb-2 text-sm font-medium uppercase tracking-[0.14em] text-aqua">
              {cadenceLabel.label}
            </span>
          </div>
          <p className="text-sm text-gray-400">{cadenceLabel.note}</p>
          {savings ? (
            <p className="text-sm font-medium text-aqua">
              Ahorras {formatMoney(savings * 100, plan.currency)} frente a pagar mes a mes
            </p>
          ) : null}
          <ul className="mt-2 grid gap-2 border-t border-white/8 pt-4 sm:grid-cols-3">
            {CADENCES.map((option) => (
              <li
                key={option}
                className={cx(
                  'flex flex-col rounded-lg border px-3 py-2 transition-colors',
                  option === cadence
                    ? 'border-aqua/50 bg-aqua/10 text-paper'
                    : 'border-white/8 bg-white/4 text-gray-400',
                )}
              >
                <span className="text-xs uppercase tracking-[0.14em]">
                  {CADENCE_LABEL[option].label}
                </span>
                <span className="font-display text-lg font-semibold">
                  {formatMoney(planPrice(plan, option) * 100, plan.currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Qué incluye tu pack
          </h2>
          <ul className="flex flex-col gap-3">
            {plan.deliverables.map((item) => (
              <li key={item.text} className="flex items-start gap-3 text-sm text-gray-300">
                <CheckIcon />
                <span className={item.highlight ? 'font-medium text-paper' : undefined}>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/4 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-aqua">
              Digital
            </span>
            <div className="flex flex-wrap gap-2">
              {plan.digital.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-ink-raised px-3 py-1 text-xs text-gray-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/4 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-300">
              Físico
            </span>
            <div className="flex flex-wrap gap-2">
              {plan.physical.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-ink-raised px-3 py-1 text-xs text-gray-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <ul className="flex flex-col gap-2 border-t border-white/8 pt-5 text-sm text-gray-400">
          {GUARANTEES.map((guarantee) => (
            <li key={guarantee} className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-aqua" aria-hidden="true" />
              {guarantee}
            </li>
          ))}
        </ul>
      </GlassPanel>
    </Reveal>
  );
}

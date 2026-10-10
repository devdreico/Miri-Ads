"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Badge,
  Counter,
  GlassPanel,
  MagneticButton,
  Reveal,
  SectionHeading,
  TiltCard,
} from "@/components/ui";
import {
  CADENCE_LABEL,
  PLANS,
  planPrice,
  type Plan,
  type PlanCadence,
} from "@/lib/plans";
import { DURATION, EASE_OUT_EXPO, viewportOnce } from "@/lib/motion";
import { CheckIcon, ShieldIcon, ClockIcon, ArrowIcon } from "./icons";

const CADENCES: PlanCadence[] = ["monthly", "quarterly", "annual"];

const PERIOD: Record<PlanCadence, string> = {
  monthly: "por mes",
  quarterly: "por trimestre",
  annual: "por año",
};

const MONTHS: Record<PlanCadence, number> = {
  monthly: 1,
  quarterly: 3,
  annual: 12,
};

const GUARANTEES = [
  { icon: ShieldIcon, text: "Soporte real por WhatsApp, sin bots" },
  { icon: ClockIcon, text: "Sin permanencia: pausa o cancela cuando quieras" },
  { icon: CheckIcon, text: "Reporte mensual de evidencias con GPS" },
];

function money(amount: number): string {
  return `$${amount.toLocaleString("es-ES")}`;
}

function PlanCard({
  plan,
  cadence,
  index,
}: {
  plan: Plan;
  cadence: PlanCadence;
  index: number;
}) {
  const price = planPrice(plan, cadence);
  const regular = plan.price.monthly * MONTHS[cadence];
  const saving = cadence !== "monthly" && regular > price;

  return (
    <div
      className={
        plan.featured ? "relative h-full md:scale-[1.03]" : "relative h-full"
      }
    >
      <Reveal delay={index * 0.1} className="h-full">
        <TiltCard
          className={
            plan.featured
              ? "h-full border-aqua/45 shadow-glow-aqua"
              : "h-full border-white/10"
          }
          intensity={plan.featured ? 0.8 : 0.6}
        >
          <GlassPanel
            glow
            intensity={plan.featured ? 1.4 : 1}
            className="flex h-full flex-col gap-6 p-6 sm:p-7"
          >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-aqua">
                {plan.name}
              </p>
              <p className="text-sm leading-snug text-gray-400">{plan.tagline}</p>
            </div>
            {plan.featured ? (
              <Badge tone="aqua" dot className="shrink-0">
                Más elegido
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-end gap-2">
              <span className="font-display text-2xl font-medium text-gray-400">$</span>
              <Counter
                key={cadence}
                to={price}
                duration={0.9}
                className="font-display text-5xl font-semibold leading-none text-paper sm:text-[3.4rem]"
              />
              <span className="pb-1.5 text-sm text-gray-400">{PERIOD[cadence]}</span>
            </div>
            <p className="text-xs text-gray-500">
              {saving ? (
                <>
                  <s className="text-gray-600">{money(regular)}</s> ·{" "}
                  <span className="text-aqua">{CADENCE_LABEL[cadence].note}</span>
                </>
              ) : (
                CADENCE_LABEL[cadence].note
              )}
            </p>
          </div>

          <p className="text-sm text-gray-400">{plan.audience}</p>

          <ul className="flex flex-col gap-3">
            {plan.deliverables.map((item) => (
              <li key={item.text} className="flex items-start gap-3 text-sm text-gray-300">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-aqua/40 bg-aqua/10 text-aqua">
                  <CheckIcon className="h-3 w-3" />
                </span>
                <span className={item.highlight ? "font-medium text-paper" : undefined}>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-col gap-4 border-t border-white/8 pt-5">
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
                Digital
              </p>
              <div className="flex flex-wrap gap-2">
                {plan.digital.map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-aqua">
                Físico
              </p>
              <div className="flex flex-wrap gap-2">
                {plan.physical.map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-aqua/30 bg-aqua/10 px-2 py-1 text-[11px] text-aqua"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <MagneticButton
              href={`/checkout/${plan.id}`}
              variant={plan.featured ? "primary" : "outline"}
              size="md"
              className="w-full gap-3"
            >
              {plan.cta}
              <ArrowIcon className="h-4 w-4" />
            </MagneticButton>
          </div>
          </GlassPanel>
        </TiltCard>
      </Reveal>
    </div>
  );
}

export default function Packs() {
  const [cadence, setCadence] = useState<PlanCadence>("monthly");

  return (
    <section
      id="packs"
      data-scene-stage="digital"
      className="relative scroll-mt-24 py-24 sm:py-32 lg:py-40"
    >
      <div className="container-page flex flex-col gap-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Miri Digital"
            title="Packs cerrados, resultados abiertos"
            description="Elige la cadencia: el mismo equipo, el mismo estándar de entrega y un mejor precio por comprometer más meses."
          />

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div
              role="group"
              aria-label="Cadencia de facturación"
              className="glass inline-flex rounded-full p-1.5"
            >
              {CADENCES.map((item) => {
                const active = item === cadence;
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCadence(item)}
                    className="relative rounded-full px-4 py-2 text-sm font-medium text-gray-400 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua sm:px-5"
                  >
                    {active ? (
                      <motion.span
                        layoutId="cadence-indicator"
                        className="absolute inset-0 rounded-full border border-aqua/45 bg-aqua/15 shadow-[0_0_24px_-8px_rgba(47,230,200,0.8)]"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        aria-hidden="true"
                      />
                    ) : null}
                    <span
                      className={active ? "relative z-10 text-aqua" : "relative z-10"}
                    >
                      {CADENCE_LABEL[item].label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500">{CADENCE_LABEL[cadence].note}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 lg:items-start lg:gap-5">
          {PLANS.map((plan, index) => (
            <PlanCard key={plan.id} plan={plan} cadence={cadence} index={index} />
          ))}
        </div>

        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="grid gap-4 border-t border-white/8 pt-8 sm:grid-cols-3"
        >
          {GUARANTEES.map(({ icon: Icon, text }) => (
            <motion.li
              key={text}
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: DURATION.base, ease: EASE_OUT_EXPO },
                },
              }}
              className="flex items-center gap-3 text-sm text-gray-400"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-aqua/30 bg-aqua/10 text-aqua">
                <Icon className="h-4 w-4" />
              </span>
              {text}
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

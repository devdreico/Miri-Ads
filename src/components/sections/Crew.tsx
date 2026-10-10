"use client";

import { motion, useReducedMotion } from "motion/react";
import { Badge, Counter, GlassPanel, MagneticButton, Reveal, SectionHeading } from "@/components/ui";
import { DURATION, EASE_OUT_EXPO, viewportOnce } from "@/lib/motion";
import { ArrowIcon, TargetIcon, TimerIcon, StarIcon } from "./icons";

interface Rider {
  name: string;
  zone: string;
  points: number;
}

const RIDERS: Rider[] = [
  { name: "Ana Torres", zone: "Lima · Zona Sur", points: 3820 },
  { name: "Sofía Mena", zone: "Lima · Centro", points: 3150 },
  { name: "Luis Paredes", zone: "Lima · Oeste", points: 2610 },
];

const MEDALS = [
  { label: "Oro", className: "border-aqua/55 bg-aqua/15 text-aqua" },
  { label: "Plata", className: "border-white/35 bg-white/12 text-gray-200" },
  { label: "Bronce", className: "border-white/15 bg-white/8 text-gray-400" },
];

const BONUSES = [
  {
    icon: TargetIcon,
    title: "Bonos por efectividad",
    text: "Cada evidencia aprobada suma y cada punto incumplido resta: el bonus mensual se paga por resultado, no por asistencia.",
  },
  {
    icon: TimerIcon,
    title: "Rutas completadas más rápido",
    text: "Cerrar el turno antes de tiempo activa un multiplicador sobre los puntos de esa jornada.",
  },
  {
    icon: StarIcon,
    title: "Reputación que abre más turnos",
    text: "El ranking semanal decide quién elige primero las zonas premium y los fines de semana de mayor demanda.",
  },
];

const TOP_POINTS = RIDERS[0]?.points ?? 1;

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export default function Crew() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="crew"
      data-scene-stage="crew"
      className="relative scroll-mt-24 py-24 sm:py-32 lg:py-40"
    >
      <div className="container-page flex flex-col gap-12">
        <SectionHeading
          eyebrow="Miri Crew"
          title="Conduce tu barrio, gana por rendimiento"
          description="La red se mueve con talento local: rutas, puntos y reputación en un solo tablero. Cuanto mejor entregas, más turnos eliges."
          className="max-w-3xl"
        />

        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          <Reveal>
            <GlassPanel intensity={1.2} className="flex flex-col gap-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-aqua">
                  Ranking semanal · Lima
                </p>
                <Badge tone="neutral">Semana 41 · 2026</Badge>
              </div>

              <ol className="flex flex-col gap-4">
                {RIDERS.map((rider, index) => {
                  const medal = MEDALS[index] ?? MEDALS[2];
                  const share = Math.round((rider.points / TOP_POINTS) * 100);
                  return (
                    <li key={rider.name} className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-4">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${medal.className}`}
                        >
                          {index + 1}
                        </span>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-aqua/30 to-white/5 font-display text-xs font-semibold text-paper">
                          <span aria-hidden="true">{initials(rider.name)}</span>
                          <span className="sr-only">Foto de {rider.name}</span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-paper sm:text-base">
                            {rider.name}
                          </p>
                          <p className="truncate text-[11px] uppercase tracking-[0.14em] text-gray-500">
                            {medal.label} · {rider.zone}
                          </p>
                        </div>
                        <p className="shrink-0 font-display text-base font-semibold text-aqua sm:text-lg">
                          <Counter to={rider.points} suffix=" pts" />
                        </p>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
                        <motion.span
                          className="block h-full rounded-full bg-gradient-to-r from-aqua-deep via-aqua to-[#7DF5E1]"
                          initial={reducedMotion ? { width: `${share}%` } : { width: 0 }}
                          whileInView={{ width: `${share}%` }}
                          viewport={viewportOnce}
                          transition={{
                            duration: DURATION.slow,
                            delay: index * 0.12,
                            ease: EASE_OUT_EXPO,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>

              <p className="border-t border-white/8 pt-4 text-xs leading-relaxed text-gray-500">
                Puntos provisional de la temporada. Se recalcula cada domingo con
                las evidencias aprobadas de la semana.
              </p>
            </GlassPanel>
          </Reveal>

          <div className="flex flex-col gap-4">
            {BONUSES.map((bonus, index) => (
              <Reveal key={bonus.title} delay={0.08 * index}>
                <GlassPanel intensity={1} lift className="flex gap-4 p-5 sm:p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-aqua/30 bg-aqua/10 text-aqua">
                    <bonus.icon className="h-5 w-5" />
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-sm font-semibold text-paper sm:text-base">
                      {bonus.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-400">
                      {bonus.text}
                    </p>
                  </div>
                </GlassPanel>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.1}>
          <div className="glass flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex flex-col gap-2">
              <p className="font-display text-lg font-semibold text-paper sm:text-xl">
                ¿Conoces las calles mejor que nadie?
              </p>
              <p className="text-sm text-gray-400">
                Entra a la plataforma para ver turnos, rutas y puntos, o escríbenos
                y te sumamos a la siguiente convocatoria.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <MagneticButton href="/crew" variant="primary" size="md">
                Soy Miri Crew
                <ArrowIcon className="h-4 w-4" />
              </MagneticButton>
              <MagneticButton href="mailto:hola@miriads.com" variant="outline" size="md">
                Postular
              </MagneticButton>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

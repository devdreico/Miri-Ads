"use client";

import { motion, useReducedMotion } from "motion/react";
import { Badge, Counter, MagneticButton, Marquee, SplitText } from "@/components/ui";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";

interface Metric {
  value: number;
  suffix?: string;
  decimals?: number;
  label: string;
}

const METRICS: Metric[] = [
  { value: 2.4, decimals: 1, suffix: "M", label: "Impresiones trazadas" },
  { value: 18, label: "Ciudades activas" },
  { value: 96, suffix: "%", label: "Evidencias aprobadas" },
  { value: 72, suffix: "h", label: "Ciclo semanal" },
];

const BRANDS = [
  "Estudio Campo",
  "Panadería El Trigal",
  "Café Tostado",
  "Librería El Epicentro",
  "Bodega Andina",
  "Clínica Sonrisa",
  "Óptica Aurora",
  "Ferretería Norte",
];

const TITLE_LINE_ONE = "Del pixel al pendón:";
const TITLE_LINE_TWO = "publicidad que se prueba";
const FULL_TITLE = `${TITLE_LINE_ONE} ${TITLE_LINE_TWO}`;

export default function Hero() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="inicio"
      data-scene-stage="hero"
      className="relative flex min-h-[100svh] scroll-mt-24 flex-col justify-center overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/55 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink/85 to-transparent"
      />

      <div className="container-page relative flex w-full flex-col gap-12 py-32 sm:py-36">
        <div className="flex max-w-3xl flex-col items-start gap-7">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.base, ease: EASE_OUT_EXPO }}
          >
            <Badge tone="aqua" dot>
              Agencia phygital · LatAm
            </Badge>
          </motion.div>

          <h1 className="font-display text-4xl font-semibold leading-[1.06] tracking-tight text-paper sm:text-6xl lg:text-7xl">
            <span className="sr-only">{FULL_TITLE}</span>
            <span aria-hidden="true" className="flex flex-col gap-1">
              <span className="block">
                <SplitText text={TITLE_LINE_ONE} mode="word" immediate stagger={0.05} />
              </span>
              <span className="block">
                <SplitText
                  text={TITLE_LINE_TWO}
                  mode="word"
                  immediate
                  delay={0.12}
                  stagger={0.05}
                  gradient
                />
              </span>
            </span>
          </h1>

          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: DURATION.slow,
              delay: 0.5,
              ease: EASE_OUT_EXPO,
            }}
            className="max-w-xl text-base leading-relaxed text-gray-300 sm:text-lg"
          >
            Packs digitales que se publican con orden y una red física uberizada
            que sale a la calle con GPS: cada pendón, cada volante y cada ruta
            quedan demostrados con evidencia geolocalizada en tu dashboard.
          </motion.p>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: DURATION.slow,
              delay: 0.65,
              ease: EASE_OUT_EXPO,
            }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <MagneticButton href="#packs" size="lg">
              Ver packs
            </MagneticButton>
            <MagneticButton href="#phygital" variant="secondary" size="lg">
              Activar mi red física
            </MagneticButton>
          </motion.div>
        </div>

        <div className="grid max-w-4xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {METRICS.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: DURATION.base,
                delay: 0.75 + index * 0.09,
                ease: EASE_OUT_EXPO,
              }}
              className="glass rounded-2xl px-4 py-4 sm:px-5 sm:py-5"
            >
              <p className="font-display text-2xl font-semibold leading-none text-paper sm:text-3xl">
                <Counter
                  to={metric.value}
                  suffix={metric.suffix ?? ""}
                  decimals={metric.decimals ?? 0}
                />
              </p>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">
                {metric.label}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gray-500">
            Marcas que ya despliegan con Miri
          </p>
          <Marquee duration={38}>
            {BRANDS.map((brand) => (
              <span
                key={brand}
                className="font-display text-sm font-medium uppercase tracking-[0.22em] text-gray-400 sm:text-base"
              >
                {brand}
              </span>
            ))}
          </Marquee>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 sm:flex"
        aria-hidden="true"
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-gray-500">
          desliza
        </span>
        <motion.span
          className="block h-14 w-px origin-top bg-gradient-to-b from-aqua to-transparent"
          initial={reducedMotion ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0.4 }}
          animate={
            reducedMotion
              ? { scaleY: 1, opacity: 1 }
              : { scaleY: [0, 1, 1, 0], opacity: [0.35, 1, 1, 0.35] }
          }
          transition={
            reducedMotion
              ? { duration: DURATION.base }
              : {
                  duration: 2.6,
                  repeat: Infinity,
                  ease: EASE_OUT_EXPO,
                  times: [0, 0.35, 0.6, 1],
                }
          }
        />
      </div>
    </section>
  );
}

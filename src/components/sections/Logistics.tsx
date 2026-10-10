"use client";

import { useRef, type ComponentType, type ReactNode, type SVGProps } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { GlassPanel, Reveal, SectionHeading } from "@/components/ui";
import { DURATION, EASE_OUT_EXPO, viewportOnce } from "@/lib/motion";
import { BackpackIcon, CartIcon, CheckIcon, PinIcon, PrinterIcon } from "./icons";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface Milestone {
  day: string;
  title: string;
  text: string;
  icon: IconComponent;
}

const MILESTONES: Milestone[] = [
  {
    day: "Lun → Vie",
    title: "Venta y asignación",
    text: "Cerramos packs y bloqueamos turnos: la Crew que cubre cada barrio queda asignada antes de imprimir una sola pieza.",
    icon: CartIcon,
  },
  {
    day: "Sábado",
    title: "Impresión masiva",
    text: "Todo el lote se produce el mismo día. Comprar y maquinar por volumen baja el coste unitario de cada pendón y volante.",
    icon: PrinterIcon,
  },
  {
    day: "Domingo",
    title: "Reparto a Miri Crew",
    text: "El material viaja ya etiquetado por ruta. Quien recibe es responsable de devolver evidencia, no de improvisar.",
    icon: BackpackIcon,
  },
  {
    day: "Lun → Vie",
    title: "Despliegue y evidencias",
    text: "Cada punto se activa en su turno y sube foto con GPS, hora y firma. El dashboard se llena sin llamadas de seguimiento.",
    icon: PinIcon,
  },
];

const THRESHOLDS = [0.06, 0.35, 0.64, 0.92];

const PATH_DIM =
  "M24 0 C 41 88, 7 168, 24 258 S 41 428, 24 518 S 7 698, 24 800";

const BATCH_POINTS = [
  {
    title: "Coste unitario bajo",
    text: "Un solo lote de producción en lugar de treinta envíos sueltos: el precio por pieza cae y el presupuesto se va a calle.",
  },
  {
    title: "Trazabilidad total",
    text: "Cada guía de reparto cruza con la evidencia GPS de la misma semana. Nada queda declarado sin foto.",
  },
  {
    title: "Plazos previsibles",
    text: "Sabes exactamente qué se imprime, qué sale a ruta y qué llega a tu dashboard dentro de 72 horas.",
  },
];

function MilestoneNode({
  progress,
  at,
  children,
}: {
  progress: MotionValue<number>;
  at: number;
  children: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const lit = useTransform(progress, [at - 0.08, at + 0.06], [0, 1]);
  const scale = useTransform(progress, [at - 0.08, at + 0.06], [0.9, 1]);

  return (
    <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-ink/85 text-aqua backdrop-blur-md">
      <motion.span
        className="absolute -inset-1 rounded-full border border-aqua/70"
        style={{ opacity: reducedMotion ? 1 : lit }}
        aria-hidden="true"
      />
      <motion.span
        className="absolute inset-0 rounded-full bg-aqua/20"
        style={{ opacity: reducedMotion ? 1 : lit }}
        aria-hidden="true"
      />
      <motion.span
        className="relative flex h-6 w-6 items-center justify-center"
        style={reducedMotion ? { opacity: 1 } : { opacity: lit, scale }}
        aria-hidden="true"
      >
        {children}
      </motion.span>
    </span>
  );
}

export default function Logistics() {
  const reducedMotion = useReducedMotion();
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 78%", "end 68%"],
  });

  return (
    <section
      id="logistica"
      data-scene-stage="logistics"
      className="relative scroll-mt-24 py-24 sm:py-32 lg:py-40"
    >
      <div className="container-page flex flex-col gap-14">
        <SectionHeading
          eyebrow="Logística semanal"
          title="Todo un país se imprime el mismo sábado"
          description="Procesamos por lotes: concentramos la producción en un día y distribuimos el resto de la semana. El resultado es un coste unitario más bajo, entregas más rápidas y una traza completa de principio a fin."
          className="max-w-3xl"
        />

        <div ref={timelineRef} className="relative">
          <svg
            viewBox="0 0 48 800"
            preserveAspectRatio="none"
            className="absolute left-0 top-0 h-full w-12"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <linearGradient id="logistics-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2FE6C8" />
                <stop offset="55%" stopColor="#7DF5E1" />
                <stop offset="100%" stopColor="#0FB5A1" />
              </linearGradient>
            </defs>
            <path
              d={PATH_DIM}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <motion.path
              d={PATH_DIM}
              fill="none"
              stroke="url(#logistics-gradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={
                reducedMotion ? { pathLength: 1 } : { pathLength: scrollYProgress }
              }
            />
          </svg>

          <ol className="relative flex flex-col gap-10 sm:gap-14">
            {MILESTONES.map((milestone, index) => (
              <li key={milestone.title} className="relative flex gap-5 sm:gap-8">
                <MilestoneNode
                  progress={scrollYProgress}
                  at={THRESHOLDS[index] ?? 0.5}
                >
                  <milestone.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </MilestoneNode>
                <Reveal
                  delay={index * 0.06}
                  className="min-w-0 flex-1 pt-1 sm:pt-2"
                >
                  <GlassPanel
                    intensity={1.4}
                    lift
                    className="flex h-full flex-col gap-3 p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-aqua/40 bg-aqua/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-aqua">
                        {milestone.day}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                        Hito {index + 1} de {MILESTONES.length}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-paper sm:text-xl">
                      {milestone.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-300">
                      {milestone.text}
                    </p>
                  </GlassPanel>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="glass-strong rounded-2xl p-6 sm:p-8"
        >
          <p className="max-w-2xl font-display text-xl font-semibold leading-snug text-paper sm:text-2xl">
            El batch no es un detalle de producción: es la razón por la que
            podemos prometer 72 horas sin inflar el precio.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {BATCH_POINTS.map((point) => (
              <motion.div
                key={point.title}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: DURATION.base, ease: EASE_OUT_EXPO },
                  },
                }}
                className="flex flex-col gap-3 border-t border-aqua/25 pt-4"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-aqua">
                  <CheckIcon className="h-4 w-4" />
                  {point.title}
                </span>
                <p className="text-sm leading-relaxed text-gray-300">{point.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

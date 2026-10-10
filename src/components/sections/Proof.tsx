"use client";

import Image from "next/image";
import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Badge, GlassPanel, Reveal, SectionHeading } from "@/components/ui";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";
import { CheckIcon, ClockIcon, PinIcon, ShieldIcon } from "./icons";

const QR_SIZE = 21;
const QR_SEED = 20260410;

const STAMP_LINES = [
  "MIRI · EVIDENCIA 01",
  "10 OCT 2026 · 11:42:07",
  "-12.11834, -77.03651",
  "PRECISIÓN ±4 M",
];

const PROOF_POINTS = [
  {
    icon: ClockIcon,
    title: "Hora y coordenadas incrustadas",
    text: "Cada disparo lleva timestamp y GPS en los metadatos: la foto no se puede reciclar de otra campaña ni de otra ciudad.",
  },
  {
    icon: ShieldIcon,
    title: "Validación en la plataforma",
    text: "El equipo revisa la evidencia en el dashboard y la aprueba o rechaza con un clic. Tú ves el estado en tiempo real.",
  },
  {
    icon: PinIcon,
    title: "Penalización por incumplimiento",
    text: "Si un punto no se activa en su turno, la reposición corre por nuestra cuenta y el plan se acredita esa unidad.",
  },
];

function buildMatrix(size: number, seed: number): boolean[][] {
  const grid: boolean[][] = [];
  let state = seed >>> 0;
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const reserved = (row: number, col: number) =>
    (row <= 7 && col <= 7) ||
    (row <= 7 && col >= size - 8) ||
    (row >= size - 8 && col <= 7);

  for (let row = 0; row < size; row += 1) {
    const line: boolean[] = [];
    for (let col = 0; col < size; col += 1) {
      if (reserved(row, col)) {
        line.push(false);
      } else if (row === 6 || col === 6) {
        line.push((row + col) % 2 === 0);
      } else {
        line.push(next() > 0.5);
      }
    }
    grid.push(line);
  }

  const finder = (rowStart: number, colStart: number) => {
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        const edge = row === 0 || row === 6 || col === 0 || col === 6;
        const core = row >= 2 && row <= 4 && col >= 2 && col <= 4;
        const target = grid[rowStart + row];
        if (target) target[colStart + col] = edge || core;
      }
    }
  };

  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);
  return grid;
}

function ProceduralQr() {
  const cells = useMemo(() => {
    const matrix = buildMatrix(QR_SIZE, QR_SEED);
    const filled: { x: number; y: number }[] = [];
    matrix.forEach((line, row) => {
      line.forEach((on, col) => {
        if (on) filled.push({ x: col, y: row });
      });
    });
    return filled;
  }, []);

  const span = QR_SIZE + 4;

  return (
    <svg
      viewBox={`-2 -2 ${span} ${span}`}
      className="h-36 w-36 text-aqua"
      role="img"
      aria-label="Código QR de ejemplo que abre el dashboard de la campaña"
      shapeRendering="crispEdges"
    >
      <rect x={-2} y={-2} width={span} height={span} fill="#05070A" />
      {cells.map((cell) => (
        <rect
          key={`${cell.x}-${cell.y}`}
          x={cell.x}
          y={cell.y}
          width={1}
          height={1}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

export default function Proof() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="evidencia"
      data-scene-stage="proof"
      className="relative scroll-mt-24 py-24 sm:py-32 lg:py-40"
    >
      <div className="container-page flex flex-col gap-12">
        <SectionHeading
          eyebrow="Miri Proof"
          title="Si no hay evidencia, no pasó"
          description="Antifraude de fábrica: cada pieza desplegada se fotografía en el sitio, a la hora pactada, con coordenadas verificables desde el panel."
          className="max-w-3xl"
        />

        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <Reveal>
            <GlassPanel
              intensity={1.3}
              className="overflow-hidden p-3 sm:p-4"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink">
                <Image
                  src="/evidences/miri-01.svg"
                  alt="Pendón de Miri Ads instalado en una pared de Lima con sello de hora y coordenadas geográficas"
                  width={640}
                  height={480}
                  unoptimized
                  className="h-full w-full object-cover"
                />

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-ink/35"
                />

                {!reducedMotion ? (
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-aqua/30 to-transparent"
                    initial={{ y: "-40%" }}
                    animate={{ y: ["-40%", "150%"] }}
                    transition={{ duration: 3.4, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-1/2 h-10 bg-gradient-to-b from-transparent via-aqua/25 to-transparent"
                  />
                )}

                <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
                  <Badge tone="aqua" dot>
                    GPS verificado
                  </Badge>
                </div>

                <motion.div
                  initial={
                    reducedMotion
                      ? { opacity: 1, filter: "blur(0px)" }
                      : { opacity: 0, filter: "blur(10px)" }
                  }
                  whileInView={{ opacity: 1, filter: "blur(0px)" }}
                  viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
                  transition={{ duration: DURATION.slow, delay: 0.3, ease: EASE_OUT_EXPO }}
                  className="absolute bottom-3 right-3 rounded-lg border border-aqua/35 bg-ink/85 px-3 py-2 text-right backdrop-blur-md sm:bottom-4 sm:right-4 sm:px-4 sm:py-3"
                >
                  <p className="font-mono text-[10px] leading-relaxed tracking-[0.14em] text-aqua sm:text-xs">
                    {STAMP_LINES.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </p>
                </motion.div>

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l border-t border-aqua/60 sm:left-4 sm:top-4"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b border-r border-aqua/60 sm:bottom-4 sm:right-4"
                />
              </div>

              <p className="px-1 pb-1 pt-3 text-xs text-gray-500">
                Evidencia real de un punto estático: misma foto, mismos metadatos,
                mismo responsable en el turno.
              </p>
            </GlassPanel>
          </Reveal>

          <div className="flex flex-col gap-6">
            <ul className="flex flex-col gap-4 rounded-2xl bg-ink/50 p-4 backdrop-blur-[3px]">
              {PROOF_POINTS.map((point, index) => (
                <li key={point.title}>
                  <Reveal delay={index * 0.09}>
                    <div className="flex gap-4 border-b border-white/8 pb-5">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-aqua/30 bg-aqua/10 text-aqua">
                        <point.icon className="h-5 w-5" />
                      </span>
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-sm font-semibold text-paper sm:text-base">
                          {point.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-gray-300">
                          {point.text}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>

            <Reveal delay={0.12}>
              <GlassPanel intensity={1.2} lift className="flex flex-col gap-5 p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <span className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-2">
                    <ProceduralQr />
                  </span>
                  <div className="flex flex-col gap-3">
                    <Badge tone="neutral">Trazabilidad físico → digital</Badge>
                    <p className="font-display text-base font-semibold leading-snug text-paper sm:text-lg">
                      Del impreso al dashboard: cada QR, un clic medible
                    </p>
                    <p className="text-sm leading-relaxed text-gray-400">
                      El código de cada pieza abre su propia ficha con visitas,
                      horario de escaneo y barrio de origen. Sin apps, sin
                      instalar nada.
                    </p>
                  </div>
                </div>
                <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t border-white/8 pt-4">
                  {["Escaneos por pieza", "Barrio y franja horaria", "Exportable a CSV"].map(
                    (item) => (
                      <li
                        key={item}
                        className="inline-flex items-center gap-2 text-xs text-gray-400"
                      >
                        <CheckIcon className="h-3.5 w-3.5 text-aqua" />
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </GlassPanel>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

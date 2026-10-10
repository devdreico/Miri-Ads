"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Badge, MagneticButton, Reveal } from "@/components/ui";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { ArrowIcon, CheckIcon } from "./icons";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=/<>";

const HEADLINE = "Tu próxima campaña sale a la calle en 72 horas";

const GUARANTEES = [
  "Sin permanencia ni costos ocultos",
  "Evidencia GPS incluida en todos los packs",
  "Respuesta humana en menos de 24 horas",
];

function ScrambleText({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const reducedMotion = useReducedMotion();
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, {
    once: true,
    margin: "-20% 0px -20% 0px",
  });
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (reducedMotion || !inView) return;

    let frame = 0;
    let start = 0;
    const total = 900 + text.length * 30;
    const offset = delay * 1000;

    const tick = (now: number) => {
      if (start === 0) start = now;
      const local = now - start - offset;
      if (local >= 0) {
        const progress = Math.min(1, local / total);
        const resolved = Math.floor(progress * text.length);
        let next = text.slice(0, resolved);
        const seed = Math.floor(local / 55);
        for (let index = resolved; index < text.length; index += 1) {
          const char = text.charAt(index);
          next +=
            char === " "
              ? " "
              : GLYPHS.charAt((index * 17 + seed) % GLYPHS.length);
        }
        setDisplay(next);
        if (progress >= 1) return;
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [delay, inView, reducedMotion, text]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" ref={nodeRef}>
        {display}
      </span>
    </span>
  );
}

export default function FinalCta() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="contacto"
      data-scene-stage="cta"
      className="relative scroll-mt-24 overflow-x-clip py-24 sm:py-32 lg:py-40"
    >
      <div className="container-page flex flex-col items-center gap-8 text-center">
        <Reveal>
          <Badge tone="aqua" dot>
            Siguiente paso
          </Badge>
        </Reveal>

        <Reveal delay={0.06}>
          <h2 className="max-w-4xl text-balance font-display text-4xl font-semibold leading-[1.08] tracking-tight text-paper sm:text-5xl lg:text-6xl">
            <ScrambleText
              text={HEADLINE}
              className="text-gradient-aqua"
              delay={0.1}
            />
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg">
            Elige tu pack, activamos la red física en tu ciudad y recibes la
            primera evidencia con GPS antes de cerrar el mes. Sin campañas a medias.
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="relative inline-flex origin-center justify-center sm:scale-110">
            {!reducedMotion ? (
              <>
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-aqua/20 blur-2xl"
                  animate={{ scale: [1, 1.22], opacity: [0.55, 0] }}
                  transition={{
                    duration: 3.4,
                    repeat: Infinity,
                    ease: EASE_OUT_EXPO,
                  }}
                />
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-3 rounded-2xl border border-aqua/50"
                  animate={{ scale: [1, 1.2], opacity: [0.75, 0] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: EASE_OUT_EXPO,
                  }}
                />
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-3 rounded-2xl border border-aqua/35"
                  animate={{ scale: [1, 1.2], opacity: [0.75, 0] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    delay: 1.2,
                    ease: EASE_OUT_EXPO,
                  }}
                />
              </>
            ) : null}
            <MagneticButton
              href="/checkout/pro"
              size="lg"
              className="relative w-full justify-center sm:w-auto"
            >
              Lanzar mi campaña con Pro Motion
              <ArrowIcon className="h-4 w-4" />
            </MagneticButton>
          </div>
        </Reveal>

        <Reveal delay={0.24}>
          <MagneticButton
            href="mailto:hola@miriads.com"
            variant="secondary"
            size="lg"
          >
            Hablar con el equipo
          </MagneticButton>
        </Reveal>

        <Reveal delay={0.3}>
          <ul className="glass inline-flex flex-col items-center gap-3 rounded-full px-5 py-3 sm:flex-row sm:justify-center sm:gap-6">
            {GUARANTEES.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-2 text-xs text-gray-400 sm:text-sm"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-aqua/40 bg-aqua/10 text-aqua">
                  <CheckIcon className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        <p className="text-xs text-gray-500">
          ¿Prefieres revisar números primero?{" "}
          <a
            href="mailto:hola@miriads.com?subject=Quiero%20revisar%20mi%20pack%20Miri%20Ads"
            className="text-aqua underline decoration-aqua/40 underline-offset-4 transition-colors hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua"
          >
            hola@miriads.com
          </a>
        </p>
      </div>
    </section>
  );
}

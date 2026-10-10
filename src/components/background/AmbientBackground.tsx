"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { cx } from "@/components/ui/cx";

export interface AmbientBackgroundProps {
  className?: string;
  intensity?: number;
}

const GRID_MASK =
  "linear-gradient(to bottom, transparent, black 18%, black 62%, transparent)";

export function AmbientBackground({
  className,
  intensity = 1,
}: AmbientBackgroundProps) {
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;
    if (typeof window === "undefined") return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!finePointer.matches) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight * 0.35 };
    const current = { x: target.x, y: target.y };
    let frame = 0;
    let active = true;

    const write = () => {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      root.style.setProperty("--pointer-x", `${current.x.toFixed(1)}px`);
      root.style.setProperty("--pointer-y", `${current.y.toFixed(1)}px`);
      if (Math.abs(target.x - current.x) > 0.4 || Math.abs(target.y - current.y) > 0.4) {
        frame = requestAnimationFrame(write);
      } else {
        frame = 0;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!active) return;
      target.x = event.clientX;
      target.y = event.clientY;
      if (!frame) frame = requestAnimationFrame(write);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    root.style.setProperty("--pointer-x", `${current.x.toFixed(1)}px`);
    root.style.setProperty("--pointer-y", `${current.y.toFixed(1)}px`);

    return () => {
      active = false;
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [reducedMotion]);

  const level = Math.min(2, Math.max(0, intensity));

  const rootStyle = {
    "--pointer-x": "50vw",
    "--pointer-y": "30vh",
    "--ambient-a": (0.34 + 0.14 * level).toFixed(3),
    "--ambient-b": (0.22 + 0.12 * level).toFixed(3),
    "--ambient-line": (0.06 + 0.04 * level).toFixed(3),
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={cx(
        "pointer-events-none fixed inset-0 -z-30 overflow-hidden bg-ink",
        className,
      )}
      style={rootStyle}
    >
      <div
        className={cx(
          "absolute -left-[18%] top-[-12%] h-[62vh] w-[62vw] rounded-full blur-[120px]",
          !reducedMotion && "animate-aurora",
        )}
        style={{
          background:
            "radial-gradient(circle at 35% 40%, rgba(47, 230, 200, var(--ambient-a)), rgba(15, 181, 161, var(--ambient-b)) 45%, transparent 72%)",
        }}
      />
      <div
        className={cx(
          "absolute -right-[22%] top-[24%] h-[56vh] w-[52vw] rounded-full blur-[130px]",
          !reducedMotion && "animate-aurora [animation-delay:-9s] [animation-duration:34s]",
        )}
        style={{
          background:
            "radial-gradient(circle at 60% 45%, rgba(10, 110, 99, var(--ambient-b)), rgba(47, 230, 200, 0.16) 48%, transparent 74%)",
        }}
      />
      <div
        className={cx(
          "absolute bottom-[-18%] left-[22%] h-[52vh] w-[58vw] rounded-full blur-[140px]",
          !reducedMotion && "animate-aurora [animation-delay:-18s] [animation-duration:40s]",
        )}
        style={{
          background:
            "radial-gradient(circle at 50% 55%, rgba(15, 181, 161, 0.24), rgba(10, 110, 99, 0.14) 50%, transparent 76%)",
        }}
      />

      <div
        className="absolute inset-x-0 bottom-0 h-[46vh]"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(47, 230, 200, var(--ambient-line)) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(47, 230, 200, var(--ambient-line)) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage: GRID_MASK,
          WebkitMaskImage: GRID_MASK,
          transform: "perspective(700px) rotateX(62deg)",
          transformOrigin: "center bottom",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(520px circle at var(--pointer-x) var(--pointer-y), rgba(47, 230, 200, 0.14), rgba(125, 245, 225, 0.06) 34%, transparent 64%)",
        }}
      />

      <div className="noise absolute inset-0" />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink" />
    </div>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { cx } from "./cx";

export interface TiltCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

const MAX_TILT = 8;

export function TiltCard({ children, className, intensity = 1 }: TiltCardProps) {
  const reducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const allowsPointer = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
      : false,
  );

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(50);
  const highlightOpacity = useMotionValue(0);

  const springRotateX = useSpring(rotateX, { stiffness: 180, damping: 20, mass: 0.6 });
  const springRotateY = useSpring(rotateY, { stiffness: 180, damping: 20, mass: 0.6 });

  const specular = useMotionTemplate`radial-gradient(420px circle at ${pointerX}% ${pointerY}%, rgba(47, 230, 200, 0.16), rgba(255, 255, 255, 0.06) 34%, transparent 62%)`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    allowsPointer.current =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (reducedMotion || !allowsPointer.current) return;
      const node = cardRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const ratioX = (event.clientX - rect.left) / rect.width;
      const ratioY = (event.clientY - rect.top) / rect.height;
      const clampedX = Math.min(1, Math.max(0, ratioX));
      const clampedY = Math.min(1, Math.max(0, ratioY));

      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        rotateY.set((clampedX - 0.5) * 2 * MAX_TILT * intensity);
        rotateX.set((0.5 - clampedY) * 2 * MAX_TILT * intensity);
        pointerX.set(clampedX * 100);
        pointerY.set(clampedY * 100);
        highlightOpacity.set(1);
      });
    },
    [highlightOpacity, intensity, pointerX, pointerY, reducedMotion, rotateX, rotateY],
  );

  const handlePointerLeave = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    rotateX.set(0);
    rotateY.set(0);
    highlightOpacity.set(0);
  }, [highlightOpacity, rotateX, rotateY]);

  return (
    <motion.div
      ref={cardRef}
      className={cx(
        "group relative overflow-hidden rounded-2xl border border-ink-line bg-ink-raised/60",
        "transition-colors duration-500 ease-out will-change-transform hover:border-aqua/40",
        className,
      )}
      style={{
        rotateX: reducedMotion ? 0 : springRotateX,
        rotateY: reducedMotion ? 0 : springRotateY,
        transformPerspective: 1000,
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
        style={{ background: specular, opacity: highlightOpacity }}
      />
      <span className="relative z-10">{children}</span>
    </motion.div>
  );
}

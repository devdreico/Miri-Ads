"use client";

import { createElement, useMemo, type ElementType, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { DURATION, EASE_OUT_EXPO, viewportOnce } from "@/lib/motion";
import { cx } from "./cx";

const motionTagCache = new Map<string, ElementType>();

function cachedMotionTag(tag: ElementType): ElementType {
  const key = typeof tag === "string" ? tag : (tag as { displayName?: string }).displayName ?? "custom";
  const cached = motionTagCache.get(key);
  if (cached) return cached;
  const created = motion.create(tag) as ElementType;
  motionTagCache.set(key, created);
  return created;
}

export interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: ElementType;
}

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  as: Tag = "div",
}: RevealProps) {
  const reducedMotion = useReducedMotion();
  const MotionTag = useMemo(() => cachedMotionTag(Tag), [Tag]);

  if (reducedMotion) {
    return createElement(Tag, { className: cx(className) }, children);
  }

  return createElement(
    MotionTag,
    {
      className: cx(className),
      initial: { opacity: 0, y },
      whileInView: { opacity: 1, y: 0 },
      viewport: viewportOnce,
      transition: { duration: DURATION.base, delay, ease: EASE_OUT_EXPO },
    },
    children,
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cx } from "./cx";

export interface CounterProps {
  to: number;
  from?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  separator?: boolean;
  className?: string;
}

const DEFAULT_DURATION = 1.6;

export function Counter({
  to,
  from = 0,
  duration = DEFAULT_DURATION,
  prefix = "",
  suffix = "",
  decimals = 0,
  separator = true,
  className,
}: CounterProps) {
  const reducedMotion = useReducedMotion();
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: "-10% 0px -10% 0px" });
  const [value, setValue] = useState(from);

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("es-ES", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: separator,
      }),
    [decimals, separator],
  );

  useEffect(() => {
    if (!inView || reducedMotion) return;
    const controls = animate(from, to, {
      duration,
      ease: EASE_OUT_EXPO,
      onUpdate: (latest) => setValue(latest),
    });
    return () => controls.stop();
  }, [duration, from, inView, reducedMotion, to]);

  return (
    <span
      ref={nodeRef}
      className={cx("tabular-nums", className)}
      aria-label={`${prefix}${formatter.format(to)}${suffix}`}
    >
      {prefix}
      {formatter.format(reducedMotion ? to : value)}
      {suffix}
    </span>
  );
}

import { createElement, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cx } from "./cx";

export interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  lift?: boolean;
  glow?: boolean;
  intensity?: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function GlassPanel({
  children,
  className,
  as: Tag = "div",
  lift = false,
  glow = false,
  intensity = 1,
}: GlassPanelProps) {
  const level = clamp(intensity, 0, 2);

  const glassVars = {
    "--glass-bg": (0.03 + 0.05 * level).toFixed(3),
    "--glass-blur": `${Math.round(18 + 14 * level)}px`,
    "--glass-line": (0.06 + 0.06 * level).toFixed(3),
    "--glass-specular": (0.1 + 0.08 * level).toFixed(3),
  } as CSSProperties;

  return createElement(
    Tag,
    {
      style: glassVars,
      className: cx(
        "glass relative rounded-2xl",
        lift &&
          "transition-all duration-500 ease-out will-change-transform hover:-translate-y-1 hover:shadow-elevated",
        glow &&
          "transition-colors duration-500 ease-out hover:border-aqua/40 hover:shadow-glow-aqua",
        className,
      ),
    },
    children,
  );
}

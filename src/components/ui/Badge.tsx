import type { ReactNode } from "react";
import { cx } from "./cx";

export type BadgeTone = "aqua" | "neutral" | "dark";

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  aqua:
    "border-aqua/40 bg-aqua/10 text-aqua shadow-[0_0_18px_-6px_rgba(47,230,200,0.55)]",
  neutral: "border-white/12 bg-white/6 text-gray-300",
  dark: "border-ink-line bg-ink-raised text-gray-400",
};

export function Badge({
  children,
  tone = "aqua",
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1",
        "text-[11px] font-medium uppercase tracking-[0.16em]",
        toneClasses[tone],
        className,
      )}
    >
      {dot ? (
        <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-current" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {children}
    </span>
  );
}

import { cx } from "./cx";

export interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
}

const roundedClasses: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

export function Skeleton({ className, rounded = "lg" }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "relative block overflow-hidden bg-ink-line/70",
        roundedClasses[rounded],
        className,
      )}
    >
      <span className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </span>
  );
}

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  const count = Math.max(1, lines);

  return (
    <span aria-hidden="true" className={cx("flex flex-col gap-2.5", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          className={cx(
            "h-3.5",
            index === count - 1 && count > 1 ? "w-3/5" : "w-full",
          )}
          rounded="md"
        />
      ))}
    </span>
  );
}

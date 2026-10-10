"use client";

import { Fragment, type ReactNode } from "react";
import { cx } from "./cx";

export interface MarqueeProps {
  children: ReactNode;
  className?: string;
  repeat?: number;
  duration?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
}

export function Marquee({
  children,
  className,
  repeat = 2,
  duration = 42,
  reverse = false,
  pauseOnHover = true,
}: MarqueeProps) {
  const copies = Array.from({ length: Math.max(2, repeat) });

  return (
    <div
      className={cx(
        "group relative flex w-full overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]",
        "[-webkit-mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]",
        className,
      )}
      role="presentation"
    >
      <div
        className={cx(
          "flex w-max shrink-0 items-center",
          reverse ? "animate-marquee [animation-direction:reverse]" : "animate-marquee",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
        style={{ animationDuration: `${duration}s` }}
        aria-hidden="true"
      >
        {copies.map((_, index) => (
          <Fragment key={index}>
            <span className="flex shrink-0 items-center">
              {children}
            </span>
            {index < copies.length - 1 ? (
              <span
                aria-hidden="true"
                className="mx-8 inline-block h-1 w-1 shrink-0 rounded-full bg-aqua/60 sm:mx-12"
              />
            ) : null}
          </Fragment>
        ))}
      </div>
      <span className="sr-only">{children}</span>
    </div>
  );
}

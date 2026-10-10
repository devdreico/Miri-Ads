import { createElement, Fragment, type ElementType, type ReactNode } from "react";
import { cx } from "./cx";

export interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
  as?: ElementType;
}

function gradientLastWord(title: ReactNode): ReactNode {
  if (typeof title !== "string") return title;
  const trimmed = title.trim();
  const lastSpace = trimmed.lastIndexOf(" ");
  if (lastSpace === -1) {
    return createElement("span", { className: "text-gradient-aqua" }, trimmed);
  }
  return createElement(
    Fragment,
    null,
    trimmed.slice(0, lastSpace),
    " ",
    createElement("span", { className: "text-gradient-aqua" }, trimmed.slice(lastSpace + 1)),
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
  const centered = align === "center";

  return createElement(
    "div",
    {
      className: cx(
        "flex flex-col gap-5",
        centered ? "items-center text-center" : "items-start text-left",
        className,
      ),
    },
    createElement(
      "span",
      {
        className: cx(
          "glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5",
          "text-[11px] font-medium uppercase tracking-[0.18em] text-aqua",
        ),
      },
      createElement(
        "span",
        { className: "relative flex h-1.5 w-1.5", "aria-hidden": true },
        createElement("span", {
          className: "absolute inset-0 animate-pulse-ring rounded-full bg-aqua",
        }),
        createElement("span", {
          className: "relative h-1.5 w-1.5 rounded-full bg-aqua shadow-[0_0_10px_rgba(47,230,200,0.9)]",
        }),
      ),
      eyebrow,
    ),
    createElement(
      Tag,
      {
        className: cx(
          "max-w-3xl text-balance font-display text-4xl font-semibold leading-[1.08] tracking-tight text-paper sm:text-5xl lg:text-6xl",
          "[&_em]:bg-gradient-to-r [&_em]:from-aqua [&_em]:to-aqua-deep [&_em]:bg-clip-text [&_em]:not-italic [&_em]:text-transparent",
        ),
      },
      gradientLastWord(title),
    ),
    description
      ? createElement(
          "p",
          {
            className: cx(
              "max-w-2xl text-pretty text-base leading-relaxed text-gray-400 sm:text-lg",
            ),
          },
          description,
        )
      : null,
  );
}

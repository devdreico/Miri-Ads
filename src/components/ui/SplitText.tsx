"use client";

import { createElement, useMemo, type ElementType } from "react";
import { motion, useReducedMotion, type MotionProps } from "motion/react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";
import { cx } from "./cx";

export interface SplitTextProps {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  stagger?: number;
  mode?: "word" | "char";
  immediate?: boolean;
  gradient?: boolean;
}

export function SplitText({
  text,
  as: Tag = "span",
  className,
  delay = 0,
  stagger = 0.03,
  mode = "word",
  immediate = false,
  gradient = false,
}: SplitTextProps) {
  const reducedMotion = useReducedMotion();

  const revealTarget = { y: "0%", opacity: 1, filter: "blur(0px)" } as const;
  const trigger: MotionProps = immediate
    ? { animate: revealTarget }
    : {
        whileInView: revealTarget,
        viewport: { once: true, margin: "-10% 0px -10% 0px" },
      };

  const tokens = useMemo(() => {
    if (mode === "char") {
      return Array.from(text).map((char) => (char === " " ? " " : char));
    }
    return text.trim().split(/\s+/);
  }, [mode, text]);

  if (reducedMotion) {
    return createElement(Tag, { className: cx(className) }, text);
  }

  return createElement(
    Tag,
    {
      className: cx("inline-flex flex-wrap", className),
      "aria-label": text,
      role: "text",
    },
    tokens.map((token, index) =>
      createElement(
        "span",
        {
          key: `${token}-${index}`,
          "aria-hidden": true,
          className: cx(
            "inline-block overflow-hidden align-baseline",
            mode === "word" && "mr-[0.26em] last:mr-0",
          ),
        },
        createElement(
          motion.span,
          {
            className: cx("inline-block will-change-transform", gradient && "text-gradient-aqua"),
            initial: { y: "110%", opacity: 0, filter: "blur(10px)" },
            ...trigger,
            transition: {
              duration: DURATION.slow,
              delay: delay + index * stagger,
              ease: EASE_OUT_EXPO,
            },
          },
          token,
        ),
      )
    ),
  );
}

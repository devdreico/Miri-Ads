import type { Variants } from "motion/react";

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as [number, number, number, number];
export const EASE_STANDARD = [0.4, 0, 0.2, 1] as [number, number, number, number];

export const DURATION = {
  fast: 0.2,
  base: 0.45,
  slow: 0.8,
} as const;

export const viewportOnce = {
  once: true,
  margin: "-10% 0px -10% 0px",
} as const;

export const fadeUp = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, delay, ease: EASE_OUT_EXPO },
  },
});

export const fadeIn = (delay = 0): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.base, delay, ease: EASE_OUT_EXPO },
  },
});

export const zoomIn = (delay = 0): Variants => ({
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.base, delay, ease: EASE_OUT_EXPO },
  },
});

export const staggerChildren = (stagger = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

export const slideInFromLeft = (delay = 0): Variants => ({
  hidden: { opacity: 0, x: -28 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.base, delay, ease: EASE_OUT_EXPO },
  },
});

export const textReveal = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: "0.6em", filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: "0em",
    filter: "blur(0px)",
    transition: { duration: DURATION.slow, delay, ease: EASE_OUT_EXPO },
  },
});

export const containerStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

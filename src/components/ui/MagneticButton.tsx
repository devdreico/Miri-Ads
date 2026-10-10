"use client";

import Link from "next/link";
import {
  useCallback,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ComponentProps,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cx } from "./cx";

type MagneticVariant = "primary" | "secondary" | "ghost" | "outline";
type MagneticSize = "sm" | "md" | "lg";

export interface MagneticButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  href?: string;
  variant?: MagneticVariant;
  size?: MagneticSize;
  className?: string;
}

const MAX_PULL = 6;

const variantClasses: Record<MagneticVariant, string> = {
  primary:
    "bg-aqua text-ink font-semibold shadow-glow-aqua hover:brightness-110 active:brightness-95",
  secondary: "glass text-paper font-medium hover:border-aqua/40 hover:bg-white/10",
  ghost:
    "relative bg-transparent font-medium text-paper after:absolute after:inset-x-0 after:-bottom-px after:h-px after:origin-left after:scale-x-0 after:bg-aqua after:transition-transform after:duration-500 after:ease-out hover:after:scale-x-100",
  outline:
    "border border-aqua/50 bg-transparent font-medium text-aqua hover:border-aqua hover:bg-aqua/10",
};

const sizeClasses: Record<MagneticSize, string> = {
  sm: "h-9 rounded-lg px-4 text-sm",
  md: "h-11 rounded-xl px-6 text-sm",
  lg: "h-14 rounded-xl px-8 text-base",
};

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function MagneticButton({
  children,
  href,
  variant = "primary",
  size = "md",
  className,
  onClick,
  ...buttonProps
}: MagneticButtonProps) {
  const reducedMotion = useReducedMotion();
  const surfaceRef = useRef<HTMLElement | null>(null);
  const rippleIdRef = useRef(0);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const pullX = useMotionValue(0);
  const pullY = useMotionValue(0);
  const springX = useSpring(pullX, { stiffness: 260, damping: 22, mass: 0.5 });
  const springY = useSpring(pullY, { stiffness: 260, damping: 22, mass: 0.5 });

  const haloX = useMotionValue(0);
  const haloY = useMotionValue(0);
  const haloOpacity = useMotionValue(0);
  const springHaloX = useSpring(haloX, { stiffness: 220, damping: 26, mass: 0.4 });
  const springHaloY = useSpring(haloY, { stiffness: 220, damping: 26, mass: 0.4 });
  const haloBackground = useMotionTemplate`radial-gradient(140px circle at ${springHaloX}px ${springHaloY}px, rgba(47, 230, 200, 0.32), transparent 72%)`;

  const classes = cx(
    "group/magnetic relative inline-flex select-none items-center justify-center overflow-hidden whitespace-nowrap",
    "transition-[filter,background-color,border-color,color] duration-300 ease-out",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (reducedMotion) return;
      const node = surfaceRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const offsetX = event.clientX - rect.left - rect.width / 2;
      const offsetY = event.clientY - rect.top - rect.height / 2;
      const ratioX = rect.width > 0 ? offsetX / (rect.width / 2) : 0;
      const ratioY = rect.height > 0 ? offsetY / (rect.height / 2) : 0;
      pullX.set(ratioX * MAX_PULL);
      pullY.set(ratioY * MAX_PULL);
      haloX.set(event.clientX - rect.left);
      haloY.set(event.clientY - rect.top);
    },
    [haloX, haloY, pullX, pullY, reducedMotion],
  );

  const handlePointerEnter = useCallback(() => {
    if (reducedMotion) return;
    haloOpacity.set(1);
  }, [haloOpacity, reducedMotion]);

  const handlePointerLeave = useCallback(() => {
    pullX.set(0);
    pullY.set(0);
    haloOpacity.set(0);
  }, [haloOpacity, pullX, pullY]);

  const spawnRipple = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (reducedMotion) return;
      const node = surfaceRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      rippleIdRef.current += 1;
      const ripple: Ripple = {
        id: rippleIdRef.current,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      setRipples((current) => [...current, ripple]);
      window.setTimeout(() => {
        setRipples((current) => current.filter((item) => item.id !== ripple.id));
      }, 750);
    },
    [reducedMotion],
  );

  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      spawnRipple(event);
      onClick?.(event);
    },
    [onClick, spawnRipple],
  );

  const handleSurfaceClick = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      spawnRipple(event);
      onClick?.(event as unknown as ReactMouseEvent<HTMLButtonElement>);
    },
    [onClick, spawnRipple],
  );

  const content = (
    <>
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: haloBackground, opacity: haloOpacity }}
      />

      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            aria-hidden="true"
            className="pointer-events-none absolute z-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-aqua/50"
            style={{ left: ripple.x, top: ripple.y }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 26, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          />
        ))}
      </AnimatePresence>

      <span className="relative z-10 inline-flex items-center justify-center">
        {children}
      </span>
    </>
  );

  const linkSafeProps = buttonProps as unknown as Omit<
    ComponentProps<typeof Link>,
    "href"
  >;

  const motionSurface = (
    <motion.span
      className="inline-flex will-change-transform"
      style={{ x: springX, y: springY }}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {href ? (
        <Link
          href={href}
          ref={(node) => {
            surfaceRef.current = node;
          }}
          className={classes}
          onClick={handleSurfaceClick as ComponentProps<typeof Link>["onClick"]}
          {...linkSafeProps}
        >
          {content}
        </Link>
      ) : (
        <button
          type="button"
          ref={(node) => {
            surfaceRef.current = node;
          }}
          className={classes}
          onClick={handleClick}
          {...buttonProps}
        >
          {content}
        </button>
      )}
    </motion.span>
  );

  return motionSurface;
}

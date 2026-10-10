"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MagneticButton } from "@/components/ui";
import { cx } from "@/components/ui/cx";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { CloseIcon, MenuIcon } from "@/components/sections/icons";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Packs", href: "#packs" },
  { label: "Red física", href: "#phygital" },
  { label: "Logística", href: "#logistica" },
  { label: "Evidencia", href: "#evidencia" },
  { label: "Crew", href: "#crew" },
];

const NAV_OPEN_VG = "https://openvg.presentto.online";

const NAV_CONTACT = "mailto:hola@miriads.com";

export function SiteNav() {
  const reducedMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const previous =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusables = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
          )
        : [];
    const [first] = focusables();
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      const head = items[0];
      const tail = items[items.length - 1];
      if (!head || !tail) return;
      if (event.shiftKey && document.activeElement === head) {
        event.preventDefault();
        tail.focus();
      } else if (!event.shiftKey && document.activeElement === tail) {
        event.preventDefault();
        head.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <>
      <header
        className={cx(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
          scrolled || open
            ? "glass-dark border-b border-white/10"
            : "border-b border-transparent",
        )}
      >
        <div className="container-page flex h-[72px] items-center justify-between gap-4">
          <Link
            href="#inicio"
            onClick={closeMenu}
            className="flex shrink-0 items-center gap-2.5 rounded-lg py-1 pr-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua"
          >
            <Image
              src="/logo/miri-ads-logo.png"
              alt=""
              width={40}
              height={37}
              priority
              className="h-9 w-auto"
            />
            <span className="font-display text-lg font-semibold tracking-tight text-paper">
              Miri Ads
            </span>
          </Link>

          <nav
            aria-label="Secciones de la página"
            className="hidden items-center gap-1 lg:flex"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors duration-300 hover:text-aqua focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={NAV_OPEN_VG}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors duration-300 hover:text-aqua focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua"
            >
              OpenVG
            </a>
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <MagneticButton href="/admin" variant="ghost" size="sm">
              Panel
            </MagneticButton>
            <MagneticButton href="#packs" variant="primary" size="sm">
              Ver packs
            </MagneticButton>
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={open ? "mobile-nav" : undefined}
            aria-label={open ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/12 bg-white/6 text-paper transition-colors duration-300 hover:border-aqua/40 hover:text-aqua focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua lg:hidden"
          >
            {open ? (
              <CloseIcon className="h-5 w-5" />
            ) : (
              <MenuIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            ref={panelRef}
            key="mobile-nav"
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            className="fixed inset-0 z-40 flex flex-col gap-8 overflow-y-auto bg-ink/95 px-6 pb-12 pt-[104px] backdrop-blur-2xl lg:hidden"
          >
            <nav aria-label="Menú móvil" className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex items-center justify-between border-b border-white/8 py-4 font-display text-2xl font-medium text-paper transition-colors duration-300 hover:text-aqua focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua"
                >
                  {item.label}
                  <span aria-hidden="true" className="text-sm text-aqua">
                    →
                  </span>
                </Link>
              ))}
              <a
                href={NAV_OPEN_VG}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
                className="flex items-center justify-between border-b border-white/8 py-4 font-display text-2xl font-medium text-paper transition-colors duration-300 hover:text-aqua focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua"
              >
                OpenVG
                <span aria-hidden="true" className="text-sm text-aqua">
                  ↗
                </span>
              </a>
            </nav>

            <div className="flex flex-col gap-3">
              <MagneticButton
                href="#packs"
                size="lg"
                onClick={closeMenu}
                className="w-full justify-center"
              >
                Ver packs
              </MagneticButton>
              <MagneticButton href="/admin" variant="secondary" size="lg" className="w-full justify-center">
                Panel de control
              </MagneticButton>
              <MagneticButton
                href={NAV_CONTACT}
                variant="outline"
                size="lg"
                className="w-full justify-center"
              >
                hola@miriads.com
              </MagneticButton>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default SiteNav;

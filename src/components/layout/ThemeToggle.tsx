"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  readStoredTheme,
  setTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme";
import { cx } from "@/components/ui/cx";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z" />
    </svg>
  );
}

function subscribe(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_STORAGE_KEY, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_STORAGE_KEY, onStoreChange);
  };
}

function getSnapshot(): Theme {
  const stored = readStoredTheme();
  if (stored) return stored;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const next: Theme = theme === "light" ? "dark" : "light";
  const label =
    theme === "light" ? "Cambiar a tema oscuro" : "Cambiar a tema claro";

  const onClick = useCallback(() => {
    setTheme(next);
  }, [next]);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={theme === "light"}
      className={cx(
        "flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/6 text-gray-300 transition-colors duration-300",
        "hover:border-aqua/40 hover:text-aqua focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua",
        className,
      )}
    >
      {theme === "light" ? (
        <MoonIcon className="h-[18px] w-[18px]" />
      ) : (
        <SunIcon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}

export default ThemeToggle;

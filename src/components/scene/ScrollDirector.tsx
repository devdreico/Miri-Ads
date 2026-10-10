'use client';

import { useEffect } from 'react';
import { setStageProgress } from './stageStore';
import { stageIndexOf } from './stages';

type StageEntry = {
  index: number;
  y: number;
};

function readScrollY(): number {
  return window.scrollY || document.documentElement.scrollTop || 0;
}

function readStageEntries(): StageEntry[] {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-scene-stage]'));
  const entries: StageEntry[] = [];
  const seen = new Set<number>();

  for (const section of sections) {
    const key = section.getAttribute('data-scene-stage') ?? '';
    const index = stageIndexOf(key);
    if (index < 0 || seen.has(index)) continue;
    seen.add(index);
    const rect = section.getBoundingClientRect();
    entries.push({
      index,
      y: rect.top + readScrollY() + section.offsetHeight / 2 - window.innerHeight / 2,
    });
  }

  entries.sort((a, b) => a.index - b.index);
  return entries;
}

function resolveProgress(entries: StageEntry[], scrollY: number): number {
  const first = entries[0];
  const last = entries[entries.length - 1];
  if (scrollY <= first.y) return first.index;
  if (scrollY >= last.y) return last.index;

  for (let i = 0; i < entries.length - 1; i += 1) {
    const from = entries[i];
    const to = entries[i + 1];
    if (scrollY < from.y || scrollY >= to.y) continue;
    const span = to.y - from.y;
    if (span <= 0) return to.index;
    return from.index + ((to.index - from.index) * (scrollY - from.y)) / span;
  }

  return last.index;
}

export function ScrollDirector() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Reduced motion still tracks the scroll stage (the globe must recede
    // behind the copy) but GlobeExperience snaps instead of easing.
    let entries: StageEntry[] = readStageEntries();
    let disposed = false;
    let teardown: (() => void) | null = null;
    let refresh: (() => void) | null = null;

    const apply = () => {
      if (entries.length < 2) return;
      setStageProgress(resolveProgress(entries, readScrollY()));
    };

    const measure = () => {
      entries = readStageEntries();
    };

    const handleResize = () => {
      measure();
      if (refresh) refresh();
    };

    apply();

    void (async () => {
      const [gsapModule, scrollModule] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (disposed) return;

      const { gsap } = gsapModule;
      const { ScrollTrigger } = scrollModule;
      gsap.registerPlugin(ScrollTrigger);

      measure();
      apply();

      const trigger = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: apply,
        onRefresh: () => {
          measure();
          apply();
        },
      });

      window.addEventListener('resize', handleResize);
      const refreshFrame = window.requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });

      refresh = () => {
        ScrollTrigger.refresh();
      };

      teardown = () => {
        window.removeEventListener('resize', handleResize);
        window.cancelAnimationFrame(refreshFrame);
        trigger.kill();
        refresh = null;
        teardown = null;
      };
    })();

    return () => {
      disposed = true;
      if (teardown) teardown();
    };
  }, []);

  return null;
}

export default ScrollDirector;

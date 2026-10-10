'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import { motion } from 'motion/react';

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';
const PARTICLE_COUNT = 52;
const SEED = 20261010;
const COLORS = ['#2FE6C8', '#0FB5A1', '#FAFAFA', '#C7CDD1', '#9AA4AA'];

interface Particle {
  id: number;
  left: number;
  width: number;
  height: number;
  color: string;
  drift: number;
  rotation: number;
  duration: number;
  delay: number;
  rounded: boolean;
}

function subscribeReduced(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => undefined;
  }
  const media = window.matchMedia(REDUCE_QUERY);
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

function getReducedSnapshot(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(REDUCE_QUERY).matches;
}

function getReducedServerSnapshot(): boolean | null {
  return null;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createParticles(): Particle[] {
  const random = mulberry32(SEED);
  const particles: Particle[] = [];

  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    particles.push({
      id: index,
      left: random() * 100,
      width: 5 + random() * 9,
      height: 7 + random() * 14,
      color: COLORS[Math.floor(random() * COLORS.length)],
      drift: (random() - 0.5) * 420,
      rotation: (random() - 0.5) * 900,
      duration: 2.2 + random() * 2.4,
      delay: random() * 0.7,
      rounded: random() > 0.55,
    });
  }

  return particles;
}

const PARTICLES = createParticles();

export function Confetti() {
  const reduced = useSyncExternalStore(
    subscribeReduced,
    getReducedSnapshot,
    getReducedServerSnapshot,
  );
  const [finished, setFinished] = useState(false);
  const completedRef = useRef(0);

  function handleComplete() {
    completedRef.current += 1;
    if (completedRef.current >= PARTICLES.length) setFinished(true);
  }

  if (reduced !== false || finished) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden="true"
    >
      {PARTICLES.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute top-0 block"
          style={{
            left: `${particle.left}%`,
            width: particle.width,
            height: particle.height,
            backgroundColor: particle.color,
            borderRadius: particle.rounded ? 3 : 0,
          }}
          initial={{ y: '-14vh', x: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: '96vh',
            x: particle.drift,
            opacity: [1, 1, 0],
            rotate: particle.rotation,
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: [0.16, 1, 0.3, 1],
            opacity: { duration: particle.duration, delay: particle.delay, times: [0, 0.7, 1] },
          }}
          onAnimationComplete={handleComplete}
        />
      ))}
    </div>
  );
}

'use client';

import { motion } from 'motion/react';
import { Counter, GlassPanel } from '@/components/ui';
import { viewportOnce } from '@/lib/motion';

export interface CrewRankingDto {
  id: string;
  handle: string;
  name: string;
  score: number;
  routesCompleted: number;
  stopsCompleted: number;
  rating: number;
}

const MEDALS = [
  { label: '1', ring: 'border-amber-300/60 bg-amber-300/15 text-amber-200' },
  { label: '2', ring: 'border-gray-300/50 bg-gray-300/12 text-gray-200' },
  { label: '3', ring: 'border-orange-400/50 bg-orange-400/12 text-orange-200' },
];

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function CrewRankingBars({ crews }: { crews: CrewRankingDto[] }) {
  const max = Math.max(1, ...crews.map((crew) => crew.score));

  return (
    <GlassPanel className="p-5 sm:p-6" intensity={1.1}>
      <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gray-500">
        Ranking de crew
      </p>
      <h2 className="mt-1 font-display text-xl text-paper">Top 3 de la semana</h2>

      <ul className="mt-5 flex flex-col gap-4">
        {crews.map((crew, index) => (
          <li key={crew.id} className="flex items-center gap-4">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-display text-sm ${
                (MEDALS[index] ?? { label: `#${index + 1}`, ring: 'border-white/15 text-gray-400' })
                  .ring
              }`}
              aria-hidden="true"
            >
              {(MEDALS[index] ?? { label: `${index + 1}` }).label}
            </span>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-aqua/30 bg-aqua/10 font-display text-sm text-aqua">
              {initials(crew.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-sm font-medium text-paper">
                  {crew.name}{' '}
                  <span className="text-gray-500">{crew.handle}</span>
                </p>
                <p className="shrink-0 font-display text-lg text-aqua tabular-nums">
                  <Counter to={crew.score} />
                </p>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/6">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.round((crew.score / max) * 100)}%` }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.9, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-aqua-deep to-aqua shadow-[0_0_18px_-4px_rgba(47,230,200,0.8)]"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-gray-500">
                {crew.routesCompleted} rutas · {crew.stopsCompleted} paradas · {crew.rating.toFixed(1)} estrellas
              </p>
            </div>
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
}

'use client';

import { motion } from 'motion/react';
import { Counter, GlassPanel } from '@/components/ui';
import { staggerChildren, viewportOnce } from '@/lib/motion';
import { formatDateTime } from '@/lib/format';

export interface RankingCrewDto {
  id: string;
  handle: string;
  name: string;
  score: number;
  routesCompleted: number;
  stopsCompleted: number;
  rating: number;
}

export interface AchievementDto {
  id: string;
  reason: string;
  points: number;
  createdAt: string;
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

export function RankingBoardClient({
  crews,
  me,
  achievements,
}: {
  crews: RankingCrewDto[];
  me: RankingCrewDto;
  achievements: AchievementDto[];
}) {
  const max = Math.max(1, ...crews.map((crew) => crew.score));
  const myRank = crews.findIndex((crew) => crew.id === me.id) + 1;

  return (
    <div className="flex flex-col gap-5">
      <GlassPanel className="p-5 sm:p-6" intensity={1.3}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">
              Mi desempeño
            </p>
            <h1 className="mt-1 font-display text-2xl text-paper">Hola, {me.name}</h1>
          </div>
          {myRank > 0 ? (
            <span className="rounded-full border border-aqua/40 bg-aqua/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-aqua">
              Puesto #{myRank}
            </span>
          ) : null}
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            { label: 'Puntuación', value: <Counter to={me.score} className="text-2xl text-aqua" /> },
            { label: 'Rutas completadas', value: <Counter to={me.routesCompleted} className="text-2xl" /> },
            { label: 'Paradas completadas', value: <Counter to={me.stopsCompleted} className="text-2xl" /> },
            { label: 'Rating', value: <span className="text-2xl tabular-nums">{me.rating.toFixed(1)}</span> },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
              <dt className="text-[10px] uppercase tracking-[0.16em] text-gray-500">{item.label}</dt>
              <dd className="mt-1 font-display tabular-nums text-paper">{item.value}</dd>
            </div>
          ))}
        </dl>
      </GlassPanel>

      <GlassPanel className="p-5 sm:p-6" intensity={1.1}>
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">
          Leaderboard semanal
        </p>
        <h2 className="mt-1 font-display text-xl text-paper">Ranking de la Miri Crew</h2>
        <ul className="mt-5 flex flex-col gap-4">
          {crews.map((crew, index) => {
            const isMe = crew.id === me.id;
            return (
              <li
                key={crew.id}
                className={`flex items-center gap-4 rounded-xl border px-3 py-3 transition-colors ${
                  isMe ? 'border-aqua/40 bg-aqua/8' : 'border-transparent'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-display text-sm ${
                    (MEDALS[index] ?? { label: `#${index + 1}`, ring: 'border-white/15 text-gray-400' })
                      .ring
                  }`}
                  aria-hidden="true"
                >
                  {(MEDALS[index] ?? { label: `${index + 1}` }).label}
                </span>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-aqua/30 bg-aqua/10 font-display text-base text-aqua">
                  {initials(crew.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium text-paper">
                      {crew.name} <span className="text-gray-500">{crew.handle}</span>
                    </p>
                    <p className="shrink-0 font-display text-xl text-aqua tabular-nums">
                      <Counter to={crew.score} />
                    </p>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/6">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.round((crew.score / max) * 100)}%` }}
                      viewport={viewportOnce}
                      transition={{ duration: 0.9, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-aqua-deep to-aqua shadow-[0_0_18px_-4px_rgba(47,230,200,0.85)]"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-gray-500">
                    {crew.routesCompleted} rutas · {crew.stopsCompleted} paradas ·{' '}
                    {crew.rating.toFixed(1)} estrellas
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </GlassPanel>

      <GlassPanel className="p-5 sm:p-6" intensity={1.1}>
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">
          Historial de puntos
        </p>
        <h2 className="mt-1 font-display text-xl text-paper">Logros recientes</h2>
        {achievements.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            Todavía no hay logros registrados. Completa una parada con evidencia GPS.
          </p>
        ) : (
          <motion.ul
            className="mt-4 flex flex-col gap-2"
            variants={staggerChildren(0.08, 0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {achievements.map((achievement) => (
              <motion.li
                key={achievement.id}
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
                }}
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3"
              >
                <span className="font-display text-lg text-aqua tabular-nums">+{achievement.points}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-paper">{achievement.reason}</p>
                  <p className="text-[11px] text-gray-500">{formatDateTime(achievement.createdAt)}</p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </GlassPanel>
    </div>
  );
}

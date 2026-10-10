import type { ReactNode } from 'react';
import { Badge, Counter, GlassPanel } from '@/components/ui';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/format';
import { getCurrentCycle } from './data';

export async function KpiGrid() {
  const cycle = await getCurrentCycle();
  const monthStart = new Date(
    Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1),
  );

  const [pendingEvidences, activePoints, routes, totalStops, doneStops, paidOrders, crews] =
    await Promise.all([
      db.evidence.count({ where: { status: 'PENDING' } }),
      db.staticPoint.count({ where: { status: 'ACTIVE' } }),
      db.route.count({ where: cycle ? { cycleId: cycle.id } : {} }),
      db.routeStop.count({ where: cycle ? { route: { cycleId: cycle.id } } : {} }),
      db.routeStop.count({
        where: cycle ? { status: 'DONE', route: { cycleId: cycle.id } } : { status: 'DONE' },
      }),
      db.order.aggregate({
        where: { status: 'PAID', paidAt: { gte: monthStart } },
        _sum: { amountCents: true },
      }),
      db.crewProfile.count({ where: { status: { not: 'INACTIVE' } } }),
    ]);

  const compliance = totalStops > 0 ? Math.round((doneStops / totalStops) * 100) : 0;
  const cycleValue = paidOrders._sum.amountCents ?? 0;

  const cards: Array<{
    label: string;
    hint: string;
    content: ReactNode;
    tone?: 'aqua' | 'neutral';
  }> = [
    {
      label: 'Evidencias por revisar',
      hint: 'Cola anti-fraude',
      content: <Counter to={pendingEvidences} className="text-3xl text-aqua" />,
      tone: pendingEvidences > 0 ? 'aqua' : 'neutral',
    },
    {
      label: 'Puntos activos',
      hint: 'Inventario físico',
      content: <Counter to={activePoints} className="text-3xl" />,
    },
    {
      label: 'Rutas del ciclo',
      hint: 'Semana en curso',
      content: <Counter to={routes} className="text-3xl" />,
    },
    {
      label: 'Cumplimiento',
      hint: `${doneStops}/${totalStops} paradas`,
      content: <Counter to={compliance} suffix="%" className="text-3xl" />,
    },
    {
      label: 'Valor del mes',
      hint: 'Órdenes pagadas',
      content: <span className="text-3xl font-semibold">{formatMoney(cycleValue)}</span>,
    },
    {
      label: 'Crew activo',
      hint: 'Freelancers disponibles',
      content: <Counter to={crews} className="text-3xl" />,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => (
        <GlassPanel key={card.label} className="flex flex-col justify-between gap-3 p-5" lift glow>
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
              {card.label}
            </p>
            <Badge tone={card.tone ?? 'neutral'} className="px-2 py-0.5 text-[9px]">
              en vivo
            </Badge>
          </div>
          <div className="font-display text-paper tabular-nums">{card.content}</div>
          <p className="text-xs text-gray-500">{card.hint}</p>
        </GlassPanel>
      ))}
    </div>
  );
}

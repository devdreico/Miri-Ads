import { Badge } from '@/components/ui';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/format';
import { getCurrentDemoUser } from './demo-session';

const PHASE_LABELS: Record<string, string> = {
  SALES: 'Semana de venta',
  PRINTING: 'Sábado impresión',
  DISTRIBUTION: 'Domingo reparto',
  DEPLOYMENT: 'Despliegue',
  CLOSING: 'Cierre de semana',
};

export async function AdminHeader() {
  const user = await getCurrentDemoUser();
  const [city, cycle] = await Promise.all([
    user.cityId
      ? db.city.findUnique({ where: { id: user.cityId }, select: { name: true } })
      : Promise.resolve(null),
    db.batchCycle.findFirst({ orderBy: { weekStart: 'desc' } }),
  ]);

  const cityName = city?.name ?? 'Sin ciudad';
  const phaseLabel = cycle ? PHASE_LABELS[cycle.phase] ?? cycle.phase : 'Sin ciclo activo';
  const weekLabel = cycle
    ? `${formatDate(cycle.weekStart)} — ${formatDate(cycle.weekEnd)}`
    : 'Sin semana configurada';

  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/8 px-4 py-5 sm:px-6 lg:px-8">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gray-500">
          Panel del Administrador de Ciudad
        </p>
        <h1 className="mt-1 font-display text-2xl text-paper sm:text-3xl">
          Hola, {user.name} · {cityName}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="aqua" dot>
          {phaseLabel}
        </Badge>
        <Badge tone="neutral">{weekLabel}</Badge>
      </div>
    </div>
  );
}

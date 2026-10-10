'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Badge, GlassPanel } from '@/components/ui';
import { assignSupplies } from '@/lib/actions/admin';

export interface SupplyOption {
  id: string;
  name: string;
  unit: string;
}

export interface CrewOption {
  id: string;
  handle: string;
  name: string;
}

export interface SupplyAssignmentDto {
  id: string;
  supplyName: string;
  supplyUnit: string;
  crewHandle: string;
  quantity: number;
  returned: number | null;
}

export function SupplyAssignPanel({
  supplies,
  crews,
  assignments,
}: {
  supplies: SupplyOption[];
  crews: CrewOption[];
  assignments: SupplyAssignmentDto[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [supplyId, setSupplyId] = useState(supplies[0]?.id ?? '');
  const [crewId, setCrewId] = useState(crews[0]?.id ?? '');
  const [quantity, setQuantity] = useState('50');
  const [message, setMessage] = useState<string | null>(null);

  const submit = (): void => {
    setMessage(null);
    const parsed = Number(quantity);
    startTransition(async () => {
      const result = await assignSupplies([{ supplyId, crewId, quantity: parsed }]);
      setMessage(result.ok ? 'Insumo asignado al ciclo actual.' : (result.error ?? 'No se pudo asignar.'));
      if (result.ok) router.refresh();
    });
  };

  return (
    <GlassPanel className="flex flex-col gap-4 p-5" intensity={1.1}>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gray-500">
          Logística de la semana
        </p>
        <h2 className="mt-1 font-display text-xl text-paper">Asignar insumos del ciclo</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.4fr_1.2fr_0.7fr_auto]">
        <div className="flex flex-col gap-1">
          <label htmlFor="supply-item" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
            Insumo
          </label>
          <select
            id="supply-item"
            value={supplyId}
            onChange={(event) => setSupplyId(event.target.value)}
            disabled={isPending || supplies.length === 0}
            className="h-11 rounded-xl border border-white/12 bg-ink/70 px-3 text-sm text-paper outline-none transition-colors hover:border-aqua/40 focus-visible:border-aqua disabled:opacity-60"
          >
            {supplies.map((supply) => (
              <option key={supply.id} value={supply.id} className="bg-ink">
                {supply.name} ({supply.unit})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="supply-crew" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
            Crew
          </label>
          <select
            id="supply-crew"
            value={crewId}
            onChange={(event) => setCrewId(event.target.value)}
            disabled={isPending || crews.length === 0}
            className="h-11 rounded-xl border border-white/12 bg-ink/70 px-3 text-sm text-paper outline-none transition-colors hover:border-aqua/40 focus-visible:border-aqua disabled:opacity-60"
          >
            {crews.map((crew) => (
              <option key={crew.id} value={crew.id} className="bg-ink">
                {crew.name} ({crew.handle})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="supply-qty" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
            Cantidad
          </label>
          <input
            id="supply-qty"
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            disabled={isPending}
            className="h-11 rounded-xl border border-white/12 bg-ink/70 px-3 text-sm text-paper outline-none transition-colors hover:border-aqua/40 focus-visible:border-aqua disabled:opacity-60"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            disabled={isPending || !supplyId || !crewId}
            onClick={submit}
            className="h-11 w-full rounded-xl bg-aqua px-5 text-sm font-semibold text-ink shadow-glow-aqua transition hover:brightness-110 disabled:opacity-60 md:w-auto"
          >
            {isPending ? 'Asignando…' : 'Asignar'}
          </button>
        </div>
      </div>

      {message ? <Badge tone="aqua">{message}</Badge> : null}

      <div className="overflow-hidden rounded-xl border border-white/8">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/4 text-[10px] uppercase tracking-[0.16em] text-gray-500">
            <tr>
              <th className="px-3 py-2 font-medium">Insumo</th>
              <th className="px-3 py-2 font-medium">Crew</th>
              <th className="px-3 py-2 font-medium">Asignado</th>
              <th className="px-3 py-2 font-medium">Devuelto</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-xs text-gray-500">
                  Todavía no se han asignado insumos en este ciclo.
                </td>
              </tr>
            ) : (
              assignments.map((assignment) => (
                <tr key={assignment.id} className="border-t border-white/6">
                  <td className="px-3 py-2 text-paper">{assignment.supplyName}</td>
                  <td className="px-3 py-2 text-gray-400">{assignment.crewHandle}</td>
                  <td className="px-3 py-2 tabular-nums text-gray-300">
                    {assignment.quantity} {assignment.supplyUnit}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-gray-300">
                    {assignment.returned ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}

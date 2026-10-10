'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Badge, GlassPanel } from '@/components/ui';
import { upsertSupplyItem } from '@/lib/actions/admin';

export interface SupplyDto {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
}

export interface SupplySummaryDto {
  crewHandle: string;
  totalQuantity: number;
  totalReturned: number;
  lines: number;
}

export function SupplyInventoryClient({
  supplies,
  summary,
}: {
  supplies: SupplyDto[];
  summary: SupplySummaryDto[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, SupplyDto>>(() =>
    Object.fromEntries(supplies.map((supply) => [supply.id, { ...supply }])),
  );
  const [messages, setMessages] = useState<Record<string, string>>({});

  const update = (id: string, patch: Partial<SupplyDto>): void => {
    setDrafts((current) => {
      const existing = current[id];
      if (!existing) return current;
      return { ...current, [id]: { ...existing, ...patch } };
    });
  };

  const save = (id: string): void => {
    const draft = drafts[id];
    if (!draft) return;
    setMessages((current) => ({ ...current, [id]: '' }));
    startTransition(async () => {
      const result = await upsertSupplyItem({
        id,
        name: draft.name,
        unit: draft.unit,
        stock: Number(draft.stock),
        minStock: Number(draft.minStock),
      });
      setMessages((current) => ({
        ...current,
        [id]: result.ok ? 'Guardado.' : (result.error ?? 'No se pudo guardar.'),
      }));
      if (result.ok) router.refresh();
    });
  };

  const inputClass =
    'h-9 w-full rounded-lg border border-white/12 bg-ink/70 px-2 text-sm text-paper outline-none transition-colors hover:border-aqua/40 focus-visible:border-aqua disabled:opacity-60';

  return (
    <div className="flex flex-col gap-6">
      <GlassPanel className="p-5" intensity={1.1}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gray-500">
              Almacén de la ciudad
            </p>
            <h2 className="mt-1 font-display text-xl text-paper">Inventario de insumos</h2>
          </div>
          <Badge tone="neutral">Edición inline · se guarda por fila</Badge>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-white/8">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-white/4 text-[10px] uppercase tracking-[0.16em] text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">Insumo</th>
                <th className="px-3 py-2 font-medium">Unidad</th>
                <th className="px-3 py-2 font-medium">Stock</th>
                <th className="px-3 py-2 font-medium">Mínimo</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {supplies.map((supply) => {
                const draft = drafts[supply.id] ?? supply;
                const low = Number(draft.stock) <= Number(draft.minStock);
                return (
                  <tr key={supply.id} className="border-t border-white/6 align-middle">
                    <td className="px-3 py-2">
                      <input
                        aria-label={`Nombre de ${supply.name}`}
                        value={draft.name}
                        onChange={(event) => update(supply.id, { name: event.target.value })}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        aria-label={`Unidad de ${supply.name}`}
                        value={draft.unit}
                        onChange={(event) => update(supply.id, { unit: event.target.value })}
                        className={`${inputClass} max-w-24`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        aria-label={`Stock de ${supply.name}`}
                        type="number"
                        min={0}
                        step={1}
                        value={draft.stock}
                        onChange={(event) => update(supply.id, { stock: Number(event.target.value) })}
                        className={`${inputClass} max-w-28`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        aria-label={`Stock mínimo de ${supply.name}`}
                        type="number"
                        min={0}
                        step={1}
                        value={draft.minStock}
                        onChange={(event) => update(supply.id, { minStock: Number(event.target.value) })}
                        className={`${inputClass} max-w-28`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={low ? 'dark' : 'aqua'} className="px-2 py-0.5 text-[9px]">
                        {low ? 'Stock bajo' : 'Disponible'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => save(supply.id)}
                          className="h-9 rounded-lg bg-aqua px-3 text-xs font-semibold text-ink transition hover:brightness-110 disabled:opacity-60"
                        >
                          Guardar
                        </button>
                        {messages[supply.id] ? (
                          <span className="text-[10px] text-aqua">{messages[supply.id]}</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      <GlassPanel className="p-5" intensity={1.1}>
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gray-500">
          Ciclo actual
        </p>
        <h2 className="mt-1 font-display text-xl text-paper">Resumen de insumos asignados</h2>
        {summary.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No hay asignaciones en el ciclo vigente.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {summary.map((item) => (
              <li
                key={item.crewHandle}
                className="rounded-xl border border-white/8 bg-white/3 p-4"
              >
                <p className="text-sm text-paper">{item.crewHandle}</p>
                <p className="mt-1 font-display text-2xl text-aqua tabular-nums">
                  {item.totalQuantity}
                </p>
                <p className="text-[11px] text-gray-500">
                  unidades asignadas · {item.totalReturned} devueltas · {item.lines} líneas
                </p>
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>
    </div>
  );
}

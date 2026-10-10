import { GlassPanel } from '@/components/ui';
import { db } from '@/lib/db';
import { CyclePipelineClient } from './CyclePipelineClient';

export async function CyclePipeline() {
  const cycle = await db.batchCycle.findFirst({ orderBy: { weekStart: 'desc' } });
  if (!cycle) {
    return (
      <GlassPanel className="p-6">
        <p className="text-sm text-gray-400">No hay ciclos configurados para la ciudad.</p>
      </GlassPanel>
    );
  }
  return (
    <CyclePipelineClient
      cycle={{
        id: cycle.id,
        weekStart: cycle.weekStart.toISOString(),
        weekEnd: cycle.weekEnd.toISOString(),
        printDate: cycle.printDate ? cycle.printDate.toISOString() : null,
        distributeDate: cycle.distributeDate ? cycle.distributeDate.toISOString() : null,
        phase: cycle.phase,
      }}
    />
  );
}

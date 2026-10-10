'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

type ActionResult = { ok: boolean; error?: string };

function revalidateCrew(): void {
  revalidatePath('/crew', 'layout');
}

export async function completeStopWithoutPhoto(
  stopId: string,
  distanceM: number,
  note?: string,
): Promise<ActionResult> {
  if (!stopId) return { ok: false, error: 'Falta la parada.' };
  if (!Number.isFinite(distanceM) || distanceM <= 200) {
    return { ok: false, error: 'La parada está dentro de cobertura: registra la evidencia con la cámara.' };
  }
  try {
    const stop = await db.routeStop.findUnique({
      where: { id: stopId },
      include: { route: { select: { id: true, crewId: true } } },
    });
    if (!stop) return { ok: false, error: 'Parada no encontrada.' };
    if (stop.status === 'DONE') return { ok: true };
    const clean = (note ?? '').trim();
    const checkNote =
      clean || `Marcado sin foto a ${Math.round(distanceM)} m del punto (fuera de cobertura).`;
    await db.routeStop.update({
      where: { id: stopId },
      data: { status: 'DONE', doneAt: new Date(), checkNote },
    });
    const crew = await db.crewProfile.findFirst({ where: { id: stop.route.crewId ?? '' } });
    if (crew) {
      await db.crewProfile.update({
        where: { id: crew.id },
        data: { stopsCompleted: { increment: 1 }, score: { increment: 5 } },
      });
      await db.crewScore.create({
        data: {
          crewId: crew.id,
          points: 5,
          reason: 'Stop completado sin foto por estar fuera de cobertura (+5)',
        },
      });
    }
    revalidateCrew();
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo marcar la parada.' };
  }
}

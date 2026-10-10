'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { CyclePhase, PointStatus, RouteStatus, ZoneStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { addDays, weekStartOf } from '@/lib/format';
import {
  DEMO_COOKIE,
  resolveCityId,
  resolveReviewerId,
} from '@/components/admin/demo-session';

type ActionResult = { ok: boolean; error?: string };

const CYCLE_PHASES: CyclePhase[] = ['SALES', 'PRINTING', 'DISTRIBUTION', 'DEPLOYMENT', 'CLOSING'];
const POINT_STATUSES: PointStatus[] = ['PROPOSED', 'ACTIVE', 'PAUSED'];
const ZONE_STATUSES: ZoneStatus[] = ['PROPOSED', 'ACTIVE', 'PAUSED'];
const ROUTE_STATUSES: RouteStatus[] = ['PLANNED', 'DISTRIBUTED', 'IN_PROGRESS', 'COMPLETED'];

function revalidateAdmin(): void {
  revalidatePath('/admin', 'layout');
}

function normalizePolygon(input: {
  type: string;
  coordinates: unknown;
}): { type: 'Polygon'; coordinates: number[][][] } | null {
  if (input?.type !== 'Polygon') return null;
  const ring = Array.isArray(input.coordinates) ? input.coordinates[0] : undefined;
  if (!Array.isArray(ring) || ring.length < 4) return null;
  const points: number[][] = [];
  for (const corner of ring) {
    if (!Array.isArray(corner) || corner.length < 2) return null;
    const lng = Number(corner[0]);
    const lat = Number(corner[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    points.push([Number(lng.toFixed(6)), Number(lat.toFixed(6))]);
  }
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return null;
  if (first[0] !== last[0] || first[1] !== last[1]) points.push([first[0], first[1]]);
  return { type: 'Polygon', coordinates: [points] };
}

export async function advanceCyclePhase(cycleId: string): Promise<ActionResult> {
  if (!cycleId) return { ok: false, error: 'Falta el identificador del ciclo.' };
  try {
    const cycle = await db.batchCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) return { ok: false, error: 'Ciclo no encontrado.' };
    const index = CYCLE_PHASES.indexOf(cycle.phase);
    const next = CYCLE_PHASES[(index + 1) % CYCLE_PHASES.length] ?? 'SALES';
    const weekStart = next === 'SALES' ? addDays(cycle.weekStart, 7) : cycle.weekStart;
    const weekEnd = addDays(weekStart, 6);
    await db.batchCycle.update({
      where: { id: cycle.id },
      data: {
        phase: next,
        weekStart,
        weekEnd,
        printDate: addDays(weekStart, 5),
        distributeDate: addDays(weekStart, 6),
      },
    });
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo avanzar la fase del ciclo.' };
  }
}

export async function resetCycleWeek(cycleId: string): Promise<ActionResult> {
  if (!cycleId) return { ok: false, error: 'Falta el identificador del ciclo.' };
  try {
    const cycle = await db.batchCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) return { ok: false, error: 'Ciclo no encontrado.' };
    const weekStart = weekStartOf(new Date());
    const weekEnd = addDays(weekStart, 6);
    await db.batchCycle.update({
      where: { id: cycle.id },
      data: {
        phase: 'SALES',
        weekStart,
        weekEnd,
        printDate: addDays(weekStart, 5),
        distributeDate: addDays(weekStart, 6),
      },
    });
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo reiniciar la semana.' };
  }
}

export async function approveEvidence(evidenceId: string): Promise<ActionResult> {
  if (!evidenceId) return { ok: false, error: 'Falta la evidencia.' };
  try {
    const evidence = await db.evidence.findUnique({ where: { id: evidenceId } });
    if (!evidence) return { ok: false, error: 'Evidencia no encontrada.' };
    const reviewerId = await resolveReviewerId();
    await db.evidence.update({
      where: { id: evidenceId },
      data: { status: 'APPROVED', reviewerId, reviewedAt: new Date(), rejectReason: null },
    });
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo aprobar la evidencia.' };
  }
}

export async function rejectEvidence(evidenceId: string, reason: string): Promise<ActionResult> {
  const clean = (reason ?? '').trim();
  if (!evidenceId) return { ok: false, error: 'Falta la evidencia.' };
  if (clean.length < 4) return { ok: false, error: 'Indica un motivo de rechazo más detallado.' };
  try {
    const evidence = await db.evidence.findUnique({ where: { id: evidenceId } });
    if (!evidence) return { ok: false, error: 'Evidencia no encontrada.' };
    const reviewerId = await resolveReviewerId();
    await db.evidence.update({
      where: { id: evidenceId },
      data: { status: 'REJECTED', reviewerId, reviewedAt: new Date(), rejectReason: clean },
    });
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo rechazar la evidencia.' };
  }
}

export async function upsertStaticPoint(input: {
  id?: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  partnerName?: string;
  surface?: string;
  status: string;
  notes?: string;
  cityId?: string;
}): Promise<ActionResult> {
  const name = (input?.name ?? '').trim();
  const address = (input?.address ?? '').trim();
  if (name.length < 3) return { ok: false, error: 'El nombre del punto debe tener al menos 3 caracteres.' };
  if (address.length < 5) return { ok: false, error: 'Ingresa una dirección válida.' };
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) {
    return { ok: false, error: 'Coordenadas inválidas.' };
  }
  if (Math.abs(input.lat) > 90 || Math.abs(input.lng) > 180) {
    return { ok: false, error: 'Coordenadas fuera de rango.' };
  }
  if (!POINT_STATUSES.includes(input.status as PointStatus)) {
    return { ok: false, error: 'Estado de punto no válido.' };
  }
  try {
    const cityId = await resolveCityId(input.cityId);
    if (!cityId) return { ok: false, error: 'No hay ciudades configuradas.' };
    const data = {
      name,
      address,
      lat: input.lat,
      lng: input.lng,
      partnerName: input.partnerName?.trim() || null,
      surface: input.surface?.trim() || null,
      status: input.status as PointStatus,
      notes: input.notes?.trim() || null,
      cityId,
    };
    if (input.id) {
      const existing = await db.staticPoint.findUnique({ where: { id: input.id } });
      if (!existing) return { ok: false, error: 'Punto no encontrado.' };
      await db.staticPoint.update({ where: { id: input.id }, data });
    } else {
      await db.staticPoint.create({ data });
    }
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo guardar el punto.' };
  }
}

export async function deleteStaticPoint(pointId: string): Promise<ActionResult> {
  if (!pointId) return { ok: false, error: 'Falta el punto.' };
  try {
    const point = await db.staticPoint.findUnique({ where: { id: pointId } });
    if (!point) return { ok: false, error: 'Punto no encontrado.' };
    await db.evidence.updateMany({
      where: { staticPointId: pointId },
      data: { staticPointId: null },
    });
    await db.staticPoint.delete({ where: { id: pointId } });
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo eliminar el punto.' };
  }
}

export async function upsertAllowedZone(input: {
  id?: string;
  name: string;
  status: string;
  notes?: string;
  polygon: { type: string; coordinates: unknown };
}): Promise<ActionResult> {
  const name = (input?.name ?? '').trim();
  if (name.length < 3) return { ok: false, error: 'El nombre de la zona debe tener al menos 3 caracteres.' };
  if (!ZONE_STATUSES.includes(input.status as ZoneStatus)) {
    return { ok: false, error: 'Estado de zona no válido.' };
  }
  const polygon = normalizePolygon(input.polygon);
  if (!polygon) return { ok: false, error: 'El polígono debe tener al menos 2 esquinas válidas.' };
  try {
    const cityId = await resolveCityId();
    if (!cityId) return { ok: false, error: 'No hay ciudades configuradas.' };
    const data = {
      name,
      status: input.status as ZoneStatus,
      notes: input.notes?.trim() || null,
      polygon: polygon as unknown as Prisma.InputJsonValue,
      cityId,
    };
    if (input.id) {
      const existing = await db.allowedZone.findUnique({ where: { id: input.id } });
      if (!existing) return { ok: false, error: 'Zona no encontrada.' };
      await db.allowedZone.update({ where: { id: input.id }, data });
    } else {
      await db.allowedZone.create({ data });
    }
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo guardar la zona.' };
  }
}

export async function deleteAllowedZone(zoneId: string): Promise<ActionResult> {
  if (!zoneId) return { ok: false, error: 'Falta la zona.' };
  try {
    const zone = await db.allowedZone.findUnique({ where: { id: zoneId } });
    if (!zone) return { ok: false, error: 'Zona no encontrada.' };
    await db.allowedZone.delete({ where: { id: zoneId } });
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo eliminar la zona.' };
  }
}

export async function assignRouteCrew(routeId: string, crewId: string | null): Promise<ActionResult> {
  if (!routeId) return { ok: false, error: 'Falta la ruta.' };
  try {
    const route = await db.route.findUnique({ where: { id: routeId } });
    if (!route) return { ok: false, error: 'Ruta no encontrada.' };
    if (crewId) {
      const crew = await db.crewProfile.findUnique({ where: { id: crewId } });
      if (!crew) return { ok: false, error: 'Crew no encontrada.' };
    }
    await db.route.update({
      where: { id: routeId },
      data: { crewId: crewId ?? null, status: route.status === 'PLANNED' ? 'DISTRIBUTED' : route.status },
    });
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo reasignar la ruta.' };
  }
}

export async function advanceRouteStatus(routeId: string): Promise<ActionResult> {
  if (!routeId) return { ok: false, error: 'Falta la ruta.' };
  try {
    const route = await db.route.findUnique({ where: { id: routeId } });
    if (!route) return { ok: false, error: 'Ruta no encontrada.' };
    if (route.status === 'COMPLETED') return { ok: false, error: 'La ruta ya está cerrada.' };
    const next = ROUTE_STATUSES[Math.min(ROUTE_STATUSES.indexOf(route.status) + 1, ROUTE_STATUSES.length - 1)] ?? 'COMPLETED';
    await db.route.update({ where: { id: routeId }, data: { status: next } });
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo marcar la fase de la ruta.' };
  }
}

export async function closeRoute(routeId: string): Promise<ActionResult> {
  if (!routeId) return { ok: false, error: 'Falta la ruta.' };
  try {
    const route = await db.route.findUnique({
      where: { id: routeId },
      include: { stops: { include: { evidences: { select: { status: true } } } } },
    });
    if (!route) return { ok: false, error: 'Ruta no encontrada.' };
    const total = route.stops.length;
    const done = route.stops.filter((stop) => stop.status === 'DONE').length;
    const evidences = route.stops.flatMap((stop) => stop.evidences);
    const approved = evidences.filter((item) => item.status === 'APPROVED').length;
    const rejected = evidences.filter((item) => item.status === 'REJECTED').length;
    const pending = evidences.filter((item) => item.status === 'PENDING').length;
    const summary = `Cerrada manualmente: ${done}/${total} paradas · ${approved} evidencias aprobadas, ${rejected} rechazadas y ${pending} pendientes.`;
    const notes = route.notes ? `${route.notes} ${summary}` : summary;
    await db.route.update({
      where: { id: routeId },
      data: { status: 'COMPLETED', completedAt: new Date(), notes },
    });
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo cerrar la ruta.' };
  }
}

export async function assignSupplies(
  entries: Array<{ supplyId: string; crewId: string; quantity: number }>,
): Promise<ActionResult> {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { ok: false, error: 'Agrega al menos un insumo para asignar.' };
  }
  for (const entry of entries) {
    if (!entry?.supplyId || !entry?.crewId) return { ok: false, error: 'Insumo y crew son obligatorios.' };
    if (!Number.isInteger(entry.quantity) || entry.quantity <= 0) {
      return { ok: false, error: 'La cantidad debe ser un número entero mayor que cero.' };
    }
  }
  try {
    const cycle = await db.batchCycle.findFirst({ orderBy: { weekStart: 'desc' } });
    if (!cycle) return { ok: false, error: 'No hay ciclos configurados.' };
    for (const entry of entries) {
      const supply = await db.supplyItem.findUnique({ where: { id: entry.supplyId } });
      if (!supply) return { ok: false, error: 'Insumo no encontrado.' };
      const crew = await db.crewProfile.findUnique({ where: { id: entry.crewId } });
      if (!crew) return { ok: false, error: 'Crew no encontrada.' };
      await db.supplyAssignment.create({
        data: {
          cycleId: cycle.id,
          crewId: entry.crewId,
          supplyId: entry.supplyId,
          quantity: entry.quantity,
        },
      });
    }
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudieron asignar los insumos.' };
  }
}

export async function upsertSupplyItem(input: {
  id?: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
}): Promise<ActionResult> {
  const name = (input?.name ?? '').trim();
  const unit = (input?.unit ?? '').trim();
  if (name.length < 3) return { ok: false, error: 'El nombre del insumo debe tener al menos 3 caracteres.' };
  if (unit.length < 1) return { ok: false, error: 'Indica la unidad del insumo.' };
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    return { ok: false, error: 'El stock debe ser un entero mayor o igual a cero.' };
  }
  if (!Number.isInteger(input.minStock) || input.minStock < 0) {
    return { ok: false, error: 'El stock mínimo debe ser un entero mayor o igual a cero.' };
  }
  try {
    const cityId = await resolveCityId();
    if (!cityId) return { ok: false, error: 'No hay ciudades configuradas.' };
    const data = { name, unit, stock: input.stock, minStock: input.minStock };
    if (input.id) {
      const existing = await db.supplyItem.findUnique({ where: { id: input.id } });
      if (!existing) return { ok: false, error: 'Insumo no encontrado.' };
      await db.supplyItem.update({ where: { id: input.id }, data });
    } else {
      await db.supplyItem.create({ data: { ...data, cityId } });
    }
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo guardar el insumo.' };
  }
}

export async function setDemoUser(email: string): Promise<ActionResult> {
  const clean = (email ?? '').trim().toLowerCase();
  if (!clean) return { ok: false, error: 'Selecciona un usuario demo.' };
  try {
    const user = await db.user.findUnique({ where: { email: clean }, select: { id: true } });
    if (!user) return { ok: false, error: 'Ese usuario no existe en la base de datos.' };
    const store = await cookies();
    store.set(DEMO_COOKIE, clean, {
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
    });
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo cambiar el usuario demo.' };
  }
}

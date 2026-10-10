'use server';

import { revalidatePath } from 'next/cache';
import { getOrderByReference, markOrderPaid, markOrderRejected } from '@/lib/data/orders';

export interface DemoActionResult {
  ok: boolean;
  error?: string;
}

const REFERENCE_PATTERN = /^[A-Za-z0-9-]{4,32}$/;

type PendingOrderResult = { ok: true; reference: string } | { ok: false; error: string };

async function resolvePendingDemoOrder(reference: string): Promise<PendingOrderResult> {
  const normalized = reference.trim();

  if (!REFERENCE_PATTERN.test(normalized)) {
    return { ok: false, error: 'La referencia del pedido no es válida.' };
  }

  const order = await getOrderByReference(normalized);
  if (!order) {
    return { ok: false, error: 'No encontramos ninguna orden con esa referencia.' };
  }

  if (order.mpPreferenceId || order.mpPaymentId) {
    return { ok: false, error: 'Esta orden tiene un pago real en MercadoPago.' };
  }

  if (order.status !== 'PENDING') {
    return { ok: false, error: 'Esta orden ya no está pendiente de pago.' };
  }

  return { ok: true, reference: normalized };
}

export async function approveDemoPayment(reference: string): Promise<DemoActionResult> {
  try {
    const guard = await resolvePendingDemoOrder(reference);
    if (!guard.ok) return guard;

    const order = await markOrderPaid({
      reference: guard.reference,
      provider: 'DEMO',
      externalId: `demo_${guard.reference}`,
      raw: { simulated: true, approvedAt: new Date().toISOString() },
    });

    if (!order) {
      return { ok: false, error: 'No encontramos ninguna orden con esa referencia.' };
    }

    revalidatePath(`/checkout/estado/${guard.reference}`);
    return { ok: true };
  } catch {
    return { ok: false, error: 'No pudimos aprobar el pago. Intenta de nuevo.' };
  }
}

export async function rejectDemoPayment(reference: string): Promise<DemoActionResult> {
  try {
    const guard = await resolvePendingDemoOrder(reference);
    if (!guard.ok) return guard;

    const order = await markOrderRejected({
      reference: guard.reference,
      provider: 'DEMO',
      externalId: `demo_${guard.reference}`,
      status: 'REJECTED',
      raw: { simulated: true, rejectedAt: new Date().toISOString() },
    });

    if (!order) {
      return { ok: false, error: 'No encontramos ninguna orden con esa referencia.' };
    }

    revalidatePath(`/checkout/estado/${guard.reference}`);
    return { ok: true };
  } catch {
    return { ok: false, error: 'No pudimos rechazar el pago. Intenta de nuevo.' };
  }
}

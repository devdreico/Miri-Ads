import { randomInt } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type {
  Cadence as DbCadence,
  Order,
  OrderStatus,
  Payment,
  PaymentProvider,
  PaymentStatus,
  PlanTier as DbPlanTier,
} from '@prisma/client';
import { db } from '@/lib/db';
import {
  CADENCE_LABEL,
  getPlan,
  planPrice,
  type PlanCadence,
  type PlanTier,
} from '@/lib/plans';

const TIER_TO_DB: Record<PlanTier, DbPlanTier> = {
  essential: 'ESSENTIAL',
  pro: 'PRO',
  growth: 'GROWTH',
};

const CADENCE_TO_DB: Record<PlanCadence, DbCadence> = {
  monthly: 'MONTHLY',
  quarterly: 'QUARTERLY',
  annual: 'ANNUAL',
};

const REFERENCE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const REFERENCE_SUFFIX_LENGTH = 5;
const REFERENCE_ATTEMPTS = 12;

export interface CreateOrderInput {
  tier: PlanTier;
  cadence: PlanCadence;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface OrderPaymentInput {
  reference: string;
  provider: PaymentProvider;
  externalId: string;
  raw?: unknown;
}

export interface MarkOrderRejectedInput extends OrderPaymentInput {
  status?: Extract<OrderStatus, 'REJECTED' | 'CANCELLED' | 'EXPIRED'>;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  const serialized = JSON.stringify(value ?? null) ?? 'null';
  return JSON.parse(serialized) as Prisma.InputJsonValue;
}

function generateReference(): string {
  let suffix = '';
  for (let index = 0; index < REFERENCE_SUFFIX_LENGTH; index += 1) {
    suffix += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  }
  return `MA-${suffix}`;
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  return 'code' in error && error.code === 'P2002';
}

async function writePayment(
  client: Prisma.TransactionClient,
  params: {
    orderId: string;
    amountCents: number;
    currency: string;
    provider: PaymentProvider;
    status: PaymentStatus;
    externalId: string;
    raw?: unknown;
  },
): Promise<Payment> {
  const raw = params.raw === undefined ? Prisma.JsonNull : toJsonValue(params.raw);
  const existing = await client.payment.findFirst({
    where: { orderId: params.orderId, provider: params.provider, externalId: params.externalId },
  });

  if (existing) {
    return client.payment.update({
      where: { id: existing.id },
      data: { status: params.status, raw },
    });
  }

  return client.payment.create({
    data: {
      orderId: params.orderId,
      amountCents: params.amountCents,
      currency: params.currency,
      provider: params.provider,
      status: params.status,
      externalId: params.externalId,
      raw,
    },
  });
}

export async function getOrderByReference(reference: string): Promise<Order | null> {
  return db.order.findUnique({ where: { reference } });
}

export async function createOrderFromCheckout(input: CreateOrderInput): Promise<Order> {
  const plan = getPlan(input.tier);
  if (!plan) throw new Error('El plan seleccionado no existe.');

  const amountCents = planPrice(plan, input.cadence) * 100;

  for (let attempt = 0; attempt < REFERENCE_ATTEMPTS; attempt += 1) {
    const reference = generateReference();
    const existing = await db.order.findUnique({
      where: { reference },
      select: { id: true },
    });
    if (existing) continue;

    try {
      return await db.order.create({
        data: {
          reference,
          tier: TIER_TO_DB[input.tier],
          cadence: CADENCE_TO_DB[input.cadence],
          amountCents,
          currency: plan.currency,
          status: 'PENDING',
          planSnapshot: toJsonValue({
            ...plan,
            cadence: input.cadence,
            cadenceLabel: CADENCE_LABEL[input.cadence].label,
            amountCents,
            createdAt: new Date().toISOString(),
          }),
          clientName: input.name,
          clientEmail: input.email,
          clientPhone: input.phone ?? null,
          clientCompany: input.company ?? null,
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) continue;
      throw error;
    }
  }

  throw new Error('No pudimos generar una referencia de pedido.');
}

export async function saveOrderPreference(
  reference: string,
  mpPreferenceId: string,
): Promise<Order | null> {
  const existing = await db.order.findUnique({
    where: { reference },
    select: { id: true },
  });
  if (!existing) return null;

  return db.order.update({
    where: { id: existing.id },
    data: { mpPreferenceId },
  });
}

export async function markOrderPaid(input: OrderPaymentInput): Promise<Order | null> {
  const order = await getOrderByReference(input.reference);
  if (!order) return null;

  return db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paidAt: order.paidAt ?? new Date(),
        ...(input.provider === 'MERCADOPAGO' ? { mpPaymentId: input.externalId } : {}),
      },
    });

    await writePayment(tx, {
      orderId: order.id,
      amountCents: order.amountCents,
      currency: order.currency,
      provider: input.provider,
      status: 'APPROVED',
      externalId: input.externalId,
      raw: input.raw,
    });

    return updated;
  });
}

export async function markOrderRejected(
  input: MarkOrderRejectedInput,
): Promise<Order | null> {
  const order = await getOrderByReference(input.reference);
  if (!order) return null;

  const status: OrderStatus = input.status ?? 'REJECTED';

  return db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status },
    });

    await writePayment(tx, {
      orderId: order.id,
      amountCents: order.amountCents,
      currency: order.currency,
      provider: input.provider,
      status: 'REJECTED',
      externalId: input.externalId,
      raw: input.raw,
    });

    return updated;
  });
}

export async function markOrderPaymentPending(
  input: OrderPaymentInput,
): Promise<Order | null> {
  const order = await getOrderByReference(input.reference);
  if (!order) return null;

  if (order.status !== 'PENDING') return order;

  await writePayment(db, {
    orderId: order.id,
    amountCents: order.amountCents,
    currency: order.currency,
    provider: input.provider,
    status: 'PENDING',
    externalId: input.externalId,
    raw: input.raw,
  });

  return order;
}

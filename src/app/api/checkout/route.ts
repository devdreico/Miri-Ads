import { NextResponse } from 'next/server';
import { createOrderFromCheckout, saveOrderPreference } from '@/lib/data/orders';
import { createPreference, isMercadoPagoConfigured } from '@/lib/mercadopago';
import {
  CADENCE_LABEL,
  getPlan,
  type PlanCadence,
  type PlanTier,
} from '@/lib/plans';

const TIERS: PlanTier[] = ['essential', 'pro', 'growth'];
const CADENCES: PlanCadence[] = ['monthly', 'quarterly', 'annual'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[0-9\s().-]{6,20}$/;
const MAX_NAME = 120;
const MAX_EMAIL = 160;
const MAX_PHONE = 30;
const MAX_COMPANY = 120;

interface CheckoutPayload {
  tier: PlanTier;
  cadence: PlanCadence;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

type ValidationResult =
  | { ok: true; value: CheckoutPayload }
  | { ok: false; error: string };

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() : null;
}

function validatePayload(payload: unknown): ValidationResult {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return { ok: false, error: 'El cuerpo de la petición debe ser un objeto JSON.' };
  }

  const body = payload as Record<string, unknown>;

  const tier = readString(body.tier);
  if (!tier || !TIERS.includes(tier as PlanTier)) {
    return { ok: false, error: 'El plan seleccionado no es válido.' };
  }

  const cadence = readString(body.cadence);
  if (!cadence || !CADENCES.includes(cadence as PlanCadence)) {
    return { ok: false, error: 'La cadencia seleccionada no es válida.' };
  }

  const name = readString(body.name);
  if (!name || name.length < 2) {
    return { ok: false, error: 'Ingresa tu nombre (mínimo 2 caracteres).' };
  }
  if (name.length > MAX_NAME) {
    return { ok: false, error: 'El nombre ingresado es demasiado largo.' };
  }

  const email = readString(body.email);
  if (!email) {
    return { ok: false, error: 'Ingresa tu correo electrónico.' };
  }
  if (email.length > MAX_EMAIL || !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: 'Ingresa un correo electrónico válido.' };
  }

  const phoneValue = body.phone;
  if (phoneValue !== undefined && phoneValue !== null && typeof phoneValue !== 'string') {
    return { ok: false, error: 'Ingresa un teléfono válido.' };
  }
  const phone = readString(phoneValue) ?? '';
  if (phone && (!PHONE_PATTERN.test(phone) || phone.length > MAX_PHONE)) {
    return { ok: false, error: 'Ingresa un teléfono válido (entre 6 y 20 dígitos).' };
  }

  const companyValue = body.company;
  if (companyValue !== undefined && companyValue !== null && typeof companyValue !== 'string') {
    return { ok: false, error: 'Ingresa un nombre de empresa válido.' };
  }
  const company = readString(companyValue) ?? '';
  if (company.length > MAX_COMPANY) {
    return { ok: false, error: 'El nombre de la empresa es demasiado largo.' };
  }

  return {
    ok: true,
    value: {
      tier: tier as PlanTier,
      cadence: cadence as PlanCadence,
      name,
      email,
      phone: phone || undefined,
      company: company || undefined,
    },
  };
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'El cuerpo de la petición no es JSON válido.' },
      { status: 400 },
    );
  }

  const validated = validatePayload(payload);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const plan = getPlan(validated.value.tier);
    if (!plan) {
      return NextResponse.json(
        { error: 'El plan seleccionado no existe.' },
        { status: 400 },
      );
    }

    const order = await createOrderFromCheckout(validated.value);

    if (isMercadoPagoConfigured()) {
      const preference = await createPreference({
        reference: order.reference,
        title: `${plan.name} · ${CADENCE_LABEL[validated.value.cadence].label}`,
        description: plan.tagline,
        amountCents: order.amountCents,
        currency: order.currency,
        tier: validated.value.tier,
        cadence: validated.value.cadence,
        payerName: validated.value.name,
        payerEmail: validated.value.email,
      });

      if (preference.mode === 'mercadopago') {
        await saveOrderPreference(order.reference, preference.preferenceId);
        return NextResponse.json({
          url: preference.initPoint,
          reference: order.reference,
          mode: 'mercadopago',
        });
      }
    }

    return NextResponse.json({
      url: `/checkout/estado/${order.reference}`,
      reference: order.reference,
      mode: 'demo',
    });
  } catch (error) {
    console.error(
      '[checkout] no se pudo crear la orden:',
      error instanceof Error ? error.message : 'error desconocido',
    );
    return NextResponse.json(
      { error: 'No pudimos procesar tu solicitud. Intenta de nuevo en unos minutos.' },
      { status: 500 },
    );
  }
}

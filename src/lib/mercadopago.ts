import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import type { PlanCadence, PlanTier } from '@/lib/plans';

type PreferenceRequestBody = Parameters<Preference['create']>[0]['body'];
type PreferenceResult = Awaited<ReturnType<Preference['create']>>;
type PaymentResult = Awaited<ReturnType<Payment['get']>>;

interface MercadoPagoGlobals {
  mpToken?: string;
  mpPreference?: Preference;
  mpPayment?: Payment;
}

interface MercadoPagoServices {
  preference: Preference;
  payment: Payment;
}

export interface CreatePreferenceInput {
  reference: string;
  title: string;
  description?: string;
  amountCents: number;
  currency?: string;
  tier: PlanTier;
  cadence: PlanCadence;
  payerName?: string;
  payerEmail?: string;
}

export type CreatePreferenceOutcome =
  | { mode: 'mercadopago'; preferenceId: string; initPoint: string }
  | { mode: 'demo'; reason: 'missing_credentials' };

export type GetPaymentOutcome =
  | { mode: 'mercadopago'; payment: PaymentResult }
  | { mode: 'demo'; reason: 'missing_credentials' };

const globalStore = globalThis as typeof globalThis & MercadoPagoGlobals;

function getAccessToken(): string | null {
  const token = process.env.MP_ACCESS_TOKEN?.trim();
  return token ? token : null;
}

function getBaseUrl(): string {
  const base =
    process.env.MP_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    'http://localhost:3000';
  return base.replace(/\/+$/, '');
}

export function isMercadoPagoConfigured(): boolean {
  return getAccessToken() !== null;
}

function getServices(): MercadoPagoServices | null {
  const token = getAccessToken();
  if (!token) return null;

  let preference = globalStore.mpPreference;
  let payment = globalStore.mpPayment;

  if (!preference || !payment || globalStore.mpToken !== token) {
    const client = new MercadoPagoConfig({
      accessToken: token,
      options: { timeout: 10000 },
    });
    preference = new Preference(client);
    payment = new Payment(client);
    globalStore.mpToken = token;
    globalStore.mpPreference = preference;
    globalStore.mpPayment = payment;
  }

  return { preference, payment };
}

export async function createPreference(
  input: CreatePreferenceInput,
): Promise<CreatePreferenceOutcome> {
  const services = getServices();
  if (!services) return { mode: 'demo', reason: 'missing_credentials' };

  const baseUrl = getBaseUrl();
  const statusUrl = `${baseUrl}/checkout/estado/${input.reference}`;
  const autoReturn = getAccessToken() ? 'approved' : undefined;

  const body: PreferenceRequestBody = {
    items: [
      {
        id: input.reference,
        title: input.title,
        description: input.description,
        quantity: 1,
        unit_price: input.amountCents / 100,
        currency_id: input.currency ?? 'USD',
      },
    ],
    back_urls: { success: statusUrl, pending: statusUrl, failure: statusUrl },
    auto_return: autoReturn,
    external_reference: input.reference,
    notification_url: `${baseUrl}/api/webhooks/mercadopago`,
    statement_descriptor: 'MIRI ADS',
    metadata: {
      tier: input.tier,
      cadence: input.cadence,
      reference: input.reference,
      source: 'miri-ads-checkout',
    },
    payer: { name: input.payerName, email: input.payerEmail },
  };

  const response: PreferenceResult = await services.preference.create({ body });
  const preferenceId = response.id;
  const initPoint = response.init_point;

  if (!preferenceId || !initPoint) {
    throw new Error('MercadoPago no devolvió una preferencia de pago válida.');
  }

  return { mode: 'mercadopago', preferenceId, initPoint };
}

export async function getPayment(id: string): Promise<GetPaymentOutcome> {
  const services = getServices();
  if (!services) return { mode: 'demo', reason: 'missing_credentials' };

  const payment = await services.payment.get({ id });
  return { mode: 'mercadopago', payment };
}

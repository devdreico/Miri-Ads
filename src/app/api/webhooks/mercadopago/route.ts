import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { markOrderPaid, markOrderPaymentPending, markOrderRejected } from '@/lib/data/orders';
import { getPayment, isMercadoPagoConfigured } from '@/lib/mercadopago';

interface SignatureInput {
  secret: string;
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
}

function readParam(searchParams: URLSearchParams, key: string): string | null {
  const value = searchParams.get(key);
  return value && value.trim() ? value.trim() : null;
}

function readPaymentId(searchParams: URLSearchParams): string | null {
  return readParam(searchParams, 'data.id') ?? readParam(searchParams, 'id');
}

function parseSignatureHeader(header: string): { ts: string; hash: string } | null {
  let ts = '';
  let hash = '';

  for (const segment of header.split(',')) {
    const index = segment.indexOf('=');
    if (index === -1) continue;
    const key = segment.slice(0, index).trim().toLowerCase();
    const value = segment.slice(index + 1).trim();
    if (!key || !value) continue;
    if (key === 'ts') {
      ts = value;
    } else if (/^v\d+$/.test(key) && !hash) {
      hash = value;
    }
  }

  if (!ts || !hash || !/^\d+$/.test(ts)) return null;
  return { ts, hash };
}

function buildManifests(dataId: string | null, requestId: string | null, ts: string): string[] {
  const parts: string[] = [];
  if (dataId) parts.push(`id:${dataId}`);
  if (requestId) parts.push(`request-id:${requestId}`);
  parts.push(`ts:${ts}`);

  const manifests = new Set<string>();
  manifests.add(`${parts.join(';')};`);
  manifests.add(`ts:${ts};`);
  if (dataId) {
    manifests.add(`id:${dataId};ts:${ts};`);
    if (requestId) manifests.add(`id:${dataId};request-id:${requestId};ts:${ts};`);
  }
  if (requestId) manifests.add(`request-id:${requestId};ts:${ts};`);

  return Array.from(manifests);
}

function verifySignature(input: SignatureInput): boolean {
  if (!input.signature) return false;

  const parsed = parseSignatureHeader(input.signature);
  if (!parsed) return false;

  const received = Buffer.from(parsed.hash.toLowerCase(), 'hex');
  if (received.length === 0) return false;

  const manifests = buildManifests(input.dataId, input.requestId, parsed.ts);
  for (const manifest of manifests) {
    const expected = createHmac('sha256', input.secret).update(manifest).digest();
    if (expected.length === received.length && timingSafeEqual(expected, received)) {
      return true;
    }
  }

  return false;
}

async function syncMercadoPagoPayment(paymentId: string): Promise<void> {
  const result = await getPayment(paymentId);
  if (result.mode !== 'mercadopago') return;

  const payment = result.payment;
  const reference =
    typeof payment.external_reference === 'string' ? payment.external_reference.trim() : '';
  const externalId =
    payment.id === undefined || payment.id === null ? '' : String(payment.id);

  if (!reference || !externalId) return;

  const raw = payment;

  if (payment.status === 'approved') {
    await markOrderPaid({ reference, provider: 'MERCADOPAGO', externalId, raw });
    return;
  }

  if (payment.status === 'rejected' || payment.status === 'cancelled' || payment.status === 'expired') {
    await markOrderRejected({
      reference,
      provider: 'MERCADOPAGO',
      externalId,
      status: payment.status === 'cancelled' ? 'CANCELLED' : payment.status === 'expired' ? 'EXPIRED' : 'REJECTED',
      raw,
    });
    return;
  }

  await markOrderPaymentPending({ reference, provider: 'MERCADOPAGO', externalId, raw });
}

export async function POST(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const secret = process.env.MP_WEBHOOK_SECRET?.trim();

  if (secret) {
    const valid = verifySignature({
      secret,
      signature: request.headers.get('x-signature'),
      requestId: request.headers.get('x-request-id'),
      dataId: readParam(searchParams, 'data.id') ?? readParam(searchParams, 'id'),
    });

    if (!valid) {
      return NextResponse.json(
        { ok: false, error: 'La firma de la notificación no es válida.' },
        { status: 401 },
      );
    }
  }

  try {
    const type = readParam(searchParams, 'type') ?? readParam(searchParams, 'topic');
    const paymentId = readPaymentId(searchParams);

    if (type !== 'payment' || !paymentId || !isMercadoPagoConfigured()) {
      return NextResponse.json({ ok: true });
    }

    await syncMercadoPagoPayment(paymentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      '[webhook] no se pudo procesar la notificación:',
      error instanceof Error ? error.message : 'error desconocido',
    );
    return NextResponse.json(
      { ok: false, error: 'No pudimos procesar la notificación.' },
      { status: 500 },
    );
  }
}

export async function GET(): Promise<Response> {
  return NextResponse.json({ ok: true });
}

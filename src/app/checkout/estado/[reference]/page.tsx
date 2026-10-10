import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Order, OrderStatus } from '@prisma/client';
import { CheckoutSkeleton } from '@/components/checkout/CheckoutSkeleton';
import { Confetti } from '@/components/checkout/Confetti';
import { DemoPaymentPanel } from '@/components/checkout/DemoPaymentPanel';
import { Badge, GlassPanel, MagneticButton, Reveal } from '@/components/ui';
import { cx } from '@/components/ui/cx';
import { getOrderByReference } from '@/lib/data/orders';
import { formatDateTime, formatMoney } from '@/lib/format';
import { CADENCE_LABEL, type PlanCadence, type PlanTier } from '@/lib/plans';

export const metadata: Metadata = {
  title: 'Estado de tu pedido',
  description: 'Consulta el estado de tu compra y los siguientes pasos de tu campaña.',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pendiente de pago',
  PAID: 'Pago confirmado',
  REJECTED: 'Pago rechazado',
  EXPIRED: 'Pago expirado',
  CANCELLED: 'Pago cancelado',
};

const STATUS_CHIP: Record<OrderStatus, string> = {
  PENDING: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  PAID: 'border-aqua/40 bg-aqua/10 text-aqua shadow-[0_0_18px_-6px_rgba(47,230,200,0.55)]',
  REJECTED: 'border-red-400/40 bg-red-400/10 text-red-300',
  EXPIRED: 'border-red-400/40 bg-red-400/10 text-red-300',
  CANCELLED: 'border-red-400/40 bg-red-400/10 text-red-300',
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-500">
        {label}
      </dt>
      <dd
        className={cx(
          'text-base font-medium text-paper',
          mono && 'font-mono tracking-[0.08em] text-aqua',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function OrderFacts({ order }: { order: Order }) {
  const cadence = order.cadence.toLowerCase() as PlanCadence;
  const snapshot = asRecord(order.planSnapshot);
  const planName = typeof snapshot?.name === 'string' ? snapshot.name : order.tier;

  return (
    <GlassPanel className="p-6 sm:p-8" intensity={1}>
      <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Fact label="Referencia" value={order.reference} mono />
        <Fact label="Plan" value={`${planName} · ${CADENCE_LABEL[cadence].label}`} />
        <Fact label="Importe" value={formatMoney(order.amountCents, order.currency)} />
        <Fact label="Fecha" value={formatDateTime(order.createdAt)} />
        <Fact label="Correo de contacto" value={order.clientEmail} />
        <Fact label="Estado" value={STATUS_LABEL[order.status]} />
      </dl>
    </GlassPanel>
  );
}

function CampaignPreview({ order }: { order: Order }) {
  const snapshot = asRecord(order.planSnapshot);
  const tagline = typeof snapshot?.tagline === 'string' ? snapshot.tagline : null;
  const digital = asStringArray(snapshot?.digital);
  const physical = asStringArray(snapshot?.physical);

  if (!tagline && digital.length === 0 && physical.length === 0) return null;

  return (
    <GlassPanel className="flex flex-col gap-5 p-6 sm:p-8" intensity={1.1}>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-aqua">
          Tu campaña a partir de ahora
        </span>
        {tagline ? <p className="text-base leading-relaxed text-gray-300">{tagline}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/4 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-aqua">
            Producción digital
          </span>
          <div className="flex flex-wrap gap-2">
            {digital.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-ink-raised px-3 py-1 text-xs text-gray-300"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/4 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-300">
            Red física
          </span>
          <div className="flex flex-wrap gap-2">
            {physical.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-ink-raised px-3 py-1 text-xs text-gray-300"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

async function OrderStatusView({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const order = await getOrderByReference(reference);
  if (!order) notFound();

  const tier = order.tier.toLowerCase() as PlanTier;
  const isDemo = !order.mpPreferenceId;

  const headerByStatus: Record<OrderStatus, { title: string; description: string }> = {
    PENDING: {
      title: 'Te redirigimos al pago…',
      description:
        'Tu pedido está reservado. Si MercadoPago no se abrió automáticamente, vuelve al checkout para intentarlo de nuevo.',
    },
    PAID: {
      title: '¡Pedido confirmado!',
      description:
        'Tu primer ciclo: impresión el sábado · despliegue el lunes. Te escribimos a tu correo con el comprobante.',
    },
    REJECTED: {
      title: 'El pago no se completó',
      description:
        'MercadoPago rechazó el pago. No se realizó ningún cargo. Puedes intentarlo de nuevo con otro medio de pago.',
    },
    EXPIRED: {
      title: 'El tiempo de pago expiró',
      description:
        'La sesión de pago caducó antes de completarse. Vuelve al checkout para generar un nuevo enlace.',
    },
    CANCELLED: {
      title: 'El pago fue cancelado',
      description:
        'La operación se canceló antes de aprobarse. Puedes reintentar el pago cuando quieras.',
    },
  };

  const header = headerByStatus[order.status];

  return (
    <>
      {order.status === 'PAID' ? <Confetti /> : null}

      <header className="flex flex-col items-start gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cx(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em]',
              STATUS_CHIP[order.status],
            )}
          >
            {STATUS_LABEL[order.status]}
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-gray-500">
            {order.reference}
          </span>
        </div>
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-paper sm:text-5xl">
          {header.title}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-gray-400">{header.description}</p>
      </header>

      <OrderFacts order={order} />

      {order.status === 'PENDING' ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-amber-400/25 bg-amber-400/8 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-amber-100/90">
              Guarda tu referencia: te la pediremos si necesitas soporte con el pago.
            </p>
            <MagneticButton
              href={`/checkout/${tier}`}
              variant="outline"
              size="md"
              className="shrink-0"
            >
              Volver al checkout
            </MagneticButton>
          </div>
          {isDemo ? <DemoPaymentPanel reference={order.reference} /> : null}
        </div>
      ) : null}

      {order.status === 'PAID' ? (
        <Reveal delay={0.1} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-aqua/30 bg-aqua/8 p-6 sm:p-8">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-aqua">
              Próximos pasos
            </span>
            <ul className="flex flex-col gap-3 text-sm leading-relaxed text-gray-300">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-aqua" aria-hidden="true" />
                Tu primer ciclo: impresión el sábado · despliegue el lunes.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-aqua" aria-hidden="true" />
                Montamos el calendario editorial y te lo compartimos para aprobación.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-aqua" aria-hidden="true" />
                Primera evidencia geolocalizada en el panel antes del despliegue.
              </li>
            </ul>
          </div>

          <CampaignPreview order={order} />

          <div className="flex flex-wrap items-center gap-4">
            <MagneticButton href="/" variant="primary" size="lg">
              Volver al inicio
            </MagneticButton>
            <a
              href="mailto:hola@miriads.com"
              className="inline-flex h-14 items-center justify-center rounded-xl border border-aqua/50 px-8 text-base font-medium text-aqua transition-colors hover:border-aqua hover:bg-aqua/10"
            >
              Escribir a hola@miriads.com
            </a>
          </div>
        </Reveal>
      ) : null}

      {order.status === 'REJECTED' || order.status === 'EXPIRED' || order.status === 'CANCELLED' ? (
        <Reveal delay={0.1} className="flex flex-col gap-5 rounded-2xl border border-red-400/25 bg-red-400/8 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="neutral">Sin cargo realizado</Badge>
            <span className="text-sm text-gray-400">
              Referencia {order.reference} · {formatMoney(order.amountCents, order.currency)}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-gray-300">
            Tu pack sigue disponible. Al reintentar, el sistema conserva tus datos y la misma
            referencia de pedido.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <MagneticButton href={`/checkout/${tier}`} variant="primary" size="lg">
              Reintentar el pago
            </MagneticButton>
            <MagneticButton href="/" variant="ghost" size="lg">
              Volver al inicio
            </MagneticButton>
          </div>
        </Reveal>
      ) : null}
    </>
  );
}

export default function OrderStatusPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  return (
    <main className="relative z-10 container-page flex flex-col gap-8 py-14 sm:py-20">
      <Suspense fallback={<CheckoutSkeleton />}>
        <OrderStatusView params={params} />
      </Suspense>
    </main>
  );
}

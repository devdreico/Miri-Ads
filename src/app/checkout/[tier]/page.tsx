import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { PlanSummary } from '@/components/checkout/PlanSummary';
import { Badge, Reveal } from '@/components/ui';
import { getPlan, type PlanTier } from '@/lib/plans';

const TIERS: PlanTier[] = ['essential', 'pro', 'growth'];

export const metadata: Metadata = {
  title: 'Finaliza tu compra',
  description:
    'Elige la cadencia de tu pack, completa tus datos y paga de forma segura con MercadoPago. Sin permanencia.',
};

export const instant = false;

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ tier: string }>;
}) {
  const { tier } = await params;
  const normalized = tier.toLowerCase();

  if (!TIERS.includes(normalized as PlanTier)) notFound();
  const plan = getPlan(normalized);
  if (!plan) notFound();

  return (
    <main className="relative z-10 container-page flex flex-col gap-10 py-14 sm:py-20">
      <header className="flex flex-col items-start gap-4">
        <Badge tone="aqua" dot>
          Checkout seguro
        </Badge>
        <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-paper sm:text-5xl">
          Completa tu compra en tres pasos
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg">
          Sin cuenta ni registro: solo necesitamos tus datos de contacto para preparar tu
          campaña y enviarte el comprobante.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <PlanSummary plan={plan} />
        <CheckoutForm plan={plan} />
      </div>

      <Reveal delay={0.24}>
        <div className="flex flex-col gap-6 rounded-2xl border border-white/8 bg-white/4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-aqua">
              ¿Prefieres hablar primero?
            </span>
            <p className="text-sm leading-relaxed text-gray-400">
              Escríbenos y te armamos el plan a medida en menos de 24 horas.
            </p>
          </div>
          <a
            href="mailto:hola@miriads.com"
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl border border-aqua/50 px-6 text-sm font-medium text-aqua transition-colors hover:border-aqua hover:bg-aqua/10"
          >
            hola@miriads.com
          </a>
        </div>
      </Reveal>
    </main>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { Badge, GlassPanel, MagneticButton } from '@/components/ui';
import { approveDemoPayment, rejectDemoPayment } from '@/lib/actions/orders';

type DemoAction = (reference: string) => Promise<{ ok: boolean; error?: string }>;

interface Notice {
  tone: 'success' | 'error';
  text: string;
}

export function DemoPaymentPanel({ reference }: { reference: string }) {
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice | null>(null);

  function run(action: DemoAction) {
    startTransition(async () => {
      const result = await action(reference);
      setNotice(
        result.ok
          ? { tone: 'success', text: 'Simulación aplicada. Actualizamos el estado del pedido.' }
          : { tone: 'error', text: result.error ?? 'No pudimos simular el pago.' },
      );
    });
  }

  return (
    <GlassPanel className="flex flex-col gap-5 p-6 sm:p-8" intensity={1.1}>
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="neutral" dot>
          Simulación de pago
        </Badge>
        <span className="text-xs uppercase tracking-[0.16em] text-gray-500">
          Sin tarjeta · sin cargo real
        </span>
      </div>

      <p className="text-sm leading-relaxed text-gray-400">
        Esta orden se creó en modo demo. Aprueba o rechaza el pago para recorrer el flujo
        completo antes de conectar MercadoPago con credenciales reales.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <MagneticButton
          type="button"
          variant="primary"
          size="md"
          disabled={pending}
          onClick={() => run(approveDemoPayment)}
        >
          {pending ? 'Aplicando…' : 'Aprobar pago (demo)'}
        </MagneticButton>
        <MagneticButton
          type="button"
          variant="outline"
          size="md"
          disabled={pending}
          onClick={() => run(rejectDemoPayment)}
        >
          Rechazar pago (demo)
        </MagneticButton>
      </div>

      {notice ? (
        <p
          role="status"
          aria-live="polite"
          className={
            notice.tone === 'success'
              ? 'text-sm font-medium text-aqua'
              : 'text-sm font-medium text-red-400'
          }
        >
          {notice.text}
        </p>
      ) : null}
    </GlassPanel>
  );
}

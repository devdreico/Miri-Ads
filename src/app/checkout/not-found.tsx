import { Badge, GlassPanel, MagneticButton } from '@/components/ui';

export default function CheckoutNotFound() {
  return (
    <main className="relative z-10 container-page flex min-h-[70vh] flex-col items-center justify-center gap-6 py-20 text-center">
      <Badge tone="neutral" dot>
        Error 404
      </Badge>
      <GlassPanel className="flex max-w-xl flex-col items-center gap-6 p-8 sm:p-10" intensity={1.2}>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-paper sm:text-4xl">
          No encontramos esa página
        </h1>
        <p className="text-base leading-relaxed text-gray-400">
          El plan o la referencia del pedido que buscas no existe. Vuelve al inicio para ver los
          packs disponibles.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <MagneticButton href="/" variant="primary" size="lg">
            Volver al inicio
          </MagneticButton>
          <MagneticButton href="/checkout/pro" variant="outline" size="lg">
            Ver el pack Pro
          </MagneticButton>
        </div>
      </GlassPanel>
    </main>
  );
}

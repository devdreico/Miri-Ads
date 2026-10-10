'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Badge, GlassPanel } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { EvidenceCard, type EvidenceCardDto } from './EvidenceCard';
import { isFraudulent } from './fraud';

function Lightbox({ evidence, onClose }: { evidence: EvidenceCardDto; onClose: () => void }) {
  const fraud = isFraudulent(evidence.offRoute, evidence.distanceM);
  const coords =
    evidence.lat !== null && evidence.lng !== null
      ? `${evidence.lat.toFixed(6)}, ${evidence.lng.toFixed(6)}`
      : 'Sin coordenadas';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Cerrar vista ampliada"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-ink/85 backdrop-blur-md"
      />
      <GlassPanel
        className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden lg:flex-row"
        intensity={1.6}
      >
        <div className="relative min-h-56 flex-1 bg-ink-raised">
          <Image
            src={evidence.fileUrl}
            alt={`Evidencia de ${evidence.uploaderName}`}
            width={960}
            height={720}
            unoptimized
            className="h-full w-full object-contain"
          />
        </div>
        <div className="flex w-full flex-col gap-3 overflow-y-auto border-t border-white/10 p-5 lg:w-80 lg:border-l lg:border-t-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gray-500">
                Detalle de evidencia
              </p>
              <p className="mt-1 font-display text-lg text-paper">{evidence.uploaderName}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-gray-300 transition hover:border-aqua/40 hover:text-aqua"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-gray-400">{evidence.targetLabel}</p>

          {fraud ? (
            <span className="inline-flex w-fit items-center gap-1 rounded-full border border-red-400/50 bg-red-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-300">
              ⚠ Posible fraude
            </span>
          ) : (
            <Badge tone="aqua">Dentro de cobertura</Badge>
          )}

          <dl className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between gap-3 border-b border-white/6 pb-2">
              <dt className="text-gray-500">Coordenadas</dt>
              <dd className="text-right text-gray-200">{coords}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-white/6 pb-2">
              <dt className="text-gray-500">Precisión</dt>
              <dd className="text-right text-gray-200">
                {evidence.accuracyM !== null ? `±${Math.round(evidence.accuracyM)} m` : 'Sin dato'}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-white/6 pb-2">
              <dt className="text-gray-500">Hora de captura</dt>
              <dd className="text-right text-gray-200">
                {evidence.capturedAt ? formatDateTime(evidence.capturedAt) : 'Sin dato'}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-white/6 pb-2">
              <dt className="text-gray-500">Distancia al punto</dt>
              <dd className="text-right text-gray-200">
                {evidence.distanceM !== null ? `${evidence.distanceM} m` : 'Sin punto asociado'}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-white/6 pb-2">
              <dt className="text-gray-500">Estado</dt>
              <dd className="text-right text-gray-200">{evidence.status}</dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-white/6 pb-2">
              <dt className="text-gray-500">Hash (sha256)</dt>
              <dd className="break-all text-[10px] leading-relaxed text-gray-300">
                {evidence.hash ?? 'Sin hash'}
              </dd>
            </div>
          </dl>

          {evidence.watermark ? (
            <p className="rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-[10px] leading-relaxed text-gray-400">
              Marca de agua: {evidence.watermark}
            </p>
          ) : null}

          {evidence.status === 'REJECTED' && evidence.rejectReason ? (
            <p className="rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              Motivo de rechazo: {evidence.rejectReason}
            </p>
          ) : null}
        </div>
      </GlassPanel>
    </motion.div>
  );
}

export function EvidenceGrid({ items }: { items: EvidenceCardDto[] }) {
  const [selected, setSelected] = useState<EvidenceCardDto | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/12 px-6 py-16 text-center text-sm text-gray-500">
        No hay evidencias con ese filtro.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <EvidenceCard key={item.id} evidence={item} onOpen={() => setSelected(item)} />
        ))}
      </div>
      <AnimatePresence>
        {selected ? (
          <Lightbox evidence={selected} onClose={() => setSelected(null)} />
        ) : null}
      </AnimatePresence>
    </>
  );
}

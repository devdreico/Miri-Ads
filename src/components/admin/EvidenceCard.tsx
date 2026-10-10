'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Badge, GlassPanel } from '@/components/ui';
import { approveEvidence, rejectEvidence } from '@/lib/actions/admin';
import { formatDateTime } from '@/lib/format';
import { isFraudulent } from './fraud';

export interface EvidenceCardDto {
  id: string;
  kind: string;
  fileUrl: string;
  status: string;
  rejectReason: string | null;
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  capturedAt: string | null;
  uploaderName: string;
  targetLabel: string;
  hash: string | null;
  offRoute: boolean;
  distanceM: number | null;
  watermark: string | null;
}

export function EvidenceWatermark({ evidence }: { evidence: EvidenceCardDto }) {
  const time = evidence.capturedAt ? formatDateTime(evidence.capturedAt) : 'Sin hora';
  const coords =
    evidence.lat !== null && evidence.lng !== null
      ? `${evidence.lat.toFixed(5)}, ${evidence.lng.toFixed(5)}`
      : 'Sin GPS';
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/80 to-transparent px-3 pb-2 pt-8">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-aqua/90">{time}</p>
      <p className="text-[10px] text-gray-300">
        {coords}
        {evidence.accuracyM !== null ? ` · ±${Math.round(evidence.accuracyM)} m` : ''}
      </p>
    </div>
  );
}

export function EvidenceCard({
  evidence,
  onOpen,
  compact = false,
}: {
  evidence: EvidenceCardDto;
  onOpen?: () => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const fraud = isFraudulent(evidence.offRoute, evidence.distanceM);

  const statusTone =
    evidence.status === 'APPROVED' ? 'aqua' : evidence.status === 'REJECTED' ? 'dark' : 'neutral';
  const statusLabel =
    evidence.status === 'APPROVED'
      ? 'Aprobada'
      : evidence.status === 'REJECTED'
        ? 'Rechazada'
        : 'Pendiente';

  const handleApprove = (): void => {
    setMessage(null);
    startTransition(async () => {
      const result = await approveEvidence(evidence.id);
      setMessage(result.ok ? 'Evidencia aprobada.' : (result.error ?? 'No se pudo aprobar.'));
      router.refresh();
    });
  };

  const handleReject = (): void => {
    setMessage(null);
    startTransition(async () => {
      const result = await rejectEvidence(evidence.id, reason);
      if (result.ok) {
        setRejecting(false);
        setReason('');
        setMessage('Evidencia rechazada.');
      } else {
        setMessage(result.error ?? 'No se pudo rechazar.');
      }
      router.refresh();
    });
  };

  return (
    <GlassPanel className="flex h-full flex-col overflow-hidden" intensity={1.1}>
      <button
        type="button"
        onClick={onOpen}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-ink-raised"
      >
        <Image
          src={evidence.fileUrl}
          alt={`Evidencia de ${evidence.uploaderName}`}
          width={640}
          height={480}
          unoptimized
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <EvidenceWatermark evidence={evidence} />
        <span className="absolute right-2 top-2 flex gap-1.5">
          {fraud ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-400/50 bg-red-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-300">
              ⚠ Posible fraude
            </span>
          ) : null}
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-paper">{evidence.uploaderName}</p>
            <p className="text-[11px] leading-snug text-gray-500">{evidence.targetLabel}</p>
          </div>
          <Badge tone={statusTone} className="shrink-0 px-2 py-0.5 text-[9px]">
            {statusLabel}
          </Badge>
        </div>

        {evidence.status === 'REJECTED' && evidence.rejectReason ? (
          <p className="rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-[11px] text-gray-300">
            Motivo: {evidence.rejectReason}
          </p>
        ) : null}

        {evidence.status === 'PENDING' ? (
          <div className="mt-auto flex flex-col gap-2">
            {compact ? null : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onOpen}
                  className="h-9 flex-1 rounded-lg border border-white/12 bg-white/5 text-xs font-medium text-gray-300 transition hover:border-aqua/40 hover:text-aqua"
                >
                  Ver detalle
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleApprove}
                  className="h-9 flex-1 rounded-lg bg-aqua text-xs font-semibold text-ink transition hover:brightness-110 disabled:opacity-60"
                >
                  {isPending ? 'Guardando…' : 'Aprobar'}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setRejecting((value) => !value)}
                  className="h-9 rounded-lg border border-white/12 bg-white/5 px-3 text-xs font-medium text-gray-300 transition hover:border-red-400/40 hover:text-red-300"
                >
                  Rechazar
                </button>
              </div>
            )}
            {compact ? (
              <button
                type="button"
                disabled={isPending}
                onClick={handleApprove}
                className="h-9 rounded-lg bg-aqua text-xs font-semibold text-ink transition hover:brightness-110 disabled:opacity-60"
              >
                {isPending ? 'Guardando…' : 'Aprobar'}
              </button>
            ) : null}
            <AnimatePresence initial={false}>
              {rejecting ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="block text-[10px] uppercase tracking-[0.16em] text-gray-500">
                    Motivo del rechazo
                  </label>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    rows={2}
                    placeholder="Ej: la foto no muestra el cartel completo."
                    className="mt-1 w-full rounded-lg border border-white/12 bg-ink/70 px-3 py-2 text-xs text-paper outline-none transition-colors placeholder:text-gray-600 focus-visible:border-aqua"
                  />
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleReject}
                    className="mt-2 h-9 w-full rounded-lg bg-red-400/90 text-xs font-semibold text-ink transition hover:bg-red-300 disabled:opacity-60"
                  >
                    Confirmar rechazo
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
            {message ? <p className="text-[11px] text-aqua">{message}</p> : null}
          </div>
        ) : null}

        {evidence.status !== 'PENDING' && message ? (
          <p className="text-[11px] text-aqua">{message}</p>
        ) : null}
      </div>
    </GlassPanel>
  );
}

'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Badge, GlassPanel } from '@/components/ui';
import { completeStopWithoutPhoto } from '@/lib/actions/crew';

export interface CaptureStop {
  id: string;
  label: string;
  address: string | null;
  lat: number;
  lng: number;
  quantity: number;
  kind: string;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number): number => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(a)));
}

const KIND_LABELS: Record<string, string> = {
  FLYER: 'Volanteo',
  PASTE: 'Pegado',
  STICKER: 'Sticker',
  HANDBILL: 'Hoja',
};

export function CaptureEvidence({
  stop,
  uploaderId,
  onClose,
  onSuccess,
}: {
  stop: CaptureStop;
  uploaderId: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [geo, setGeo] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const distance = geo ? Math.round(haversineMeters(geo.lat, geo.lng, stop.lat, stop.lng)) : null;
  const outOfCoverage = distance !== null && distance > 200;

  const pickFile = (next: File | null): void => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next && next.type.startsWith('image/') ? URL.createObjectURL(next) : null);
    setSuccess(null);
    setError(null);
  };

  const locate = (): void => {
    setGeoError(null);
    setSuccess(null);
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización.');
      return;
    }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setGeoBusy(false);
      },
      () => {
        setGeoBusy(false);
        setGeoError('No pudimos leer tu GPS. Revisa los permisos del navegador.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const submit = (): void => {
    setError(null);
    setSuccess(null);
    if (!file) {
      setError('Adjunta una foto o un vídeo de la parada.');
      return;
    }
    if (!geo) {
      setError('Obtén tu ubicación GPS antes de enviar la evidencia.');
      return;
    }
    startTransition(async () => {
      try {
        const form = new FormData();
        form.append('file', file);
        form.append('stopId', stop.id);
        form.append('uploaderId', uploaderId);
        form.append('lat', String(geo.lat));
        form.append('lng', String(geo.lng));
        form.append('accuracy', String(geo.accuracy));
        form.append('capturedAt', new Date().toISOString());
        const response = await fetch('/api/evidence', { method: 'POST', body: form });
        const payload = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          offRoute?: boolean;
          error?: string;
        };
        if (!response.ok || !payload.ok) {
          setError(payload.error ?? 'No se pudo enviar la evidencia.');
          return;
        }
        setSuccess(
          payload.offRoute
            ? 'Evidencia enviada. Está fuera de la ruta y quedará marcada para revisión.'
            : 'Evidencia enviada. La parada quedó completada.',
        );
        setFile(null);
        if (preview) {
          URL.revokeObjectURL(preview);
          setPreview(null);
        }
        if (inputRef.current) inputRef.current.value = '';
        onSuccess?.();
        router.refresh();
      } catch {
        setError('No se pudo conectar con el servidor. Intenta nuevamente.');
      }
    });
  };

  const markWithoutPhoto = (): void => {
    setError(null);
    setSuccess(null);
    if (distance === null) return;
    startTransition(async () => {
      const result = await completeStopWithoutPhoto(stop.id, distance);
      if (result.ok) {
        setSuccess('Parada marcada sin foto por estar fuera de cobertura.');
        onSuccess?.();
        router.refresh();
      } else {
        setError(result.error ?? 'No se pudo marcar la parada.');
      }
    });
  };

  return (
    <GlassPanel className="flex flex-col gap-4 p-5" intensity={1.4}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gray-500">
            Captura de evidencia
          </p>
          <h3 className="mt-1 font-display text-lg text-paper">{stop.label}</h3>
          <p className="text-[11px] text-gray-500">
            {stop.address ?? 'Sin dirección'} · {KIND_LABELS[stop.kind] ?? stop.kind} ·{' '}
            {stop.quantity} unidades
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar panel de captura"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-gray-300 transition hover:border-aqua/40 hover:text-aqua"
        >
          ✕
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor={`capture-${stop.id}`} className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
            Foto o vídeo
          </label>
          <input
            ref={inputRef}
            id={`capture-${stop.id}`}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
            className="block w-full cursor-pointer rounded-xl border border-dashed border-white/15 bg-white/4 p-3 text-xs text-gray-300 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-aqua/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-aqua"
          />
          {preview ? (
            <div className="relative overflow-hidden rounded-xl border border-white/10">
              <Image
                src={preview}
                alt="Vista previa de la evidencia"
                width={480}
                height={320}
                className="h-40 w-full object-cover"
              />
            </div>
          ) : file ? (
            <p className="rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-[11px] text-gray-300">
              Vídeo seleccionado: {file.name}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.16em] text-gray-500">Ubicación</span>
          <button
            type="button"
            onClick={locate}
            disabled={geoBusy}
            className="h-11 rounded-xl border border-aqua/40 bg-aqua/10 text-sm font-semibold text-aqua transition hover:bg-aqua/20 disabled:opacity-60"
          >
            {geoBusy ? 'Obteniendo GPS…' : 'Usar mi GPS'}
          </button>
          {geo ? (
            <div className="rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-[11px] text-gray-300">
              <p className="tabular-nums text-paper">
                {geo.lat.toFixed(6)}, {geo.lng.toFixed(6)}
              </p>
              <p className="tabular-nums">Precisión: ±{Math.round(geo.accuracy)} m</p>
              {distance !== null ? (
                <p className={`mt-1 tabular-nums ${outOfCoverage ? 'text-red-300' : 'text-aqua'}`}>
                  Distancia al punto: {distance} m
                </p>
              ) : null}
            </div>
          ) : null}
          {geoError ? (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              {geoError}
            </p>
          ) : null}
          {outOfCoverage ? (
            <p className="rounded-xl border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-[11px] leading-relaxed text-amber-100">
              Estás fuera de la ruta ({distance} m) — la evidencia se marcará para revisión.
            </p>
          ) : null}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
          >
            {error}
          </motion.p>
        ) : null}
        {success ? (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-aqua/30 bg-aqua/10 px-3 py-2 text-xs text-aqua"
          >
            {success}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={submit}
          className="h-11 flex-1 rounded-xl bg-aqua px-4 text-sm font-semibold text-ink shadow-glow-aqua transition hover:brightness-110 disabled:opacity-60"
        >
          {isPending ? 'Enviando…' : 'Enviar evidencia'}
        </button>
        {outOfCoverage ? (
          <button
            type="button"
            disabled={isPending}
            onClick={markWithoutPhoto}
            className="h-11 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-medium text-paper transition hover:border-aqua/40 hover:text-aqua disabled:opacity-60"
          >
            Marcar sin foto
          </button>
        ) : null}
      </div>

      {outOfCoverage ? (
        <Badge tone="neutral">Fuera de cobertura · el administrador lo revisará</Badge>
      ) : null}
    </GlassPanel>
  );
}

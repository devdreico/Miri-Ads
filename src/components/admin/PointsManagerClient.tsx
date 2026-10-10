'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { Badge, GlassPanel } from '@/components/ui';
import {
  deleteAllowedZone,
  deleteStaticPoint,
  upsertAllowedZone,
  upsertStaticPoint,
} from '@/lib/actions/admin';
import { MapPanel, type MapPoint, type MapZone } from './MapPanel';

export interface PointDto {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  partnerName: string | null;
  surface: string | null;
  status: string;
  notes: string | null;
}

export interface ZoneDto {
  id: string;
  name: string;
  status: string;
  notes: string | null;
  ring: number[][];
}

const POINT_STATUS_OPTIONS = ['PROPOSED', 'ACTIVE', 'PAUSED'] as const;
const ZONE_STATUS_OPTIONS = ['PROPOSED', 'ACTIVE', 'PAUSED'] as const;

const STATUS_LABELS: Record<string, string> = {
  PROPOSED: 'Propuesto',
  ACTIVE: 'Activo',
  PAUSED: 'Pausado',
};

function emptyPointForm(): {
  id: string;
  name: string;
  address: string;
  partnerName: string;
  surface: string;
  lat: string;
  lng: string;
  status: string;
  notes: string;
} {
  return {
    id: '',
    name: '',
    address: '',
    partnerName: '',
    surface: '',
    lat: '',
    lng: '',
    status: 'ACTIVE',
    notes: '',
  };
}

function ringToCorners(ring: number[][]): { lat1: string; lng1: string; lat2: string; lng2: string } {
  if (ring.length < 2) return { lat1: '', lng1: '', lat2: '', lng2: '' };
  const lats = ring.map((corner) => corner[1] ?? 0);
  const lngs = ring.map((corner) => corner[0] ?? 0);
  return {
    lat1: String(Math.min(...lats)),
    lng1: String(Math.min(...lngs)),
    lat2: String(Math.max(...lats)),
    lng2: String(Math.max(...lngs)),
  };
}

function rectangleRing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number[][] {
  const minLat = Math.min(lat1, lat2);
  const maxLat = Math.max(lat1, lat2);
  const minLng = Math.min(lng1, lng2);
  const maxLng = Math.max(lng1, lng2);
  return [
    [minLng, minLat],
    [maxLng, minLat],
    [maxLng, maxLat],
    [minLng, maxLat],
    [minLng, minLat],
  ];
}

export function PointsManagerClient({
  points,
  zones,
  center,
}: {
  points: PointDto[];
  zones: ZoneDto[];
  center: [number, number];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: center[0],
    lng: center[1],
  });
  const [pointForm, setPointForm] = useState(emptyPointForm());
  const [zoneForm, setZoneForm] = useState({
    id: '',
    name: '',
    status: 'ACTIVE',
    notes: '',
    lat1: '',
    lng1: '',
    lat2: '',
    lng2: '',
  });

  const mapPoints: MapPoint[] = points.map((point) => ({
    id: point.id,
    name: point.name,
    address: point.address,
    lat: point.lat,
    lng: point.lng,
    status: STATUS_LABELS[point.status] ?? point.status,
    extra: point.partnerName ?? undefined,
  }));

  const mapZones: MapZone[] = zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    status: STATUS_LABELS[zone.status] ?? zone.status,
    ring: zone.ring,
  }));

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPointForm((form) => ({
      ...form,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
    }));
  }, []);

  const handleCenterChange = useCallback((lat: number, lng: number) => {
    setMapCenter({ lat, lng });
  }, []);

  const loadPoint = (point: PointDto): void => {
    setPointForm({
      id: point.id,
      name: point.name,
      address: point.address,
      partnerName: point.partnerName ?? '',
      surface: point.surface ?? '',
      lat: String(point.lat),
      lng: String(point.lng),
      status: point.status,
      notes: point.notes ?? '',
    });
    setMessage(null);
  };

  const loadZone = (zone: ZoneDto): void => {
    const corners = ringToCorners(zone.ring);
    setZoneForm({
      id: zone.id,
      name: zone.name,
      status: zone.status,
      notes: zone.notes ?? '',
      ...corners,
    });
    setMessage(null);
  };

  const submitPoint = (): void => {
    setMessage(null);
    startTransition(async () => {
      const result = await upsertStaticPoint({
        id: pointForm.id || undefined,
        name: pointForm.name,
        address: pointForm.address,
        lat: Number(pointForm.lat),
        lng: Number(pointForm.lng),
        partnerName: pointForm.partnerName,
        surface: pointForm.surface,
        status: pointForm.status,
        notes: pointForm.notes,
      });
      setMessage(result.ok ? 'Punto guardado.' : (result.error ?? 'No se pudo guardar.'));
      if (result.ok) {
        setPointForm(emptyPointForm());
        router.refresh();
      }
    });
  };

  const submitZone = (): void => {
    setMessage(null);
    const lat1 = Number(zoneForm.lat1);
    const lng1 = Number(zoneForm.lng1);
    const lat2 = Number(zoneForm.lat2);
    const lng2 = Number(zoneForm.lng2);
    startTransition(async () => {
      const result = await upsertAllowedZone({
        id: zoneForm.id || undefined,
        name: zoneForm.name,
        status: zoneForm.status,
        notes: zoneForm.notes,
        polygon: { type: 'Polygon', coordinates: [rectangleRing(lat1, lng1, lat2, lng2)] },
      });
      setMessage(result.ok ? 'Zona guardada.' : (result.error ?? 'No se pudo guardar.'));
      if (result.ok) {
        setZoneForm({ id: '', name: '', status: 'ACTIVE', notes: '', lat1: '', lng1: '', lat2: '', lng2: '' });
        router.refresh();
      }
    });
  };

  const removePoint = (point: PointDto): void => {
    if (!window.confirm(`¿Eliminar el punto "${point.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteStaticPoint(point.id);
      setMessage(result.ok ? 'Punto eliminado.' : (result.error ?? 'No se pudo eliminar.'));
      if (result.ok) router.refresh();
    });
  };

  const removeZone = (zone: ZoneDto): void => {
    if (!window.confirm(`¿Eliminar la zona "${zone.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteAllowedZone(zone.id);
      setMessage(result.ok ? 'Zona eliminada.' : (result.error ?? 'No se pudo eliminar.'));
      if (result.ok) router.refresh();
    });
  };

  const inputClass =
    'h-10 w-full rounded-lg border border-white/12 bg-ink/70 px-3 text-sm text-paper outline-none transition-colors placeholder:text-gray-600 hover:border-aqua/40 focus-visible:border-aqua disabled:opacity-60';

  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <div className="flex flex-col gap-4">
        <MapPanel
          className="h-[520px] w-full"
          points={mapPoints}
          zones={mapZones}
          selectable
          onMapClick={handleMapClick}
          onCenterChange={handleCenterChange}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">
            Centro del mapa: {mapCenter.lat.toFixed(5)}, {mapCenter.lng.toFixed(5)}
          </Badge>
          <Badge tone="aqua">Haz clic en el mapa para fijar coordenadas</Badge>
          {message ? <Badge tone="aqua">{message}</Badge> : null}
        </div>

        <GlassPanel className="p-5" intensity={1.1}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gray-500">
                Inventario físico
              </p>
              <h2 className="mt-1 font-display text-xl text-paper">Puntos geolocalizados</h2>
            </div>
            <button
              type="button"
              onClick={() => setPointForm(emptyPointForm())}
              className="h-9 rounded-lg border border-white/12 bg-white/5 px-3 text-xs font-medium text-gray-300 transition hover:border-aqua/40 hover:text-aqua"
            >
              Nuevo punto
            </button>
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {points.map((point) => (
              <li
                key={point.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-paper">{point.name}</p>
                  <p className="truncate text-[11px] text-gray-500">
                    {point.address} · {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                  </p>
                </div>
                <Badge tone={point.status === 'ACTIVE' ? 'aqua' : 'neutral'} className="px-2 py-0.5 text-[9px]">
                  {STATUS_LABELS[point.status] ?? point.status}
                </Badge>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => loadPoint(point)}
                    className="h-8 rounded-lg border border-white/12 bg-white/5 px-3 text-[11px] text-gray-300 transition hover:border-aqua/40 hover:text-aqua"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => removePoint(point)}
                    className="h-8 rounded-lg border border-white/12 bg-white/5 px-3 text-[11px] text-gray-300 transition hover:border-red-400/40 hover:text-red-300"
                  >
                    Borrar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </GlassPanel>

        <GlassPanel className="p-5" intensity={1.1}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gray-500">
                Cobertura permitida
              </p>
              <h2 className="mt-1 font-display text-xl text-paper">Zonas de volanteo</h2>
            </div>
            <button
              type="button"
              onClick={() =>
                setZoneForm({ id: '', name: '', status: 'ACTIVE', notes: '', lat1: '', lng1: '', lat2: '', lng2: '' })
              }
              className="h-9 rounded-lg border border-white/12 bg-white/5 px-3 text-xs font-medium text-gray-300 transition hover:border-aqua/40 hover:text-aqua"
            >
              Nueva zona
            </button>
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {zones.map((zone) => (
              <li
                key={zone.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-paper">{zone.name}</p>
                  <p className="truncate text-[11px] text-gray-500">
                    {zone.notes ?? 'Sin notas'} · {zone.ring.length} vértices
                  </p>
                </div>
                <Badge tone={zone.status === 'ACTIVE' ? 'aqua' : 'neutral'} className="px-2 py-0.5 text-[9px]">
                  {STATUS_LABELS[zone.status] ?? zone.status}
                </Badge>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => loadZone(zone)}
                    className="h-8 rounded-lg border border-white/12 bg-white/5 px-3 text-[11px] text-gray-300 transition hover:border-aqua/40 hover:text-aqua"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => removeZone(zone)}
                    className="h-8 rounded-lg border border-white/12 bg-white/5 px-3 text-[11px] text-gray-300 transition hover:border-red-400/40 hover:text-red-300"
                  >
                    Borrar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </GlassPanel>
      </div>

      <div className="flex flex-col gap-6">
        <GlassPanel className="p-5" intensity={1.3}>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gray-500">
            {pointForm.id ? 'Editar punto' : 'Nuevo punto'}
          </p>
          <h2 className="mt-1 font-display text-xl text-paper">Ficha del punto estático</h2>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="point-name" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                Nombre
              </label>
              <input
                id="point-name"
                value={pointForm.name}
                onChange={(event) => setPointForm({ ...pointForm, name: event.target.value })}
                placeholder="Mural Av. Larco 780"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="point-address" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                Dirección
              </label>
              <input
                id="point-address"
                value={pointForm.address}
                onChange={(event) => setPointForm({ ...pointForm, address: event.target.value })}
                placeholder="Av. Larco 780, Miraflores"
                className={inputClass}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="point-partner" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                  Socio comercial
                </label>
                <input
                  id="point-partner"
                  value={pointForm.partnerName}
                  onChange={(event) => setPointForm({ ...pointForm, partnerName: event.target.value })}
                  placeholder="Café Tostado"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="point-surface" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                  Superficie
                </label>
                <input
                  id="point-surface"
                  value={pointForm.surface}
                  onChange={(event) => setPointForm({ ...pointForm, surface: event.target.value })}
                  placeholder="Fachada 4×3 m"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="point-lat" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                  Latitud
                </label>
                <input
                  id="point-lat"
                  value={pointForm.lat}
                  onChange={(event) => setPointForm({ ...pointForm, lat: event.target.value })}
                  placeholder="-12.121500"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="point-lng" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                  Longitud
                </label>
                <input
                  id="point-lng"
                  value={pointForm.lng}
                  onChange={(event) => setPointForm({ ...pointForm, lng: event.target.value })}
                  placeholder="-77.030000"
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setPointForm((form) => ({
                  ...form,
                  lat: mapCenter.lat.toFixed(6),
                  lng: mapCenter.lng.toFixed(6),
                }))
              }
              className="h-10 rounded-lg border border-aqua/40 bg-aqua/10 text-xs font-medium text-aqua transition hover:bg-aqua/20"
            >
              Tomar coordenadas del centro del mapa
            </button>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="point-status" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                  Estado
                </label>
                <select
                  id="point-status"
                  value={pointForm.status}
                  onChange={(event) => setPointForm({ ...pointForm, status: event.target.value })}
                  className={inputClass}
                >
                  {POINT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status} className="bg-ink">
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="point-notes" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                  Notas
                </label>
                <input
                  id="point-notes"
                  value={pointForm.notes}
                  onChange={(event) => setPointForm({ ...pointForm, notes: event.target.value })}
                  placeholder="Buena iluminación nocturna"
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={submitPoint}
              className="h-11 rounded-xl bg-aqua text-sm font-semibold text-ink shadow-glow-aqua transition hover:brightness-110 disabled:opacity-60"
            >
              {isPending ? 'Guardando…' : pointForm.id ? 'Guardar cambios' : 'Crear punto'}
            </button>
          </div>
        </GlassPanel>

        <GlassPanel className="p-5" intensity={1.3}>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gray-500">
            {zoneForm.id ? 'Editar zona' : 'Nueva zona'}
          </p>
          <h2 className="mt-1 font-display text-xl text-paper">Rectángulo de cobertura</h2>
          <p className="mt-1 text-[11px] text-gray-500">
            Define dos esquinas opuestas; se serializa como GeoJSON Polygon.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="zone-name" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                Nombre
              </label>
              <input
                id="zone-name"
                value={zoneForm.name}
                onChange={(event) => setZoneForm({ ...zoneForm, name: event.target.value })}
                placeholder="Zona Miraflores — Residencial"
                className={inputClass}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="zone-lat1" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                  Esquina 1 · lat
                </label>
                <input
                  id="zone-lat1"
                  value={zoneForm.lat1}
                  onChange={(event) => setZoneForm({ ...zoneForm, lat1: event.target.value })}
                  placeholder="-12.112"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="zone-lng1" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                  Esquina 1 · lng
                </label>
                <input
                  id="zone-lng1"
                  value={zoneForm.lng1}
                  onChange={(event) => setZoneForm({ ...zoneForm, lng1: event.target.value })}
                  placeholder="-77.04"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="zone-lat2" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                  Esquina 2 · lat
                </label>
                <input
                  id="zone-lat2"
                  value={zoneForm.lat2}
                  onChange={(event) => setZoneForm({ ...zoneForm, lat2: event.target.value })}
                  placeholder="-12.13"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="zone-lng2" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                  Esquina 2 · lng
                </label>
                <input
                  id="zone-lng2"
                  value={zoneForm.lng2}
                  onChange={(event) => setZoneForm({ ...zoneForm, lng2: event.target.value })}
                  placeholder="-77.025"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="zone-status" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                  Estado
                </label>
                <select
                  id="zone-status"
                  value={zoneForm.status}
                  onChange={(event) => setZoneForm({ ...zoneForm, status: event.target.value })}
                  className={inputClass}
                >
                  {ZONE_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status} className="bg-ink">
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="zone-notes" className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                  Notas
                </label>
                <input
                  id="zone-notes"
                  value={zoneForm.notes}
                  onChange={(event) => setZoneForm({ ...zoneForm, notes: event.target.value })}
                  placeholder="Volanteo permitido Lun a Sáb"
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={submitZone}
              className="h-11 rounded-xl bg-aqua text-sm font-semibold text-ink shadow-glow-aqua transition hover:brightness-110 disabled:opacity-60"
            >
              {isPending ? 'Guardando…' : zoneForm.id ? 'Guardar cambios' : 'Crear zona'}
            </button>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

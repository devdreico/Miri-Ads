'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polygon, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';

export interface MapPoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: string;
  extra?: string;
}

export interface MapZone {
  id: string;
  name: string;
  status: string;
  ring: number[][];
}

export interface MapViewProps {
  points: MapPoint[];
  zones: MapZone[];
  selectable?: boolean;
  center?: [number, number];
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  onCenterChange?: (lat: number, lng: number) => void;
  className?: string;
}

const GLASS_CSS = `
.leaflet-container { background: #0b0f14; font-family: inherit; }
.leaflet-tile { filter: grayscale(0.45) brightness(0.82) contrast(1.08); }
.leaflet-popup.miri-popup .leaflet-popup-content-wrapper,
.leaflet-popup.miri-popup .leaflet-popup-tip {
  background: rgba(11, 15, 20, 0.94);
  color: #fafafa;
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(18px) saturate(160%);
  box-shadow: 0 24px 60px -30px rgba(0, 0, 0, 0.95);
  border-radius: 14px;
}
.leaflet-popup.miri-popup .leaflet-popup-content { margin: 12px 16px; }
.leaflet-popup.miri-popup .leaflet-popup-tip-container { filter: drop-shadow(0 1px 0 rgba(255,255,255,0.1)); }
.leaflet-container a.leaflet-popup-close-button { color: #9aa4aa; }
.leaflet-control-attribution { background: rgba(11, 15, 20, 0.8) !important; color: #6b757c !important; }
.leaflet-control-attribution a { color: #9aa4aa !important; }
`;

const markerIcon = L.divIcon({
  className: 'miri-map-marker',
  html: '<span style="position:absolute;inset:0;display:block"><span class="absolute inset-0 animate-pulse-ring rounded-full bg-aqua/40"></span><span class="absolute inset-[4px] rounded-full bg-aqua ring-2 ring-ink" style="box-shadow:0 0 14px rgba(47,230,200,0.95)"></span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10],
});

function ClickBinder({
  selectable,
  onMapClick,
}: {
  selectable: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      if (!selectable || !onMapClick) return;
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function CenterReporter({ onCenterChange }: { onCenterChange?: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!onCenterChange) return;
    const report = (): void => {
      const center = map.getCenter();
      onCenterChange(center.lat, center.lng);
    };
    report();
    map.on('moveend', report);
    return () => {
      map.off('moveend', report);
    };
  }, [map, onCenterChange]);
  return null;
}

function zonePositions(ring: number[][]): [number, number][] {
  return ring.map((corner) => [corner[1] ?? 0, corner[0] ?? 0] as [number, number]);
}

export default function MapView({
  points,
  zones,
  selectable = false,
  center = [-12.05, -77.04],
  zoom = 12,
  onMapClick,
  onCenterChange,
  className,
}: MapViewProps) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <style dangerouslySetInnerHTML={{ __html: GLASS_CSS }} />
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full rounded-2xl border border-white/10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickBinder selectable={selectable} onMapClick={onMapClick} />
        <CenterReporter onCenterChange={onCenterChange} />
        {zones.map((zone) => (
          <Polygon
            key={zone.id}
            positions={zonePositions(zone.ring)}
            pathOptions={{
              color: '#2FE6C8',
              weight: 1.6,
              fillColor: 'rgba(47, 230, 200, 0.10)',
              fillOpacity: 0.55,
            }}
          >
            <Popup className="miri-popup">
              <div className="min-w-40 text-left">
                <p className="font-display text-sm text-aqua">{zone.name}</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-gray-400">
                  Zona permitida · {zone.status}
                </p>
              </div>
            </Popup>
          </Polygon>
        ))}
        {points.map((point) => (
          <Marker key={point.id} position={[point.lat, point.lng]} icon={markerIcon}>
            <Popup className="miri-popup">
              <div className="min-w-44 text-left">
                <p className="font-display text-sm text-paper">{point.name}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-gray-400">{point.address}</p>
                {point.extra ? <p className="mt-1 text-[11px] text-aqua">{point.extra}</p> : null}
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-gray-500">
                  {point.status}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

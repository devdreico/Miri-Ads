"use client";

import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import { useMemo } from "react";
import { MapContainer, Marker, Polygon, Popup, TileLayer } from "react-leaflet";

interface Pin {
  lat: number;
  lng: number;
  label: string;
}

const PINS: Pin[] = [
  { lat: -12.1183, lng: -77.0365, label: "Miraflores · pendón Av. Pardo" },
  { lat: -12.1434, lng: -77.0239, label: "Barranco · ruta peatonal" },
  { lat: -12.1219, lng: -77.0598, label: "Surco · volanteo Zona Sur" },
  { lat: -12.0965, lng: -77.0362, label: "San Isidro · lobby corporativo" },
  { lat: -12.1056, lng: -77.0453, label: "Lince · activación barrial" },
  { lat: -12.0746, lng: -77.0456, label: "Jesús María · punto estático" },
];

const ZONE_ONE: [number, number][] = [
  [-12.1558, -77.0548],
  [-12.1558, -77.0148],
  [-12.1042, -77.0148],
  [-12.1042, -77.0548],
];

const ZONE_TWO: [number, number][] = [
  [-12.1148, -77.0672],
  [-12.1148, -77.0468],
  [-12.0884, -77.0468],
  [-12.0884, -77.0672],
];

const pinIcon = () =>
  L.divIcon({
    className: "miri-pin",
    html: `<span class="relative flex h-6 w-6 items-center justify-center"><span class="absolute inset-0 rounded-full bg-aqua/35 animate-pulse-ring"></span><span class="absolute inset-0 rounded-full border border-aqua/60"></span><span class="relative h-2.5 w-2.5 rounded-full bg-aqua shadow-[0_0_14px_rgba(47,230,200,0.95)]"></span></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });

export default function NetworkMap() {
  const icons = useMemo(() => PINS.map(() => pinIcon()), []);

  return (
    <div
      role="region"
      aria-label="Mapa de la red física Miri en Lima con seis puntos activos y dos zonas permitidas"
      className="isolate h-[420px] overflow-hidden rounded-2xl border border-white/12 bg-ink-raised [&_.leaflet-bar]:border-white/15 [&_.leaflet-bar]:bg-ink/85 [&_.leaflet-bar a]:border-white/10 [&_.leaflet-bar a]:bg-transparent [&_.leaflet-bar a]:text-gray-300 [&_.leaflet-bar a]:hover:bg-white/10 [&_.leaflet-control-attribution]:bg-ink/80 [&_.leaflet-control-attribution]:text-gray-500 [&_.leaflet-popup-content-wrapper]:rounded-xl [&_.leaflet-popup-content-wrapper]:border [&_.leaflet-popup-content-wrapper]:border-aqua/30 [&_.leaflet-popup-content-wrapper]:bg-ink/95 [&_.leaflet-popup-content-wrapper]:text-gray-200 [&_.leaflet-popup-tip]:bg-ink/95 [&_.leaflet-tile-pane]:brightness-[0.62] [&_.leaflet-tile-pane]:contrast-[1.15] [&_.leaflet-tile-pane]:grayscale"
    >
      <MapContainer
        center={[-12.1068, -77.0429]}
        zoom={12}
        scrollWheelZoom={false}
        zoomControl
        attributionControl
        className="h-full w-full"
        style={{ background: "#0b0f14" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <Polygon
          positions={ZONE_ONE}
          pathOptions={{
            color: "#2FE6C8",
            weight: 2,
            dashArray: "7 7",
            fillColor: "#2FE6C8",
            fillOpacity: 0.07,
          }}
        />
        <Polygon
          positions={ZONE_TWO}
          pathOptions={{
            color: "#0FB5A1",
            weight: 1.5,
            dashArray: "4 8",
            fillColor: "#0FB5A1",
            fillOpacity: 0.05,
          }}
        />
        {PINS.map((pin, index) => (
          <Marker key={pin.label} position={[pin.lat, pin.lng]} icon={icons[index]}>
            <Popup>{pin.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

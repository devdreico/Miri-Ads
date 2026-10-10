"use client";

import dynamic from "next/dynamic";
import { Badge, Reveal, SectionHeading } from "@/components/ui";
import { ArrowIcon } from "./icons";

function MapFallback() {
  return (
    <div
      className="h-[420px] animate-shimmer rounded-2xl border border-white/12 bg-ink-raised"
      aria-hidden="true"
    />
  );
}

const NetworkMap = dynamic(() => import("./NetworkMap"), {
  ssr: false,
  loading: () => <MapFallback />,
});

interface Row {
  label: string;
  standing: string;
  street: string;
}

const ROWS: Row[] = [
  {
    label: "Formato",
    standing: "Pendón, vinilo y volante impreso en puntos fijos de alta afluencia.",
    street: "Ruta peatonal, activación en sitio y micro-vídeos grabados en movimiento.",
  },
  {
    label: "Mecanismo",
    standing: "Geo-cercas con horarios fijos y turnos reservados por zona.",
    street: "Crew asignada por turnos, con seguimiento de la ruta en tiempo real.",
  },
  {
    label: "Prueba de valor",
    standing: "Foto geolocalizada con timestamp que sube al dashboard del cliente.",
    street: "Trackeo de ruta, paradas completadas y evidencia foto o video por hito.",
  },
  {
    label: "Enfoque",
    standing: "Recuerdo de marca sostenido en el barrio donde ya te compran.",
    street: "Cobertura amplia y respuesta inmediata, del anuncio a la compra.",
  },
];

export default function Phygital() {
  return (
    <section
      id="phygital"
      data-scene-stage="physical"
      className="relative scroll-mt-24 py-24 sm:py-32 lg:py-40"
    >
      <div className="container-page flex flex-col gap-12">
        <SectionHeading
          eyebrow="Miri Physical"
          title="Tu marca sale a la calle con GPS"
          description="Dos vertientes, un mismo estándar: todo lo que imprimimos sale con coordenadas, hora y responsable. Si no hay evidencia, no se factura."
          className="max-w-3xl"
        />

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-ink/45 backdrop-blur-[3px]">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">
              Comparación entre la vertiente estática y la vertiente móvil de Miri
              Physical
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="glass w-[22%] rounded-tl-2xl px-5 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500"
                >
                  Vertiente
                </th>
                <th
                  scope="col"
                  className="glass px-5 py-4 font-display text-base font-semibold text-paper sm:text-lg"
                >
                  Estática
                </th>
                <th
                  scope="col"
                  className="glass rounded-tr-2xl border-aqua/30 bg-aqua/10 px-5 py-4 font-display text-base font-semibold text-aqua sm:text-lg"
                >
                  Móvil · Street
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, index) => (
                <Reveal
                  as="tr"
                  key={row.label}
                  delay={0.08 * index}
                  y={16}
                  className="border-t border-white/8"
                >
                  <th
                    scope="row"
                    className="bg-ink/60 px-5 py-5 align-top text-xs font-medium uppercase tracking-[0.16em] text-gray-300"
                  >
                    {row.label}
                  </th>
                  <td className="bg-ink/50 px-5 py-5 align-top text-sm leading-relaxed text-gray-200">
                    {row.standing}
                  </td>
                  <td className="bg-aqua/[0.06] px-5 py-5 align-top text-sm leading-relaxed text-paper">
                    {row.street}
                  </td>
                </Reveal>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="aqua" dot>
              Red activa en Lima
            </Badge>
            <Badge tone="neutral">6 puntos de ejemplo</Badge>
            <Badge tone="neutral">2 zonas permitidas</Badge>
          </div>
          <p className="max-w-2xl rounded-2xl bg-ink/50 px-4 py-3 text-sm leading-relaxed text-gray-100 backdrop-blur-[3px]">
            Operamos únicamente dentro de zonas permitidas y con permiso
            municipal vigente. Antes de cada despliegue validamos la geo-cerca;
            después, la evidencia se sube firmada con hora, coordenadas y
            responsable de turno.
          </p>
          <a
            href="#logistica"
            className="group inline-flex w-fit items-center gap-2 text-sm font-medium text-aqua transition-colors hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua"
          >
            Ver el ciclo semanal
            <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>

        <NetworkMap />
      </div>
    </section>
  );
}

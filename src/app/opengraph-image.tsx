import { ImageResponse } from "next/og";

export const alt = "Miri Ads — Publicidad phygital con trazabilidad real";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "radial-gradient(70% 60% at 72% 40%, rgba(47,230,200,0.16) 0%, rgba(5,7,10,0) 70%), #05070a",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              border: "2px solid rgba(47,230,200,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2fe6c8",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>
            Miri Ads
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: "#fafafa",
            }}
          >
            Del pixel al pendón:
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: "#2fe6c8",
            }}
          >
            publicidad que se prueba
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 26, color: "#9aa4aa", fontWeight: 500 }}>
            Packs digitales + red física con evidencia geolocalizada
          </div>
          <div style={{ fontSize: 22, color: "#6b757c", fontWeight: 500 }}>
            Nacida en Bogotá, Colombia · miriads.presentto.online
          </div>
        </div>
      </div>
    ),
    size,
  );
}

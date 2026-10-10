import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/layout";
import { AmbientBackground } from "@/components/background/AmbientBackground";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-title",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Miri Ads — Publicidad Phygital con trazabilidad real",
    template: "%s · Miri Ads",
  },
  description:
    "Agencia híbrida de publicidad: paquetes digitales escalables y una red Uberizada de publicidad física de bajo costo con evidencia geolocalizada comprobable.",
  keywords: [
    "publicidad phygital",
    "agencia digital",
    "pauta local",
    "volanteo con GPS",
    "pendones geolocalizados",
    "Miri Ads",
  ],
  openGraph: {
    type: "website",
    locale: "es_LA",
    siteName: "Miri Ads",
    title: "Miri Ads — Publicidad Phygital con trazabilidad real",
    description:
      "Del pixel al pendón: packs digitales + red física con evidencia geolocalizada.",
  },
  twitter: { card: "summary_large_image", title: "Miri Ads", description: "Publicidad Phygital con trazabilidad real." },
};

export const viewport: Viewport = {
  themeColor: "#05070A",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full bg-ink text-paper font-sans selection:bg-aqua selection:text-ink">
        <Providers>
          <AmbientBackground />
          {children}
        </Providers>
      </body>
    </html>
  );
}

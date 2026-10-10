import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { Providers } from "@/components/layout";
import { AmbientBackground } from "@/components/background/AmbientBackground";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://miriads.presentto.online";

const THEME_INIT = `try{var t=localStorage.getItem("miri-theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){document.documentElement.dataset.theme="dark";document.documentElement.style.colorScheme="dark"}`;

const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Miri Ads",
  url: SITE_URL,
  logo: `${SITE_URL}/logo/miri-ads-logo.png`,
  description:
    "Agencia phygital nacida en Bogotá, Colombia: packs digitales y red física uberizada con evidencia geolocalizada.",
  foundingLocation: {
    "@type": "Place",
    name: "Bogotá, Colombia",
  },
  parentOrganization: {
    "@type": "Organization",
    name: "Soverath Holding",
    url: "https://soverath.presentto.online",
  },
  sameAs: [
    "https://soverath.presentto.online",
    "https://aperion.presentto.online",
    "https://miria.presentto.online",
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Miri Ads — Publicidad phygital con trazabilidad real · Bogotá",
    template: "%s · Miri Ads",
  },
  description:
    "Agencia phygital nacida en Bogotá, Colombia: packs digitales escalables y red física uberizada con evidencia geolocalizada comprobable. Coordinada por Soverath Holding.",
  keywords: [
    "publicidad phygital",
    "agencia digital Bogotá",
    "pauta local Colombia",
    "volanteo con GPS",
    "pendones geolocalizados",
    "evidencia geolocalizada",
    "Miri Ads",
  ],
  openGraph: {
    type: "website",
    locale: "es_LA",
    siteName: "Miri Ads",
    url: SITE_URL,
    title: "Miri Ads — Publicidad phygital con trazabilidad real",
    description:
      "Del pixel al pendón: packs digitales + red física con evidencia geolocalizada. Nacida en Bogotá, Colombia.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Miri Ads — Publicidad phygital con trazabilidad real",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Miri Ads — Publicidad phygital",
    description:
      "Packs digitales + red física con evidencia geolocalizada. Bogotá, Colombia.",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#05070A" },
    { media: "(prefers-color-scheme: light)", color: "#F6F8F9" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${montserrat.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
      </head>
      <body className="min-h-full bg-ink text-paper font-sans selection:bg-aqua selection:text-ink">
        <Providers>
          <AmbientBackground />
          {children}
        </Providers>
      </body>
    </html>
  );
}

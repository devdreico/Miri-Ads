import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/sections/icons";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const COLUMNS: FooterColumn[] = [
  {
    title: "Marca",
    links: [
      { label: "Cómo trabajamos", href: "/#logistica" },
      { label: "Red física", href: "/#phygital" },
      { label: "Evidencias GPS", href: "/#evidencia" },
      { label: "Ranking Crew", href: "/#crew" },
    ],
  },
  {
    title: "Producto",
    links: [
      { label: "Packs digitales", href: "/#packs" },
      { label: "Pro Motion Pack", href: "/checkout/pro" },
      { label: "Soy Miri Crew", href: "/crew" },
      { label: "Panel de control", href: "/admin" },
    ],
  },
  {
    title: "Contacto",
    links: [
      { label: "hola@miriads.com", href: "mailto:hola@miriads.com" },
      {
        label: "Quiero ser Miri Crew",
        href: "mailto:hola@miriads.com?subject=Quiero%20ser%20Miri%20Crew",
      },
      {
        label: "Cotizar campaña phygital",
        href: "mailto:hola@miriads.com?subject=Cotizar%20campa%C3%B1a%20phygital",
      },
    ],
  },
];

const TAGLINE =
  "Publicidad digital por packs y red física uberizada con evidencia geolocalizada, para marcas que exigen prueba.";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-ink pb-10 pt-16 sm:pt-20">
      <div className="container-page flex flex-col gap-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
          <div className="flex flex-col items-start gap-5">
            <Link
              href="#inicio"
              className="flex items-center gap-2.5 rounded-lg py-1 pr-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua"
            >
              <Image
                src="/logo/miri-ads-logo.png"
                alt=""
                width={40}
                height={37}
                className="h-9 w-auto"
              />
              <span className="font-display text-lg font-semibold tracking-tight text-paper">
                Miri Ads
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-gray-400">
              {TAGLINE}
            </p>
            <Link
              href="mailto:hola@miriads.com"
              className="group inline-flex items-center gap-2 text-sm font-medium text-aqua transition-colors duration-300 hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua"
            >
              Escríbenos
              <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {COLUMNS.map((column) => (
            <nav
              key={column.title}
              aria-label={`Enlaces de ${column.title}`}
              className="flex flex-col gap-4"
            >
              <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-gray-500">
                {column.title}
              </h2>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors duration-300 hover:text-aqua focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <span
          aria-hidden="true"
          className="block h-px w-full bg-gradient-to-r from-aqua via-aqua/40 to-transparent"
        />

        <p
          aria-hidden="true"
          className="select-none text-gradient-aqua font-display text-[clamp(2.75rem,13vw,9rem)] font-semibold leading-none tracking-tight opacity-25"
        >
          Miri Ads
        </p>

        <div className="flex flex-col gap-2 border-t border-white/8 pt-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Miri Ads · Todos los derechos reservados.</p>
          <p>Hecho en LatAm · Lima, Perú</p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;

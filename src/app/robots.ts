import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://miriads.presentto.online";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/crew", "/api", "/checkout/estado/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

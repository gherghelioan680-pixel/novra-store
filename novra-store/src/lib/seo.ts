import type { Metadata } from "next";
import { defaultLocale, locales, type AppLocale } from "@/i18n/routing";

/** Canonical origin (Vercel redirects apex novra.ro → www.novra.ro). */
function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured === "https://novra.ro" || configured === "http://novra.ro") {
    return "https://www.novra.ro";
  }
  return configured || "https://www.novra.ro";
}

export const SITE_URL = resolveSiteUrl();

export const DEFAULT_TITLE = "NOVRA | Precision. Performance. Power.";
export const DEFAULT_DESCRIPTION =
  "Cabluri premium create pentru viteză, siguranță și performanță fără compromis.";

export const OG_IMAGE_PATH = "/logo.png";

export function localePath(locale: AppLocale, path: string): string {
  const normalized = path === "/" || path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;

  if (locale === defaultLocale) {
    return normalized === "/" ? "" : normalized;
  }

  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

export function absoluteUrl(locale: AppLocale, path: string): string {
  const localized = localePath(locale, path);
  return `${SITE_URL}${localized || "/"}`;
}

export function buildLanguageAlternates(path: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const locale of locales) {
    alternates[locale] = absoluteUrl(locale, path);
  }
  return alternates;
}

function openGraphLocale(locale: AppLocale): string {
  if (locale === "ro") return "ro_RO";
  if (locale === "de") return "de_DE";
  return "en_US";
}

export function buildSiteMetadata(locale: AppLocale, description: string): Metadata {
  const title = DEFAULT_TITLE;
  const url = absoluteUrl(locale, "/");

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates("/"),
    },
    openGraph: {
      type: "website",
      siteName: "NOVRA",
      title,
      description,
      url,
      locale: openGraphLocale(locale),
      alternateLocale: locales
        .filter((entry) => entry !== locale)
        .map((entry) => openGraphLocale(entry)),
      images: [{ url: OG_IMAGE_PATH, alt: "NOVRA" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE_PATH],
    },
    manifest: "/manifest.json",
  };
}

export const ROOT_METADATA: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s | NOVRA",
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "NOVRA",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    locale: "ro_RO",
    alternateLocale: ["en_US", "de_DE"],
    images: [{ url: OG_IMAGE_PATH, alt: "NOVRA" }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
  manifest: "/manifest.json",
};

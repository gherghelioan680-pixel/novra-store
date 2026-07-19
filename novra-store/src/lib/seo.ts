import type { Metadata } from "next";
import { defaultLocale, locales, type AppLocale } from "@/i18n/routing";

/** Canonical production origin — apex domain, no www. */
export const CANONICAL_ORIGIN = "https://novra.ro";

function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (!configured) {
    return CANONICAL_ORIGIN;
  }

  try {
    const parsed = new URL(
      configured.startsWith("http://") || configured.startsWith("https://")
        ? configured
        : `https://${configured}`,
    );
    if (parsed.hostname === "novra.ro" || parsed.hostname === "www.novra.ro") {
      return CANONICAL_ORIGIN;
    }
    return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}`;
  } catch {
    return CANONICAL_ORIGIN;
  }
}

export const SITE_URL = resolveSiteUrl();

export const DEFAULT_TITLE = "NOVRA | Precision. Performance. Power.";
export const DEFAULT_DESCRIPTION =
  "Cabluri premium create pentru viteză, siguranță și performanță fără compromis.";

export const OG_IMAGE_PATH = "/logo.png";

/** Favicon + touch icons (Google: ≥48px, multiples of 48). */
export const SITE_ICONS: Metadata["icons"] = {
  icon: [
    { url: "/favicon.ico", sizes: "any" },
    { url: "/icon.png", sizes: "48x48", type: "image/png" },
    { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
  ],
  apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
};

export function localePath(locale: AppLocale, path: string): string {
  const normalized = path === "/" || path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;

  if (locale === defaultLocale) {
    return normalized === "/" ? "" : normalized;
  }

  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

export function absoluteUrl(locale: AppLocale, path: string): string {
  const localized = localePath(locale, path);
  if (!localized || localized === "/") {
    return `${SITE_URL}/`;
  }
  return `${SITE_URL}${localized}`;
}

export function buildLanguageAlternates(path: string): Record<string, string> {
  const alternates: Record<string, string> = {
    "x-default": absoluteUrl(defaultLocale, path),
  };
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
    icons: SITE_ICONS,
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      title: "NOVRA",
      statusBarStyle: "black-translucent",
    },
  };
}

export const ROOT_METADATA: Metadata = {
  title: {
    default: DEFAULT_TITLE,
    template: "%s | NOVRA",
  },
  description: DEFAULT_DESCRIPTION,
  appleWebApp: {
    capable: true,
    title: "NOVRA",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
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
  icons: SITE_ICONS,
  manifest: "/manifest.json",
};

import { defaultLocale, type AppLocale } from "@/i18n/routing";

export function stripLocalePrefix(pathname: string): string {
  for (const locale of ["en", "de"] as const) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || "/";
    }
  }
  return pathname;
}

export function localizedPath(path: string, locale: AppLocale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) return normalized;
  return `/${locale}${normalized === "/" ? "" : normalized}`;
}

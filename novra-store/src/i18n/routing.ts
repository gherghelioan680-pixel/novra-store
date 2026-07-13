import { defineRouting } from "next-intl/routing";

export const locales = ["ro", "en", "de"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "ro";
export const LOCALE_COOKIE = "novra_lang";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeCookie: {
    name: LOCALE_COOKIE,
    maxAge: 60 * 60 * 24 * 365,
  },
});

"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type AppLocale, locales } from "@/i18n/routing";

const LOCALE_LABELS: Record<AppLocale, string> = {
  ro: "RO",
  en: "EN",
  de: "DE",
};

type LanguageSwitcherProps = {
  variant?: "desktop" | "mobile";
};

export default function LanguageSwitcher({ variant = "desktop" }: LanguageSwitcherProps) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (nextLocale: AppLocale) => {
    if (nextLocale === locale) return;
    router.replace(pathname, { locale: nextLocale });
  };

  if (variant === "mobile") {
    return (
      <div className="px-4 py-3 border-t border-white/10 mt-2">
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">RO / EN / DE</p>
        <div className="flex gap-2">
          {locales.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => switchLocale(code)}
              className={`min-h-10 flex-1 rounded-lg text-sm font-semibold border transition-colors touch-manipulation ${
                locale === code
                  ? "bg-purple-600 border-purple-600 text-white"
                  : "border-white/10 text-gray-400 hover:border-purple-500/40 hover:text-white"
              }`}
            >
              {LOCALE_LABELS[code]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="hidden md:flex items-center gap-0.5 rounded-lg border border-white/10 bg-novra-card/40 p-0.5"
      role="group"
      aria-label="Language"
    >
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => switchLocale(code)}
          className={`min-w-9 min-h-8 px-2 rounded-md text-xs font-semibold transition-colors ${
            locale === code
              ? "bg-purple-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}

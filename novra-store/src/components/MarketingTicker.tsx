"use client";

import { useTranslations } from "next-intl";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function MarketingTicker() {
  const t = useTranslations("marketingTicker");
  const { marketingTickerMessages } = useSiteSettings();
  const messages =
    marketingTickerMessages.length > 0
      ? marketingTickerMessages
      : [t("fallback")];
  const items = [...messages, ...messages];

  return (
    <div className="relative z-[51] w-full shrink-0 overflow-hidden bg-gradient-to-r from-purple-950 via-purple-900/90 to-purple-950 border-b border-purple-500/20">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 sm:w-16 bg-gradient-to-r from-purple-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 sm:w-16 bg-gradient-to-l from-purple-950 to-transparent" />

      <div className="flex animate-marquee-mobile sm:animate-marquee whitespace-nowrap py-1.5 sm:py-2">
        {items.map((msg, i) => (
          <span
            key={`${msg}-${i}`}
            className="mx-4 sm:mx-10 inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium tracking-wide text-purple-100/90 uppercase"
          >
            <span className="h-1 w-1 shrink-0 rounded-full bg-purple-400" aria-hidden />
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
}

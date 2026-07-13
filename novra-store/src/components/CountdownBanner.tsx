"use client";

import { useState, useLayoutEffect } from "react";
import { useTranslations } from "next-intl";
import { useIsClient } from "@/hooks/useIsClient";
import { Flame, Clock } from "lucide-react";
import Link from "next/link";
import {
  calcTimeLeft,
  COUNTDOWN_TIMER_ID,
  EMPTY_TIME_LEFT,
  formatCountdownCompact,
  padTimeUnit,
  type TimeLeft,
} from "@/lib/countdown";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { subscribeToStoreUpdates } from "@/lib/store";
import { getCampaignEndDate, isCampaignActive } from "@/lib/site-settings";

const TIME_BLOCK_IDS = {
  days: "countdown-days",
  hours: "countdown-hours",
  minutes: "countdown-minutes",
  seconds: "countdown-seconds",
} as const;

const SHIMMER_SEGMENTS = [0, 1, 2, 3];
const SHIMMER_TRAIN = [...SHIMMER_SEGMENTS, ...SHIMMER_SEGMENTS];

function TimeBlock({
  value,
  label,
  id,
}: {
  value: number;
  label: string;
  id: string;
}) {
  const digits = padTimeUnit(value);

  return (
    <div className="flex flex-col items-center min-w-[1.6rem] min-[360px]:min-w-[1.85rem] sm:min-w-[2.75rem]">
      <span
        id={id}
        className="text-sm min-[360px]:text-base sm:text-lg font-bold tabular-nums text-white leading-none"
        suppressHydrationWarning
      >
        {digits}
      </span>
      <span className="text-[7px] min-[360px]:text-[8px] sm:text-[9px] uppercase tracking-wider text-purple-200/80 mt-0.5 leading-none">
        {label}
      </span>
    </div>
  );
}

export { CAMPAIGN_END_DATE } from "@/lib/countdown";

function getInitialTimeLeft(): TimeLeft {
  if (typeof window === "undefined") return EMPTY_TIME_LEFT;
  return calcTimeLeft(undefined, getCampaignEndDate()) ?? EMPTY_TIME_LEFT;
}

export default function CountdownBanner() {
  const t = useTranslations("countdown");
  const settings = useSiteSettings();
  const mounted = useIsClient();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getInitialTimeLeft);
  const [campaignActive, setCampaignActive] = useState(() => {
    if (typeof window === "undefined") return true;
    return isCampaignActive();
  });

  useLayoutEffect(() => {
    if (!mounted) return;

    const tick = () => {
      const endDate = getCampaignEndDate();
      const next = calcTimeLeft(undefined, endDate);
      const active = settings.campaignActive && next !== null;

      if (next && active) {
        setTimeLeft(next);
        setCampaignActive(true);
      } else {
        setCampaignActive(false);
      }
    };

    const initialTimer = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") tick();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    const unsubscribe = subscribeToStoreUpdates(tick, { scope: "settings" });

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      unsubscribe();
    };
  }, [mounted, settings.campaignActive, settings.campaignEndDate]);

  if (mounted && !campaignActive) return null;

  const offer = settings.limitedOffer;
  const promoTitle = offer.title;
  const promoSubtitle = offer.subtitle;

  return (
    <div className="relative z-[52] w-full shrink-0 overflow-hidden border-b border-purple-500/25 bg-gradient-to-r from-fuchsia-950/90 via-purple-900/95 to-violet-950/90">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.15),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden>
        <div className="flex h-full w-max animate-marquee" style={{ animationDuration: "6s" }}>
          {SHIMMER_TRAIN.map((_, idx) => (
            <div key={idx} className="flex h-full shrink-0">
              <div className="h-full w-24 sm:w-32 bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
              <div className="h-full w-48 sm:w-64" aria-hidden />
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-2 sm:px-6 py-1.5 sm:py-2.5 flex flex-col gap-1.5 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-between sm:gap-4 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 sm:flex-1">
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[9px] min-[360px]:text-[10px] sm:text-xs font-bold uppercase tracking-wider px-1.5 min-[360px]:px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-lg shadow-orange-500/20 shrink-0 whitespace-nowrap">
            <Flame size={10} className="shrink-0 min-[360px]:hidden" aria-hidden />
            <Flame size={11} className="shrink-0 hidden min-[360px]:block" aria-hidden />
            {offer.badgeLabel}
          </span>
          <p className="text-[9px] min-[360px]:text-[10px] sm:text-sm text-purple-100/90 min-w-0 truncate">
            <span className="font-semibold text-white">{promoTitle}</span>
            {promoSubtitle && (
              <span className="hidden min-[400px]:inline"> — {promoSubtitle}</span>
            )}
          </p>
        </div>

        <div className="flex items-center justify-between gap-1.5 sm:gap-3 shrink-0 w-full sm:w-auto">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1 sm:flex-initial">
            <div className="flex items-center gap-0.5 sm:gap-1 text-purple-200/80 shrink-0">
              <Clock size={11} className="shrink-0 sm:hidden" aria-hidden />
              <Clock size={12} className="shrink-0 hidden sm:block" aria-hidden />
              <span className="text-[8px] min-[360px]:text-[9px] sm:text-xs font-medium uppercase tracking-wide whitespace-nowrap">
                {offer.countdownLabel}
              </span>
            </div>

            <div
              id={COUNTDOWN_TIMER_ID}
              data-hydrated={mounted ? "true" : undefined}
              className="flex items-center gap-0.5 sm:gap-1.5 px-1 min-[360px]:px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-md sm:rounded-xl bg-black/30 border border-purple-400/25 backdrop-blur-sm shrink-0 ml-auto sm:ml-0"
              aria-live="polite"
              aria-atomic="true"
              aria-label={
                mounted
                  ? t("timeRemaining", { time: formatCountdownCompact(timeLeft) })
                  : t("staticAriaLabel")
              }
              suppressHydrationWarning
            >
              <TimeBlock value={timeLeft.days} label={t("days")} id={TIME_BLOCK_IDS.days} />
              <span className="text-purple-300 font-bold text-[9px] min-[360px]:text-[10px] sm:text-sm pb-2 sm:pb-3" aria-hidden>
                :
              </span>
              <TimeBlock value={timeLeft.hours} label={t("hours")} id={TIME_BLOCK_IDS.hours} />
              <span className="text-purple-300 font-bold text-[9px] min-[360px]:text-[10px] sm:text-sm pb-2 sm:pb-3" aria-hidden>
                :
              </span>
              <TimeBlock value={timeLeft.minutes} label={t("minutes")} id={TIME_BLOCK_IDS.minutes} />
              <span className="text-purple-300 font-bold text-[9px] min-[360px]:text-[10px] sm:text-sm pb-2 sm:pb-3" aria-hidden>
                :
              </span>
              <TimeBlock value={timeLeft.seconds} label={t("seconds")} id={TIME_BLOCK_IDS.seconds} />
            </div>
          </div>

          <Link
            href={offer.ctaHref}
            className="inline-flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/15 text-white text-[9px] min-[360px]:text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 sm:py-1.5 rounded-full transition-colors duration-200 shrink-0 touch-manipulation whitespace-nowrap min-h-9 min-w-[4.5rem] sm:min-h-0 sm:min-w-0"
          >
            {offer.ctaText}
          </Link>
        </div>
      </div>
    </div>
  );
}

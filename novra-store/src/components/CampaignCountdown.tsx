"use client";

import { useState, useLayoutEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Clock, Tag } from "lucide-react";
import { useIsClient } from "@/hooks/useIsClient";
import {
  calcTimeLeft,
  EMPTY_TIME_LEFT,
  padTimeUnit,
  type TimeLeft,
} from "@/lib/countdown";
import { CAMPAIGN_THEME_STYLES, type LandingCampaign } from "@/lib/campaigns-types";

type CampaignCountdownProps = {
  campaign: LandingCampaign;
};

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[2.5rem]">
      <span className="text-lg font-bold tabular-nums text-white" suppressHydrationWarning>
        {padTimeUnit(value)}
      </span>
      <span className="text-[9px] uppercase tracking-wider text-purple-200/80">{label}</span>
    </div>
  );
}

export default function CampaignCountdown({ campaign }: CampaignCountdownProps) {
  const t = useTranslations("campaign");
  const mounted = useIsClient();
  const endDate = new Date(campaign.endDate);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(EMPTY_TIME_LEFT);
  const [expired, setExpired] = useState(false);

  useLayoutEffect(() => {
    if (!mounted) return;

    const tick = () => {
      const next = calcTimeLeft(undefined, endDate);
      if (next) {
        setTimeLeft(next);
        setExpired(false);
      } else {
        setExpired(true);
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [mounted, campaign.endDate]);

  const theme = CAMPAIGN_THEME_STYLES[campaign.theme];

  return (
    <section className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${theme.gradient} p-8 sm:p-12`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.12),transparent_60%)]" />

      <div className="relative text-center max-w-2xl mx-auto">
        <span className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${theme.badge} px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white mb-4`}>
          <Tag size={14} />
          {campaign.discountPercent > 0 ? t("discount", { percent: campaign.discountPercent }) : t("specialOffer")}
        </span>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-3">
          {campaign.title}
        </h1>
        <p className={`text-lg ${theme.accent} mb-2`}>{campaign.subtitle}</p>
        <p className="text-gray-300 leading-relaxed mb-8">{campaign.heroText}</p>

        {!expired && mounted && (
          <div className="inline-flex flex-col items-center gap-3 mb-8">
            <div className="flex items-center gap-2 text-purple-200/80 text-sm">
              <Clock size={16} />
              <span>{t("expiresIn")}</span>
            </div>
            <div
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-black/30 border border-purple-400/25 backdrop-blur-sm"
              aria-live="polite"
            >
              <TimeBlock value={timeLeft.days} label={t("days")} />
              <span className="text-purple-300 font-bold pb-4">:</span>
              <TimeBlock value={timeLeft.hours} label={t("hours")} />
              <span className="text-purple-300 font-bold pb-4">:</span>
              <TimeBlock value={timeLeft.minutes} label={t("minutes")} />
              <span className="text-purple-300 font-bold pb-4">:</span>
              <TimeBlock value={timeLeft.seconds} label={t("seconds")} />
            </div>
          </div>
        )}

        <Link
          href={campaign.ctaLink.startsWith("/") ? campaign.ctaLink : `/${campaign.ctaLink}`}
          className="inline-flex items-center justify-center min-h-12 bg-white text-purple-900 font-bold px-8 py-3 rounded-xl text-sm hover:bg-purple-100 transition touch-manipulation"
        >
          {campaign.ctaText}
        </Link>
      </div>
    </section>
  );
}

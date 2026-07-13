"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { loadActiveCampaigns } from "@/lib/campaigns";
import { CAMPAIGN_THEME_STYLES, type LandingCampaign } from "@/lib/campaigns-types";
import { createStoreRefreshEffect } from "@/lib/store";

export default function CampaignHomeBanner() {
  const t = useTranslations("campaign");
  const [campaign, setCampaign] = useState<LandingCampaign | null>(null);

  useEffect(() => {
    const refresh = async () => {
      const active = await loadActiveCampaigns();
      setCampaign(active[0] ?? null);
    };
    return createStoreRefreshEffect(refresh, { scopes: ["campaigns"] });
  }, []);

  if (!campaign) return null;

  const theme = CAMPAIGN_THEME_STYLES[campaign.theme];

  return (
    <Link
      href={`/campanii/${campaign.slug}`}
      className={`group relative block overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r ${theme.gradient} p-5 sm:p-6 mb-8 transition hover:border-purple-500/40`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${theme.badge} px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white`}
          >
            <Sparkles size={12} />
            {t("activeCampaign")}
          </span>
          <h2 className="mt-2 text-xl sm:text-2xl font-bold text-white">{campaign.title}</h2>
          <p className={`mt-1 text-sm ${theme.accent}`}>
            {campaign.subtitle}
            {campaign.discountPercent > 0 && (
              <span className="ml-2 font-semibold text-white">
                −{campaign.discountPercent}%
              </span>
            )}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 shrink-0 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition group-hover:bg-white/20">
          {campaign.ctaText}
          <ArrowRight size={16} className="transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

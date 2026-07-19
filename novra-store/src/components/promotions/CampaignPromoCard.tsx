"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Tag } from "lucide-react";
import CampaignCardCountdown from "@/components/promotions/CampaignCardCountdown";
import { CAMPAIGN_THEME_STYLES, type LandingCampaign } from "@/lib/campaigns-types";

type CampaignPromoCardProps = {
  campaign: LandingCampaign;
  locale: string;
  featured?: boolean;
  index?: number;
};

function formatDateRange(startDate: string, endDate: string, locale: string): string {
  const dateLocale = locale === "ro" ? "ro-RO" : locale === "de" ? "de-DE" : "en-US";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

export default function CampaignPromoCard({
  campaign,
  locale,
  featured = false,
  index = 0,
}: CampaignPromoCardProps) {
  const t = useTranslations("promotions");
  const theme = CAMPAIGN_THEME_STYLES[campaign.theme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className={featured ? "sm:col-span-2 lg:col-span-2" : undefined}
    >
      <Link
        href={`/campanii/${campaign.slug}`}
        className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${theme.gradient} transition duration-300 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-900/20 ${
          featured ? "md:flex-row" : ""
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.1),transparent_60%)]" />

        <div
          className={`relative overflow-hidden bg-novra-bg/40 ${
            featured ? "md:w-1/2 md:min-h-[280px]" : "aspect-[16/10]"
          }`}
        >
          {campaign.featuredImage ? (
            <Image
              src={campaign.featuredImage}
              alt={campaign.title}
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
              sizes={featured ? "(max-width: 768px) 100vw, 40vw" : "(max-width: 640px) 100vw, 33vw"}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={featured ? 48 : 32} className={`${theme.accent} opacity-60`} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-novra-bg/80 via-transparent to-transparent" />

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${theme.badge} px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white`}
            >
              {t("limitedOffer")}
            </span>
            {campaign.discountPercent > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 px-3 py-1 text-[10px] font-bold text-white">
                <Tag size={10} />
                −{campaign.discountPercent}%
              </span>
            )}
          </div>
        </div>

        <div className={`relative flex flex-1 flex-col p-5 sm:p-6 ${featured ? "md:justify-center" : ""}`}>
          {campaign.featured && (
            <span className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-purple-400">
              {t("featuredCampaign")}
            </span>
          )}
          <h3 className={`font-bold text-white group-hover:text-purple-200 transition ${featured ? "text-2xl sm:text-3xl" : "text-xl"}`}>
            {campaign.title}
          </h3>
          {campaign.subtitle && (
            <p className={`mt-1 text-sm ${theme.accent}`}>{campaign.subtitle}</p>
          )}
          <p className="mt-3 text-sm text-gray-300 line-clamp-2 leading-relaxed">
            {campaign.heroText}
          </p>

          <div className="mt-4 space-y-2">
            <CampaignCardCountdown endDate={campaign.endDate} />
            <p className="text-[11px] text-gray-500">{formatDateRange(campaign.startDate, campaign.endDate, locale)}</p>
          </div>

          {campaign.discountCode && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-purple-500/25 bg-purple-950/40 px-3 py-1.5 text-xs font-mono text-purple-200">
              <Tag size={12} />
              {campaign.discountCode}
            </p>
          )}

          <span className="mt-auto pt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white group-hover:gap-3 transition-all">
            {campaign.ctaText || t("viewOffer")}
            <ArrowRight size={14} className="text-purple-300" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

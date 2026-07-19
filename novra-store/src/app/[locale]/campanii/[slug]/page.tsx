import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Tag } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CampaignCountdown from "@/components/CampaignCountdown";
import CampaignLinkedProducts from "@/components/campaigns/CampaignLinkedProducts";
import { findCampaignBySlug } from "@/lib/campaigns-server";
import { CAMPAIGN_THEME_STYLES, isCampaignCurrentlyActive } from "@/lib/campaigns-types";
import CampaignLandingTracker from "./CampaignLandingTracker";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "campaign" });
  const campaign = await findCampaignBySlug(slug);
  if (!campaign) return { title: t("metadataTitle") };
  return {
    title: `${campaign.title} — NOVRA`,
    description: campaign.subtitle || campaign.heroText,
  };
}

export default async function CampaignLandingPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("campaign");
  const tc = await getTranslations("common");
  const campaign = await findCampaignBySlug(slug);

  if (!campaign || !isCampaignCurrentlyActive(campaign)) {
    notFound();
  }

  const theme = CAMPAIGN_THEME_STYLES[campaign.theme];
  const ctaHref = campaign.ctaLink.startsWith("/") ? campaign.ctaLink : `/${campaign.ctaLink}`;

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <CampaignLandingTracker slug={campaign.slug} discountCode={campaign.discountCode} />
      <Navbar />
      <main className="pb-page site-container pt-8">
        <Link
          href="/promotii"
          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-purple-400 uppercase tracking-widest mb-8 transition-colors group touch-manipulation"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          {t("backToPromotions")}
        </Link>

        {campaign.featuredImage && (
          <div className="relative mb-8 aspect-[21/9] max-h-[360px] overflow-hidden rounded-3xl border border-white/10">
            <Image
              src={campaign.featuredImage}
              alt={campaign.title}
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${theme.gradient} opacity-70`} />
            <div className="absolute inset-0 bg-gradient-to-t from-novra-bg via-transparent to-transparent" />
          </div>
        )}

        <CampaignCountdown campaign={campaign} />

        {campaign.discountCode && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 rounded-2xl border border-purple-500/25 bg-purple-950/30 px-5 py-4 text-center">
            <span className="text-sm text-gray-400">{t("useCodeAtCheckout")}</span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-black/30 px-4 py-2 font-mono text-sm font-bold text-purple-200">
              <Tag size={14} />
              {campaign.discountCode}
            </span>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-500 max-w-xl mx-auto">
          {t("discountNote", { percent: campaign.discountPercent })}
        </p>

        <CampaignLinkedProducts productIds={campaign.linkedProducts ?? []} />

        <div className="mt-12 text-center">
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center min-h-12 rounded-xl bg-purple-600 px-8 py-3 text-sm font-bold text-white hover:bg-purple-700 transition touch-manipulation"
          >
            {campaign.ctaText || tc("viewProducts")}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

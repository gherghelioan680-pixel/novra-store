import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Megaphone, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CampaignPromoCard from "@/components/promotions/CampaignPromoCard";
import PromoCodesSection from "@/components/promotions/PromoCodesSection";
import { getActiveCampaignsServer } from "@/lib/campaigns-server";
import { getPublicPromoCodesServer } from "@/lib/discount-codes-server";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "promotions" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default async function PromotiiPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("promotions");
  const tc = await getTranslations("common");

  const [campaigns, promoCodes] = await Promise.all([
    getActiveCampaignsServer(),
    getPublicPromoCodesServer(),
  ]);

  const [featuredCampaign, ...restCampaigns] = campaigns;

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="pb-page site-container">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-purple-400 uppercase tracking-widest mb-8 transition-colors group touch-manipulation"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          {tc("backHome")}
        </Link>

        <section className="relative mb-14 overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/60 via-novra-card/50 to-novra-bg p-8 sm:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(139,92,246,0.18),transparent_65%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-purple-950/50 to-transparent" />
          <div className="relative mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-600/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-300 mb-5">
              <Sparkles size={14} />
              {t("badge")}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              {t("title")}
            </h1>
            <p className="text-gray-400 text-base sm:text-lg font-light leading-relaxed max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
          </div>
        </section>

        <PromoCodesSection codes={promoCodes} />

        {campaigns.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-novra-card/20 px-6 py-20 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-600/10">
              <Megaphone size={24} className="text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">{t("emptyTitle")}</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">{t("emptyDescription")}</p>
            <Link
              href="/produse"
              className="inline-flex items-center justify-center min-h-11 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition"
            >
              {t("emptyCta")}
            </Link>
          </div>
        ) : (
          <section>
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">{t("activeCampaigns")}</h2>
                <p className="mt-1 text-sm text-gray-500">{t("activeCampaignsHint")}</p>
              </div>
              <span className="shrink-0 rounded-full border border-purple-500/30 bg-purple-600/10 px-3 py-1 text-xs font-medium text-purple-300">
                {campaigns.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCampaign && (
                <CampaignPromoCard
                  campaign={featuredCampaign}
                  locale={locale}
                  featured
                  index={0}
                />
              )}
              {restCampaigns.map((campaign, index) => (
                <CampaignPromoCard
                  key={campaign.id}
                  campaign={campaign}
                  locale={locale}
                  index={index + 1}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

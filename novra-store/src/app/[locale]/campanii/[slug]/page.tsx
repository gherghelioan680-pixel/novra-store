import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CampaignCountdown from "@/components/CampaignCountdown";
import { findCampaignBySlug } from "@/lib/campaigns-server";
import { isCampaignCurrentlyActive } from "@/lib/campaigns-types";
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
  const campaign = await findCampaignBySlug(slug);

  if (!campaign || !isCampaignCurrentlyActive(campaign)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <CampaignLandingTracker slug={campaign.slug} />
      <Navbar />
      <main className="pb-page px-4 sm:px-6 md:px-12 max-w-4xl mx-auto pt-8">
        <CampaignCountdown campaign={campaign} />
        <p className="mt-8 text-center text-sm text-gray-500">
          {t("discountNote", { percent: campaign.discountPercent })}
        </p>
      </main>
      <Footer />
    </div>
  );
}

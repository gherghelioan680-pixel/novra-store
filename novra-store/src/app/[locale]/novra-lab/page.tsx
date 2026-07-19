import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import NovraLabPageClient from "./NovraLabPageClient";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "novraLab" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default async function NovraLabPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NovraLabPageClient />;
}

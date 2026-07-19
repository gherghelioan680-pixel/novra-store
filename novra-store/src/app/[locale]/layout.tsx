import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Providers from "@/components/Providers";
import ComingSoonGate from "@/components/ComingSoonGate";
import SetDocumentLang from "@/components/SetDocumentLang";
import { routing, type AppLocale } from "@/i18n/routing";
import { buildSiteMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return buildSiteMetadata(locale as AppLocale, t("description"));
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <SetDocumentLang locale={locale} />
      <ComingSoonGate>
        <Providers>{children}</Providers>
      </ComingSoonGate>
    </NextIntlClientProvider>
  );
}

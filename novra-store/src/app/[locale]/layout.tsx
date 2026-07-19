import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Providers from "@/components/Providers";
import ComingSoonGate from "@/components/ComingSoonGate";
import SetDocumentLang from "@/components/SetDocumentLang";
import { routing, type AppLocale } from "@/i18n/routing";
import { buildSiteMetadata } from "@/lib/seo";
import { CURRENCY_COOKIE, isDisplayCurrency } from "@/lib/currency";

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
  const cookieStore = await cookies();
  const currencyCookie = cookieStore.get(CURRENCY_COOKIE)?.value;
  const initialCurrency = isDisplayCurrency(currencyCookie) ? currencyCookie : "RON";

  return (
    <NextIntlClientProvider messages={messages}>
      <SetDocumentLang locale={locale} />
      <ComingSoonGate>
        <Providers initialCurrency={initialCurrency}>{children}</Providers>
      </ComingSoonGate>
    </NextIntlClientProvider>
  );
}

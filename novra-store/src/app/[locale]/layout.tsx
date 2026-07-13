import "../globals.css";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Providers from "@/components/Providers";
import ComingSoonGate from "@/components/ComingSoonGate";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#13111c",
};

export const metadata: Metadata = {
  title: "NOVRA | Precision. Performance. Power.",
  description: "Cabluri premium create pentru viteză, siguranță și performanță fără compromis.",
  manifest: "/manifest.json",
};

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
    <html lang={locale}>
      <body className="bg-novra-bg text-white antialiased">
        <NextIntlClientProvider messages={messages}>
          <ComingSoonGate>
            <Providers>{children}</Providers>
          </ComingSoonGate>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

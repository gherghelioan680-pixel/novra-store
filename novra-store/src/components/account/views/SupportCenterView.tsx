"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Headphones, MessageCircle, Mail, HelpCircle } from "lucide-react";

import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildWhatsAppUrl } from "@/lib/store";

export default function SupportCenterView() {
  const t = useTranslations("accountSupport");
  const { whatsappNumber } = useSiteSettings();

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">{t("title")}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href={buildWhatsAppUrl(whatsappNumber, t("whatsappMessage"))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-4 rounded-xl border border-white/10 bg-novra-card/30 p-5 transition hover:border-purple-500/30"
        >
          <MessageCircle className="h-6 w-6 shrink-0 text-green-400" />
          <div>
            <h3 className="font-medium text-white">{t("whatsappTitle")}</h3>
            <p className="mt-1 text-sm text-gray-400">{t("whatsappDesc")}</p>
          </div>
        </a>

        <Link
          href="/contact"
          className="flex items-start gap-4 rounded-xl border border-white/10 bg-novra-card/30 p-5 transition hover:border-purple-500/30"
        >
          <Mail className="h-6 w-6 shrink-0 text-purple-400" />
          <div>
            <h3 className="font-medium text-white">{t("contactTitle")}</h3>
            <p className="mt-1 text-sm text-gray-400">{t("contactDesc")}</p>
          </div>
        </Link>

        <Link
          href="/faq"
          className="flex items-start gap-4 rounded-xl border border-white/10 bg-novra-card/30 p-5 transition hover:border-purple-500/30"
        >
          <HelpCircle className="h-6 w-6 shrink-0 text-blue-400" />
          <div>
            <h3 className="font-medium text-white">{t("faqTitle")}</h3>
            <p className="mt-1 text-sm text-gray-400">{t("faqDesc")}</p>
          </div>
        </Link>

        <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-novra-card/30 p-5">
          <Headphones className="h-6 w-6 shrink-0 text-purple-400" />
          <div>
            <h3 className="font-medium text-white">{t("supportHoursTitle")}</h3>
            <p className="mt-1 text-sm text-gray-400">{t("supportHours")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

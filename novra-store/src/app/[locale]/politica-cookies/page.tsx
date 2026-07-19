"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Cookie, Settings, BarChart3, Link2, Mail } from "lucide-react";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import LegalSectionCard from "@/components/legal/LegalSectionCard";
import { legalSectionId } from "@/lib/legal-section-id";
import { AFFILIATE_ATTRIBUTION_DAYS } from "@/lib/affiliates-types";

type CookieType = {
  name: string;
  purpose: string;
  duration: string;
  required: boolean;
};

export default function PoliticaCookies() {
  const t = useTranslations("legalCookies");
  const cookieTypes = useMemo(() => t.raw("cookieTypes") as CookieType[], [t]);

  const tocItems = useMemo(
    () => [
      { id: legalSectionId(1), title: t("whatTitle"), number: 1 },
      { id: legalSectionId(2), title: t("typesTitle"), number: 2 },
      { id: legalSectionId(3), title: t("affiliateTitle"), number: 3 },
      { id: legalSectionId(4), title: t("manageTitle"), number: 4 },
      { id: legalSectionId(5), title: t("questions"), number: 5 },
    ],
    [t],
  );

  return (
    <LegalPageLayout
      badge={t("badge")}
      title={t("title")}
      titleHighlight={t("titleHighlight")}
      lastUpdated={t("lastUpdated")}
      heroIcon={Cookie}
      breadcrumbLabel={`${t("title")} ${t("titleHighlight")}`}
      tocItems={tocItems}
    >
      <LegalSectionCard id={legalSectionId(1)} sectionNum={1} title={t("whatTitle")} icon={Cookie}>
        <p>{t("whatText")}</p>
      </LegalSectionCard>

      <LegalSectionCard id={legalSectionId(2)} sectionNum={2} title={t("typesTitle")} icon={Settings}>
        <div className="space-y-4 !pl-0 sm:!pl-0">
          {cookieTypes.map((cookie) => (
            <div
              key={cookie.name}
              className="rounded-xl border border-white/8 bg-novra-bg/40 p-4 print:border-gray-200"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-medium text-white print:text-black">{cookie.name}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${
                    cookie.required ? "bg-purple-500/15 text-purple-300" : "bg-gray-500/15 text-gray-400"
                  }`}
                >
                  {cookie.required ? t("required") : t("optional")}
                </span>
              </div>
              <p className="mb-1 text-sm text-gray-400 print:text-gray-700">{cookie.purpose}</p>
              <p className="text-xs text-gray-500 print:text-gray-600">
                {t("durationLabel")} {cookie.duration}
              </p>
            </div>
          ))}
        </div>
      </LegalSectionCard>

      <LegalSectionCard id={legalSectionId(3)} sectionNum={3} title={t("affiliateTitle")} icon={Link2}>
        <p>{t("affiliateText", { days: AFFILIATE_ATTRIBUTION_DAYS })}</p>
      </LegalSectionCard>

      <LegalSectionCard id={legalSectionId(4)} sectionNum={4} title={t("manageTitle")} icon={BarChart3}>
        <p>{t("manageText")}</p>
        <p className="text-sm text-gray-400 print:text-gray-700">
          {t("manageMore")}{" "}
          <Link href="/politica-confidentialitate" className="text-purple-400 hover:underline print:text-purple-700">
            {t("privacyLink")}
          </Link>
          .
        </p>
      </LegalSectionCard>

      <LegalSectionCard
        id={legalSectionId(5)}
        sectionNum={5}
        title={t("questions")}
        icon={Mail}
        variant="highlight"
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <a href="mailto:contact@novra.ro" className="text-purple-400 hover:underline print:text-purple-700">
            contact@novra.ro
          </a>
        </div>
      </LegalSectionCard>
    </LegalPageLayout>
  );
}

"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link2, Wallet, Cookie, Scale, Mail, CheckCircle, Ban, Banknote, Shield } from "lucide-react";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import LegalPageSections, { type LegalSectionData } from "@/components/legal/LegalPageSections";
import LegalSectionCard from "@/components/legal/LegalSectionCard";
import {
  AFFILIATE_ATTRIBUTION_DAYS,
  DEFAULT_AFFILIATE_COMMISSION_RATE,
  MIN_AFFILIATE_PAYOUT_AMOUNT,
} from "@/lib/affiliates-types";
import { buildLegalTocItems, legalSectionId } from "@/lib/legal-section-id";

const SECTION_ICONS = [Link2, CheckCircle, Cookie, Wallet, Banknote, Shield, Ban, Scale];

function interpolateAffiliateSection(section: LegalSectionData): LegalSectionData {
  const interpolate = (text: string) =>
    text
      .replaceAll("{days}", String(AFFILIATE_ATTRIBUTION_DAYS))
      .replaceAll("{rate}", String(DEFAULT_AFFILIATE_COMMISSION_RATE))
      .replaceAll("{minAmount}", String(MIN_AFFILIATE_PAYOUT_AMOUNT));

  return {
    ...section,
    paragraphs: section.paragraphs?.map(interpolate),
    list: section.list?.map(interpolate),
  };
}

export default function TermeniProgramAfiliere() {
  const t = useTranslations("legalAffiliate");
  const sectionData = useMemo(() => {
    const raw = t.raw("sections") as LegalSectionData[];
    return raw.map(interpolateAffiliateSection);
  }, [t]);

  const tocItems = useMemo(
    () =>
      buildLegalTocItems(sectionData, 1, [
        { id: legalSectionId(9), title: t("contactTitle"), number: 9 },
      ]),
    [sectionData, t],
  );

  return (
    <LegalPageLayout
      badge={t("badge")}
      title={t("title")}
      titleHighlight={t("titleHighlight")}
      lastUpdated={t("lastUpdated")}
      heroIcon={Link2}
      breadcrumbLabel={`${t("title")} ${t("titleHighlight")}`}
      tocItems={tocItems}
      contactEmail="support@novra.ro"
    >
      <LegalPageSections sections={sectionData} icons={SECTION_ICONS} />

      <LegalSectionCard
        id={legalSectionId(9)}
        sectionNum={9}
        title={t("contactTitle")}
        icon={Mail}
        variant="highlight"
      >
        <div className="flex items-center gap-2 text-sm">
          <a href="mailto:support@novra.ro" className="text-purple-400 hover:underline print:text-purple-700">
            support@novra.ro
          </a>
        </div>
      </LegalSectionCard>
    </LegalPageLayout>
  );
}

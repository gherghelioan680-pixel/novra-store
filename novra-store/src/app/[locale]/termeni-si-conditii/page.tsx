"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  FileCheck,
  Copyright,
  UserCheck,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Gavel,
  Mail,
  Scale,
  ShoppingCart,
  CreditCard,
  Gift,
  Truck,
} from "lucide-react";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import LegalPageSections, { type LegalSectionData } from "@/components/legal/LegalPageSections";
import LegalSectionCard from "@/components/legal/LegalSectionCard";
import { buildLegalTocItems, legalSectionId } from "@/lib/legal-section-id";

const SECTION_ICONS = [
  FileCheck,
  Copyright,
  ShoppingCart,
  CreditCard,
  Gift,
  Truck,
  UserCheck,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Gavel,
];

export default function TermeniSiConditii() {
  const t = useTranslations("legalTerms");
  const sections = useMemo(() => t.raw("sections") as LegalSectionData[], [t]);

  const tocItems = useMemo(
    () =>
      buildLegalTocItems(sections, 1, [
        { id: legalSectionId(12), title: t("contactTitle"), number: 12 },
      ]),
    [sections, t],
  );

  return (
    <LegalPageLayout
      badge={t("badge")}
      title={t("title")}
      titleHighlight={t("titleHighlight")}
      lastUpdated={t("lastUpdated")}
      heroIcon={FileCheck}
      breadcrumbLabel={`${t("title")} ${t("titleHighlight")}`}
      tocItems={tocItems}
    >
      <LegalPageSections sections={sections} icons={SECTION_ICONS} />

      <LegalSectionCard
        id={legalSectionId(12)}
        sectionNum={12}
        title={t("contactTitle")}
        icon={Scale}
        variant="highlight"
      >
        <p className="text-sm text-gray-400 mb-4 print:text-gray-700">{t("contactIntro")}</p>
        <div className="text-sm space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Mail size={14} className="text-purple-500" aria-hidden />
            <span className="text-gray-500">{t("officialEmail")}</span>
            <a href="mailto:contact@novra.ro" className="text-purple-400 hover:underline print:text-purple-700">
              contact@novra.ro
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FileCheck size={14} className="text-purple-500" aria-hidden />
            <span className="text-gray-500">{t("platform")}</span>
            <Link href="/" className="text-purple-400 hover:underline font-medium print:text-purple-700">
              www.novra.ro
            </Link>
          </div>
        </div>
      </LegalSectionCard>
    </LegalPageLayout>
  );
}

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Shield,
  Eye,
  Database,
  Clock,
  Share2,
  Scale,
  Lock,
  Mail,
  FileText,
  Cookie,
  CreditCard,
  Users,
  Gift,
  Truck,
} from "lucide-react";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import LegalPageSections, { type LegalSectionData } from "@/components/legal/LegalPageSections";
import LegalSectionCard from "@/components/legal/LegalSectionCard";
import { buildLegalTocItems, legalSectionId } from "@/lib/legal-section-id";
import { LEGAL_LINKS, renderRichText } from "@/lib/render-rich-text";

const SECTION_ICONS = [FileText, Database, Eye, Cookie, Clock, Share2];

type GdprRight = { title: string; desc: string };

export default function PoliticaConfidentialitate() {
  const t = useTranslations("legalPrivacy");
  const sections = useMemo(() => t.raw("sections") as LegalSectionData[], [t]);
  const rights = useMemo(() => t.raw("rights") as GdprRight[], [t]);

  const tocItems = useMemo(
    () =>
      buildLegalTocItems(sections, 1, [
        { id: legalSectionId(7), title: t("rightsTitle"), number: 7 },
        { id: legalSectionId(8), title: t("stripeTitle"), number: 8 },
        { id: legalSectionId(9), title: t("affiliateTitle"), number: 9 },
        { id: legalSectionId(10), title: t("securityTitle"), number: 10 },
        { id: legalSectionId(11), title: t("contactTitle"), number: 11 },
      ]),
    [sections, t],
  );

  return (
    <LegalPageLayout
      badge={t("badge")}
      title={t("title")}
      titleHighlight={t("titleHighlight")}
      lastUpdated={t("lastUpdated")}
      heroIcon={Shield}
      breadcrumbLabel={`${t("title")} ${t("titleHighlight")}`}
      tocItems={tocItems}
    >
      <LegalPageSections sections={sections} icons={SECTION_ICONS} />

      <LegalSectionCard
        id={legalSectionId(7)}
        sectionNum={7}
        title={t("rightsTitle")}
        icon={Scale}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 !pl-0 sm:!pl-0">
          {rights.map((right) => (
            <div
              key={right.title}
              className="rounded-xl border border-white/8 bg-novra-bg/40 p-4 sm:p-5 print:border-gray-200"
            >
              <h3 className="text-sm font-semibold text-white mb-1 print:text-black">{right.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed print:text-gray-700">{right.desc}</p>
            </div>
          ))}
        </div>
      </LegalSectionCard>

      <LegalSectionCard id={legalSectionId(8)} sectionNum={8} title={t("stripeTitle")} icon={CreditCard}>
        <p>{t("stripeText")}</p>
      </LegalSectionCard>

      <LegalSectionCard id={legalSectionId(9)} sectionNum={9} title={t("affiliateTitle")} icon={Users}>
        <p>{renderRichText(t("affiliateText"), LEGAL_LINKS)}</p>
      </LegalSectionCard>

      <LegalSectionCard id={legalSectionId(10)} sectionNum={10} title={t("securityTitle")} icon={Lock}>
        <p>{t("securityText")}</p>
      </LegalSectionCard>

      <LegalSectionCard
        id={legalSectionId(11)}
        sectionNum={11}
        title={t("contactTitle")}
        icon={Shield}
        variant="highlight"
      >
        <p className="text-sm text-gray-400 mb-2 print:text-gray-700">{t("contactIntro")}</p>
        <div className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-purple-500" aria-hidden />
            <a href="mailto:contact@novra.ro" className="text-purple-400 hover:underline print:text-purple-700">
              contact@novra.ro
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Gift size={14} className="text-purple-500" aria-hidden />
            <Link href="/termeni-si-conditii" className="text-purple-400 hover:underline print:text-purple-700">
              {t("contactLinks.terms")}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Truck size={14} className="text-purple-500" aria-hidden />
            <Link href="/livrare-si-plata" className="text-purple-400 hover:underline print:text-purple-700">
              {t("contactLinks.shipping")}
            </Link>
          </div>
        </div>
      </LegalSectionCard>
    </LegalPageLayout>
  );
}

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link2, Wallet, Cookie, Scale, Mail, Sparkles, CheckCircle, Ban, Banknote, Shield } from "lucide-react";
import { fadeUp } from "@/lib/motion";
import {
  AFFILIATE_ATTRIBUTION_DAYS,
  DEFAULT_AFFILIATE_COMMISSION_RATE,
  MIN_AFFILIATE_PAYOUT_AMOUNT,
} from "@/lib/affiliates-types";
import LegalPageSections, { type LegalSectionData } from "@/components/legal/LegalPageSections";

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

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="px-4 sm:px-6 md:px-12 max-w-4xl mx-auto pb-page">
        <section className="relative overflow-hidden pt-8 sm:pt-12 pb-12 sm:pb-16 mb-8">
          <div className="absolute -top-8 right-0 w-48 h-48 bg-purple-500/8 blur-[80px] rounded-full pointer-events-none" />
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 text-purple-400 font-semibold tracking-[0.2em] uppercase text-xs sm:text-sm mb-4">
              <Sparkles size={14} aria-hidden />
              {t("badge")}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter mb-4">
              {t("title")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                {t("titleHighlight")}
              </span>
            </h1>
            <p className="text-gray-400 text-sm font-light">{t("lastUpdated")}</p>
          </motion.div>
        </section>

        <div className="space-y-4 sm:space-y-5">
          <LegalPageSections sections={sectionData} icons={SECTION_ICONS} />

          <motion.section
            {...fadeUp}
            className="p-6 sm:p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-transparent"
          >
            <h2 className="text-lg font-semibold text-white mb-4">{t("contactTitle")}</h2>
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-purple-500" aria-hidden />
              <a href="mailto:support@novra.ro" className="text-purple-400 hover:underline">
                support@novra.ro
              </a>
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

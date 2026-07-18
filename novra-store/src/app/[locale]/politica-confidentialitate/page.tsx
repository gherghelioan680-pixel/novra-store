"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Shield,
  Eye,
  Database,
  Clock,
  Share2,
  Scale,
  Lock,
  Mail,
  Sparkles,
  FileText,
  Cookie,
  CreditCard,
  Users,
  Gift,
  Truck,
} from "lucide-react";
import { fadeUp } from "@/lib/motion";
import LegalPageSections, { type LegalSectionData } from "@/components/legal/LegalPageSections";
import { LEGAL_LINKS, renderRichText } from "@/lib/render-rich-text";

const SECTION_ICONS = [FileText, Database, Eye, Cookie, Clock, Share2];

type GdprRight = { title: string; desc: string };

export default function PoliticaConfidentialitate() {
  const t = useTranslations("legalPrivacy");
  const sections = useMemo(() => t.raw("sections") as LegalSectionData[], [t]);
  const rights = useMemo(() => t.raw("rights") as GdprRight[], [t]);

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="site-container-narrow pb-page">
        <section className="relative overflow-hidden pt-8 sm:pt-12 pb-12 sm:pb-16 mb-8">
          <div className="absolute -top-8 right-0 w-48 h-48 bg-purple-500/8 blur-[80px] rounded-full pointer-events-none" />
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 text-purple-400 font-semibold tracking-[0.2em] uppercase text-xs sm:text-sm mb-4">
              <Sparkles size={14} aria-hidden />
              {t("badge")}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-4">
              {t("title")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                {t("titleHighlight")}
              </span>
            </h1>
            <p className="text-gray-400 text-sm font-light">{t("lastUpdated")}</p>
          </motion.div>
        </section>

        <div className="space-y-4 sm:space-y-5">
          <LegalPageSections sections={sections} icons={SECTION_ICONS} />

          <motion.section {...fadeUp} className="p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40">
            <div className="flex items-start gap-4 mb-6">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
                <Scale size={18} className="text-purple-400" aria-hidden />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight pt-1.5">
                7. {t("rightsTitle")}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 sm:pl-14">
              {rights.map((right) => (
                <div key={right.title} className="p-4 sm:p-5 rounded-xl bg-novra-bg/40 border border-white/8">
                  <h3 className="text-sm font-semibold text-white mb-1">{right.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{right.desc}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section {...fadeUp} className="p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40">
            <div className="flex items-start gap-4 mb-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
                <CreditCard size={18} className="text-purple-400" aria-hidden />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight pt-1.5">
                8. {t("stripeTitle")}
              </h2>
            </div>
            <p className="text-gray-300 font-light leading-relaxed text-sm sm:text-base sm:pl-14">{t("stripeText")}</p>
          </motion.section>

          <motion.section {...fadeUp} className="p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40">
            <div className="flex items-start gap-4 mb-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
                <Users size={18} className="text-purple-400" aria-hidden />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight pt-1.5">
                9. {t("affiliateTitle")}
              </h2>
            </div>
            <p className="text-gray-300 font-light leading-relaxed text-sm sm:text-base sm:pl-14">
              {renderRichText(t("affiliateText"), LEGAL_LINKS)}
            </p>
          </motion.section>

          <motion.section {...fadeUp} className="p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40">
            <div className="flex items-start gap-4 mb-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
                <Lock size={18} className="text-purple-400" aria-hidden />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight pt-1.5">
                10. {t("securityTitle")}
              </h2>
            </div>
            <p className="text-gray-300 font-light leading-relaxed text-sm sm:text-base sm:pl-14">{t("securityText")}</p>
          </motion.section>

          <motion.section
            {...fadeUp}
            className="p-6 sm:p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-transparent relative overflow-hidden"
          >
            <div className="flex items-start gap-4 mb-4 relative">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
                <Shield size={18} className="text-purple-400" aria-hidden />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight pt-1.5">
                11. {t("contactTitle")}
              </h2>
            </div>
            <p className="text-sm text-gray-400 mb-4 sm:pl-14 relative">{t("contactIntro")}</p>
            <div className="text-sm space-y-2 sm:pl-14 relative">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-purple-500" aria-hidden />
                <a href="mailto:contact@novra.ro" className="text-purple-400 hover:underline">
                  contact@novra.ro
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Gift size={14} className="text-purple-500" aria-hidden />
                <Link href="/termeni-si-conditii" className="text-purple-400 hover:underline">
                  {t("contactLinks.terms")}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-purple-500" aria-hidden />
                <Link href="/livrare-si-plata" className="text-purple-400 hover:underline">
                  {t("contactLinks.shipping")}
                </Link>
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

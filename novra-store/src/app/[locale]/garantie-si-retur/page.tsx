"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShieldCheck,
  RotateCcw,
  Clock,
  Package,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Mail,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { fadeUp } from "@/lib/motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildWhatsAppUrl } from "@/lib/store";

export default function GarantieSiRetur() {
  const t = useTranslations("warranty");
  const { whatsappNumber } = useSiteSettings();
  const whatsappHref = buildWhatsAppUrl(whatsappNumber, t("whatsappMessage"));

  const warrantyHighlights = useMemo(
    () => [
      { icon: ShieldCheck, label: t("highlight1"), sub: t("highlight1Sub") },
      { icon: RotateCcw, label: t("highlight2"), sub: t("highlight2Sub") },
      { icon: Clock, label: t("highlight3"), sub: t("highlight3Sub") },
      { icon: CheckCircle2, label: t("highlight4"), sub: t("highlight4Sub") },
    ],
    [t]
  );

  const returnSteps = useMemo(
    () => [
      { step: "01", title: t("returnStep1Title"), description: t("returnStep1Desc") },
      { step: "02", title: t("returnStep2Title"), description: t("returnStep2Desc") },
      { step: "03", title: t("returnStep3Title"), description: t("returnStep3Desc") },
      { step: "04", title: t("returnStep4Title"), description: t("returnStep4Desc") },
    ],
    [t]
  );

  const warrantyCovers = useMemo(
    () => [t("cover1"), t("cover2"), t("cover3"), t("cover4")],
    [t]
  );

  const warrantyExcludes = useMemo(
    () => [t("exclude1"), t("exclude2"), t("exclude3"), t("exclude4")],
    [t]
  );

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="site-container-md pb-page">
        <section className="relative overflow-hidden pt-8 sm:pt-12 pb-12 sm:pb-16 mb-8">
          <div className="absolute -top-8 right-0 w-48 h-48 bg-purple-500/8 blur-[80px] rounded-full pointer-events-none" />
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 text-purple-400 font-semibold tracking-[0.2em] uppercase text-xs sm:text-sm mb-4">
              <Sparkles size={14} aria-hidden />
              {t("badge")}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6">
              {t("title")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                {t("titleHighlight")}
              </span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg font-light max-w-2xl leading-relaxed">{t("subtitle")}</p>
          </motion.div>
        </section>

        <motion.div {...fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-16 sm:mb-20">
          {warrantyHighlights.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl border border-white/8 bg-novra-card/40 hover:border-purple-500/25 transition-colors"
            >
              <item.icon size={22} className="text-purple-500 mb-2" aria-hidden />
              <span className="text-sm sm:text-base font-semibold text-white">{item.label}</span>
              <span className="text-xs text-gray-500 mt-0.5">{item.sub}</span>
            </div>
          ))}
        </motion.div>

        <motion.section {...fadeUp} className="mb-16 sm:mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <ShieldCheck size={22} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white tracking-tight">{t("qualityTitle")}</h2>
              <p className="text-gray-500 text-sm">{t("qualitySubtitle")}</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/50 via-novra-card/40 to-novra-surface p-6 sm:p-10 mb-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
              <div className="shrink-0">
                <div className="text-5xl sm:text-6xl font-bold text-white tracking-tight">24</div>
                <p className="text-purple-400 font-semibold text-sm mt-1 uppercase tracking-widest">{t("months")}</p>
              </div>
              <p className="text-gray-300 text-base sm:text-lg font-light leading-relaxed">{t("qualityDesc")}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-6 sm:p-7 rounded-2xl border border-white/8 bg-novra-card/40">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={18} className="text-green-400" aria-hidden />
                <h3 className="font-bold text-white">{t("coversTitle")}</h3>
              </div>
              <ul className="space-y-2.5">
                {warrantyCovers.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 sm:p-7 rounded-2xl border border-white/8 bg-novra-card/40">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={18} className="text-amber-400" aria-hidden />
                <h3 className="font-bold text-white">{t("excludesTitle")}</h3>
              </div>
              <ul className="space-y-2.5">
                {warrantyExcludes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="w-1 h-1 rounded-full bg-gray-500 shrink-0 mt-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.section>

        <motion.section {...fadeUp} className="mb-16 sm:mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <RotateCcw size={22} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white tracking-tight">{t("returnTitle")}</h2>
              <p className="text-gray-500 text-sm">{t("returnSubtitle")}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-8">
            <div className="group p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40 hover:border-purple-500/25 transition-all">
              <Package size={24} className="text-purple-400 mb-4" aria-hidden />
              <h3 className="text-white font-bold text-lg mb-2">{t("conditionsTitle")}</h3>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">{t("conditionsDesc")}</p>
            </div>
            <div className="group p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40 hover:border-purple-500/25 transition-all">
              <CheckCircle2 size={24} className="text-purple-400 mb-4" aria-hidden />
              <h3 className="text-white font-bold text-lg mb-2">{t("refundTitle")}</h3>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">{t("refundDesc")}</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-purple-500/8 to-transparent p-6 sm:p-10">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full pointer-events-none" />
            <h3 className="text-lg font-bold text-white mb-8 tracking-tight">{t("howTitle")}</h3>
            <ol className="grid sm:grid-cols-2 gap-6">
              {returnSteps.map((item) => (
                <li key={item.step} className="flex gap-4 items-start">
                  <span className="text-purple-500 font-bold text-sm tracking-tight pt-0.5 shrink-0">{item.step}.</span>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </motion.section>

        <motion.div
          {...fadeUp}
          className="text-center p-8 sm:p-10 rounded-3xl border border-novra-border bg-novra-card/30"
        >
          <h3 className="text-xl sm:text-2xl font-bold mb-3">{t("ctaTitle")}</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">{t("ctaDesc")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] px-6 py-3 rounded-full font-semibold transition text-sm"
            >
              <FaWhatsapp size={18} aria-hidden />
              WhatsApp
            </a>
            <a
              href="mailto:support@novra.ro"
              className="inline-flex items-center justify-center gap-2 border border-novra-border hover:bg-novra-elevated px-6 py-3 rounded-full font-semibold transition text-sm"
            >
              <Mail size={16} aria-hidden />
              support@novra.ro
            </a>
            <Link
              href="/faq"
              className="inline-flex items-center justify-center gap-2 text-purple-400 hover:text-purple-300 px-6 py-3 font-semibold transition text-sm"
            >
              {t("viewFaq")}
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

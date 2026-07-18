"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import ProductImage from "@/components/produse/ProductImage";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Award,
  Gem,
  Heart,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fadeUp } from "@/lib/motion";

export default function DespreNoi() {
  const t = useTranslations("about");

  const pillars = useMemo(
    () => [
      { icon: Zap, title: t("pillar1Title"), description: t("pillar1Desc") },
      { icon: Gem, title: t("pillar2Title"), description: t("pillar2Desc") },
      { icon: ShieldCheck, title: t("pillar3Title"), description: t("pillar3Desc") },
      { icon: Award, title: t("pillar4Title"), description: t("pillar4Desc") },
    ],
    [t]
  );

  const milestones = useMemo(
    () => [
      { year: "2024", event: t("milestone2024") },
      { year: "2025", event: t("milestone2025") },
      { year: "2026", event: t("milestone2026") },
    ],
    [t]
  );

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <section className="relative overflow-hidden pt-8 sm:pt-12 pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(139,92,246,0.12),transparent)] pointer-events-none" />
        <div className="absolute top-20 right-0 w-72 h-72 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <motion.div {...fadeUp} className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-purple-400 font-semibold tracking-[0.2em] uppercase text-xs sm:text-sm mb-6">
              <Sparkles size={14} aria-hidden />
              {t("badge")}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.05] mb-6">
              {t("title")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-600">
                {t("titleHighlight")}
              </span>
            </h1>
            <p className="text-gray-300 text-lg sm:text-xl leading-relaxed font-light max-w-2xl">{t("subtitle")}</p>
          </motion.div>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div {...fadeUp} className="relative h-64 sm:h-80 lg:h-[420px] rounded-3xl overflow-hidden border border-novra-border">
            <ProductImage
              src="/products/cabluri/albastru.png"
              category="usb-c"
              alt={t("storyImageAlt")}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain object-center p-6 sm:p-8"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-novra-bg/80 via-transparent to-transparent" />
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.7, delay: 0.15 }} className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("storyTitle")}</h2>
            <div className="space-y-5 text-gray-300 text-base sm:text-lg leading-relaxed font-light">
              <p>{t("storyP1")}</p>
              <p>{t("storyP2")}</p>
            </div>
            <Link
              href="/produse"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-full font-semibold transition-all duration-300 text-sm sm:text-base shadow-lg shadow-purple-900/30 hover:scale-105"
            >
              {t("viewProducts")}
              <ArrowRight size={16} aria-hidden />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 sm:py-24 bg-novra-bg-alt border-y border-novra-border/60">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12 sm:mb-16">
            <span className="text-purple-500 font-semibold text-sm uppercase tracking-widest mb-3 block">
              {t("pillarsBadge")}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{t("pillarsTitle")}</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {pillars.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group p-6 sm:p-7 rounded-2xl border border-novra-border bg-novra-card/40 hover:border-purple-500/40 hover:bg-novra-card/60 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <pillar.icon className="text-purple-400" size={22} aria-hidden />
                </div>
                <h3 className="font-bold text-lg mb-2">{pillar.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{pillar.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/50 via-novra-card/40 to-novra-surface p-8 sm:p-12 md:p-16"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-500/8 blur-[60px] rounded-full pointer-events-none" />

            <div className="relative flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                <Target className="text-purple-400" size={28} aria-hidden />
              </div>
              <div>
                <h3 className="text-white font-bold text-2xl sm:text-3xl mb-4 tracking-tight">{t("visionTitle")}</h3>
                <p className="text-gray-300 italic text-lg sm:text-xl leading-relaxed max-w-3xl">{t("visionQuote")}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 sm:py-24 border-t border-novra-border/60">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="text-purple-500 font-semibold text-sm uppercase tracking-widest mb-3 block">
              {t("timelineBadge")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("timelineTitle")}</h2>
          </motion.div>

          <div className="space-y-0">
            {milestones.map((item, i) => (
              <motion.div
                key={item.year}
                initial={false}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                viewport={{ once: true }}
                className="relative pl-8 sm:pl-10 pb-10 last:pb-0 border-l border-purple-500/30 ml-3 sm:ml-4"
              >
                <span className="absolute -left-[7px] top-1 w-3.5 h-3.5 rounded-full bg-purple-600 border-2 border-novra-bg shadow-[0_0_12px_rgba(168,85,247,0.5)]" />
                <span className="text-purple-400 font-bold text-sm uppercase tracking-widest">{item.year}</span>
                <p className="text-gray-300 mt-1.5 text-base sm:text-lg">{item.event}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-16">
        <motion.div
          {...fadeUp}
          className="max-w-7xl mx-auto text-center p-8 sm:p-12 rounded-3xl border border-novra-border bg-novra-card/30"
        >
          <Heart className="text-purple-500 mx-auto mb-4" size={32} aria-hidden />
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t("ctaTitle")}</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">{t("ctaDesc")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/produse"
              className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 px-8 py-3.5 rounded-full font-semibold transition duration-300"
            >
              {t("viewProducts")}
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 border border-novra-border hover:bg-novra-elevated px-8 py-3.5 rounded-full font-semibold transition duration-300"
            >
              {t("contactUs")}
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  FlaskConical,
  Gauge,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductImage from "@/components/produse/ProductImage";
import ScrollReveal from "@/components/home/ScrollReveal";
import { fadeUp } from "@/lib/motion";

const TEST_SECTIONS = [
  { key: "tests", icon: Gauge, image: "/products/cabluri/violet.png", category: "usb-c" as const },
  { key: "certifications", icon: Award, image: "/products/adaptoare/violet.png", category: "lightning" as const },
  { key: "temperature", icon: Thermometer, image: "/products/cabluri/albastru.png", category: "usb-c" as const },
  { key: "resistance", icon: ShieldCheck, image: "/products/cabluri/roz.png", category: "usb-c" as const },
] as const;

export default function NovraLabPageClient() {
  const t = useTranslations("novraLab");

  const labHighlights = useMemo(
    () => [
      { icon: FlaskConical, title: t("highlight1Title"), desc: t("highlight1Desc") },
      { icon: Zap, title: t("highlight2Title"), desc: t("highlight2Desc") },
      { icon: ShieldCheck, title: t("highlight3Title"), desc: t("highlight3Desc") },
    ],
    [t],
  );

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="pb-page">
        <section className="relative overflow-hidden pt-8 sm:pt-12 pb-16 sm:pb-24">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(139,92,246,0.14),transparent)] pointer-events-none" />
          <div className="absolute top-20 right-0 w-80 h-80 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="site-container relative">
            <motion.div {...fadeUp} className="max-w-3xl">
              <span className="inline-flex items-center gap-2 text-purple-400 font-semibold tracking-[0.2em] uppercase text-xs sm:text-sm mb-6">
                <FlaskConical size={14} aria-hidden />
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

        <section className="pb-16 sm:pb-24">
          <div className="site-container grid sm:grid-cols-3 gap-4 sm:gap-5">
            {labHighlights.map((item, index) => (
              <ScrollReveal key={item.title} variant="scale-up" delay={index * 80}>
                <div className="h-full rounded-2xl border border-purple-500/15 bg-novra-card/40 p-6 sm:p-7">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/25 bg-purple-600/15">
                    <item.icon size={20} className="text-purple-400" aria-hidden />
                  </div>
                  <h2 className="font-bold text-lg mb-2">{item.title}</h2>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-novra-bg-alt border-y border-novra-border/60">
          <div className="site-container">
            <ScrollReveal variant="fade-up" className="text-center mb-12 sm:mb-16">
              <span className="text-purple-500 font-semibold text-sm uppercase tracking-widest mb-3 block">
                {t("sectionsBadge")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{t("sectionsTitle")}</h2>
              <p className="text-gray-400 text-sm sm:text-base mt-3 max-w-2xl mx-auto">{t("sectionsSubtitle")}</p>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
              {TEST_SECTIONS.map((section, index) => {
                const Icon = section.icon;
                return (
                  <ScrollReveal
                    key={section.key}
                    variant={index % 2 === 0 ? "slide-left" : "slide-right"}
                    delay={index * 70}
                  >
                    <article className="group relative overflow-hidden rounded-3xl border border-purple-500/15 bg-novra-card/40 hover:border-purple-500/30 transition-colors duration-500">
                      <div className="grid sm:grid-cols-[1fr_140px] gap-0">
                        <div className="p-6 sm:p-8">
                          <span className="inline-flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-widest mb-3">
                            <Icon size={14} aria-hidden />
                            {t(`${section.key}Badge`)}
                          </span>
                          <h3 className="text-xl sm:text-2xl font-bold mb-3">{t(`${section.key}Title`)}</h3>
                          <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-4">
                            {t(`${section.key}Desc`)}
                          </p>
                          <ul className="space-y-2">
                            {[1, 2, 3].map((n) => (
                              <li key={n} className="flex items-start gap-2 text-sm text-gray-300">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                                {t(`${section.key}Point${n}`)}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="relative min-h-[160px] sm:min-h-full bg-gradient-to-br from-purple-950/40 to-novra-bg/20 border-t sm:border-t-0 sm:border-l border-purple-500/10">
                          <ProductImage
                            src={section.image}
                            category={section.category}
                            alt={t(`${section.key}Title`)}
                            fill
                            sizes="200px"
                            className="object-contain object-center p-4 drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)] group-hover:scale-[1.05] transition-transform duration-700"
                          />
                        </div>
                      </div>
                    </article>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="site-container">
            <ScrollReveal variant="fade-up" parallax>
              <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/50 via-novra-card/40 to-novra-surface p-8 sm:p-12 md:p-16">
                <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/10 blur-[90px] rounded-full pointer-events-none" />
                <div className="relative grid lg:grid-cols-2 gap-10 items-center">
                  <div>
                    <span className="inline-flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-widest mb-4">
                      <Sparkles size={14} aria-hidden />
                      {t("labStoryBadge")}
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-5">{t("labStoryTitle")}</h2>
                    <div className="space-y-4 text-gray-300 text-base sm:text-lg leading-relaxed font-light">
                      <p>{t("labStoryP1")}</p>
                      <p>{t("labStoryP2")}</p>
                      <p>{t("labStoryP3")}</p>
                    </div>
                  </div>
                  <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden border border-purple-500/15 bg-novra-bg/30">
                    <ProductImage
                      src="/products/bundle/novra-bundle-preview.png"
                      category="accesorii"
                      alt={t("labStoryImageAlt")}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain object-center p-6"
                    />
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="pb-16">
          <ScrollReveal variant="fade-up" className="site-container text-center p-8 sm:p-12 rounded-3xl border border-novra-border bg-novra-card/30">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t("ctaTitle")}</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">{t("ctaDesc")}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/produse"
                className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 px-8 py-3.5 rounded-full font-semibold transition duration-300"
              >
                {t("ctaProducts")}
                <ArrowRight size={16} aria-hidden />
              </Link>
              <Link
                href="/despre-noi"
                className="inline-flex items-center justify-center gap-2 border border-novra-border hover:bg-novra-elevated px-8 py-3.5 rounded-full font-semibold transition duration-300"
              >
                {t("ctaAbout")}
              </Link>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}

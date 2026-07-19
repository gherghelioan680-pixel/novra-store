"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ProductImage from "@/components/produse/ProductImage";
import ScrollReveal from "@/components/home/ScrollReveal";

export default function BrandStoryBlock() {
  const t = useTranslations("home");

  return (
    <section id="despre" className="py-16 sm:py-24 border-t border-novra-border site-container">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <ScrollReveal variant="slide-right" className="order-2 lg:order-1">
          <span className="inline-flex items-center gap-2 text-purple-400 font-semibold tracking-[0.2em] uppercase text-xs sm:text-sm mb-4">
            <Sparkles size={14} aria-hidden />
            {t("aboutBadge")}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-5 leading-[1.1]">
            {t("aboutTitle")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-600">
              {t("aboutTitleHighlight")}
            </span>
          </h2>

          <blockquote className="relative mb-6 pl-4 border-l-2 border-purple-500/50">
            <p className="text-purple-100/90 text-base sm:text-lg leading-relaxed font-light italic">
              {t("brandOriginQuote")}
            </p>
          </blockquote>

          <p className="text-gray-300 text-base sm:text-lg leading-relaxed font-light mb-4">
            {t("aboutDesc")}
          </p>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8">
            {t("brandPersonality")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/despre-noi"
              className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-full font-semibold transition duration-300 text-sm sm:text-base"
            >
              {t("discoverStory")}
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link
              href="/novra-lab"
              className="inline-flex items-center justify-center gap-2 border border-novra-border hover:bg-novra-elevated px-6 py-3 rounded-full font-semibold transition duration-300 text-sm sm:text-base"
            >
              {t("whyLabLink")}
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="slide-left" parallax className="order-1 lg:order-2">
          <div className="relative h-72 sm:h-96 lg:h-[480px] rounded-3xl overflow-hidden border border-purple-500/15 bg-gradient-to-b from-purple-950/50 to-novra-card/40 shadow-2xl shadow-purple-950/25">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(139,92,246,0.14),transparent_65%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(15,5,25,0.5)_100%)]" />
            <div className="absolute inset-0">
              <ProductImage
                src="/products/bundle/novra-bundle-preview.png"
                category="accesorii"
                alt={t("aboutImageAlt")}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain object-center scale-[1.05] sm:scale-[1.1] drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
              />
            </div>
            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-novra-bg/80 backdrop-blur-md border border-purple-500/15">
              <p className="text-xs text-purple-300 font-semibold uppercase tracking-widest mb-1">
                {t("customersCount")}
              </p>
              <p className="text-sm text-white font-medium">{t("brandTagline")}</p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

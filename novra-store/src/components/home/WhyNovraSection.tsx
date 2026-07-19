"use client";

import { ArrowRight, CheckCircle2, FlaskConical } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ProductImage from "@/components/produse/ProductImage";
import ScrollReveal from "@/components/home/ScrollReveal";

const CARDS = [
  {
    key: "whyBends" as const,
    image: "/products/cabluri/violet.png",
    category: "usb-c" as const,
    span: "lg:col-span-2 lg:row-span-2",
    tall: true,
  },
  {
    key: "whyPdCert" as const,
    image: "/products/adaptoare/violet.png",
    category: "lightning" as const,
    span: "",
    tall: false,
  },
  {
    key: "whyTextile" as const,
    image: "/products/cabluri/albastru.png",
    category: "usb-c" as const,
    span: "",
    tall: false,
  },
  {
    key: "whySafeCharge" as const,
    image: "/products/adaptoare/albastru.png",
    category: "lightning" as const,
    span: "lg:col-span-2",
    tall: false,
  },
  {
    key: "whyOvervoltage" as const,
    image: "/products/cabluri/roz.png",
    category: "usb-c" as const,
    span: "lg:col-span-3",
    tall: false,
  },
] as const;

export default function WhyNovraSection() {
  const t = useTranslations("home");

  return (
    <section className="py-16 sm:py-24 site-container">
      <ScrollReveal variant="fade-up" className="mb-10 sm:mb-14">
        <span className="inline-flex items-center gap-2 text-purple-400 font-semibold text-xs sm:text-sm mb-3 uppercase tracking-[0.2em]">
          <CheckCircle2 size={14} aria-hidden />
          {t("whyBadge")}
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
          {t("whyTitle")}{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
            NOVRA
          </span>
        </h2>
        <p className="text-gray-400 text-sm sm:text-base max-w-2xl">{t("whySubtitle")}</p>
      </ScrollReveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-5 auto-rows-[minmax(180px,auto)]">
        {CARDS.map((card, index) => (
          <ScrollReveal
            key={card.key}
            variant={index % 2 === 0 ? "slide-left" : "slide-right"}
            delay={index * 80}
            className={`group relative overflow-hidden rounded-2xl border border-purple-500/15 bg-novra-card/40 p-5 sm:p-6 hover:border-purple-500/35 transition-colors duration-500 ${card.span} ${card.tall ? "min-h-[280px] sm:min-h-[360px]" : "min-h-[200px]"}`}
          >
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600/10 via-transparent to-fuchsia-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-purple-400/10" />

            <div className={`relative z-10 flex h-full flex-col ${card.tall ? "sm:flex-row sm:items-end sm:gap-6" : ""}`}>
              <div className={`relative ${card.tall ? "sm:flex-1 sm:max-w-[55%]" : "mb-4"} ${card.tall ? "h-40 sm:h-full sm:min-h-[220px]" : "h-28 sm:h-32"}`}>
                <ProductImage
                  src={card.image}
                  category={card.category}
                  alt={t(`${card.key}Title`)}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain object-center drop-shadow-[0_16px_32px_rgba(0,0,0,0.45)] group-hover:scale-[1.04] transition-transform duration-700"
                />
              </div>

              <div className={`relative z-10 ${card.tall ? "sm:flex-1" : ""}`}>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">
                  <CheckCircle2 size={12} aria-hidden />
                  {t("whyVerified")}
                </span>
                <h3 className="font-bold text-base sm:text-lg text-white mb-1.5 group-hover:text-purple-200 transition-colors">
                  {t(`${card.key}Title`)}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{t(`${card.key}Desc`)}</p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal variant="fade-up" delay={120} className="mt-8 sm:mt-10">
        <Link
          href="/novra-lab"
          className="group inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-600/10 px-5 py-3 text-sm font-semibold text-purple-200 hover:bg-purple-600/20 hover:border-purple-500/40 transition-all duration-300"
        >
          <FlaskConical size={16} className="text-purple-400" aria-hidden />
          {t("whyLabLink")}
          <ArrowRight size={14} className="transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </ScrollReveal>
    </section>
  );
}

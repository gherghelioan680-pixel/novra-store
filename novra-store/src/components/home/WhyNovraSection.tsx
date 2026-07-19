"use client";

import { ArrowRight, FlaskConical, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ProductImage from "@/components/produse/ProductImage";
import ScrollReveal from "@/components/home/ScrollReveal";

type CardKey =
  | "whyBends"
  | "whyPdCert"
  | "whyTextile"
  | "whySafeCharge"
  | "whyOvervoltage";

type FeatureCard = {
  key: CardKey;
  image: string;
  category: "usb-c" | "lightning";
  stat?: string;
  imagePosition?: string;
  imageScale?: string;
};

const FEATURES: FeatureCard[] = [
  {
    key: "whyBends",
    image: "/products/cabluri/violet.png",
    category: "usb-c",
    stat: "10.000",
    imagePosition: "object-[center_35%]",
    imageScale: "scale-[1.15] group-hover:scale-[1.22]",
  },
  {
    key: "whyPdCert",
    image: "/products/adaptoare/violet.png",
    category: "lightning",
    stat: "100W",
    imagePosition: "object-right object-center",
    imageScale: "scale-[1.05] group-hover:scale-[1.12]",
  },
  {
    key: "whyTextile",
    image: "/products/cabluri/albastru.png",
    category: "usb-c",
    imagePosition: "object-[center_40%]",
    imageScale: "scale-[1.1] group-hover:scale-[1.16]",
  },
  {
    key: "whySafeCharge",
    image: "/products/adaptoare/albastru.png",
    category: "lightning",
    stat: "E-Mark",
    imagePosition: "object-right object-center",
    imageScale: "scale-[1.05] group-hover:scale-[1.12]",
  },
  {
    key: "whyOvervoltage",
    image: "/products/cabluri/roz.png",
    category: "usb-c",
    imagePosition: "object-[center_38%]",
    imageScale: "scale-[1.12] group-hover:scale-[1.18]",
  },
];

const GLOW_OVERLAY = (
  <>
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(139,92,246,0.16),transparent_62%)]" />
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(15,5,25,0.72)_100%)]" />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-novra-bg via-novra-bg/55 to-transparent" />
  </>
);

function PremiumFeatureCard({
  card,
  title,
  description,
  verifiedLabel,
  variant = "standard",
  className = "",
}: {
  card: FeatureCard;
  title: string;
  description: string;
  verifiedLabel: string;
  variant?: "hero" | "standard";
  className?: string;
}) {
  const isHero = variant === "hero";

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/55 via-novra-card/45 to-novra-bg/80 shadow-[0_24px_60px_-20px_rgba(88,28,135,0.45)] transition-[border-color,box-shadow] duration-500 hover:border-purple-400/35 hover:shadow-[0_28px_70px_-18px_rgba(139,92,246,0.35)] ${isHero ? "min-h-[420px] sm:min-h-[480px] lg:min-h-full lg:h-full" : "min-h-[340px] sm:min-h-[300px]"} ${className}`}
    >
      {GLOW_OVERLAY}

      <div
        className={`pointer-events-none absolute inset-0 transition-transform duration-700 ease-out ${card.imageScale ?? "scale-105 group-hover:scale-110"}`}
      >
        <ProductImage
          src={card.image}
          category={card.category}
          alt={title}
          fill
          sizes={
            isHero
              ? "(max-width: 1024px) 85vw, 40vw"
              : "(max-width: 1024px) 85vw, 30vw"
          }
          className={`object-contain drop-shadow-[0_28px_48px_rgba(0,0,0,0.55)] ${card.imagePosition ?? "object-center"}`}
        />
      </div>

      {card.stat && (
        <div
          className={`absolute z-10 ${isHero ? "top-6 left-6 sm:top-8 sm:left-8" : "top-5 left-5 sm:top-6 sm:left-6"}`}
        >
          <p
            className={`font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-purple-100 to-purple-300/90 drop-shadow-[0_2px_24px_rgba(139,92,246,0.35)] ${isHero ? "text-5xl sm:text-6xl lg:text-7xl" : "text-4xl sm:text-5xl"}`}
          >
            {card.stat}
          </p>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5 lg:p-6">
        <div className="rounded-2xl border border-purple-500/20 bg-novra-bg/55 p-4 sm:p-5 backdrop-blur-xl backdrop-saturate-150">
          <span className="mb-2 inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            {verifiedLabel}
          </span>
          <h3
            className={`font-bold text-white group-hover:text-purple-100 transition-colors duration-300 ${isHero ? "text-lg sm:text-xl lg:text-2xl mb-2" : "text-base sm:text-lg mb-1.5"}`}
          >
            {title}
          </h3>
          <p
            className={`text-gray-400 leading-relaxed ${isHero ? "text-sm sm:text-base max-w-md" : "text-xs sm:text-sm"}`}
          >
            {description}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-purple-400/10 group-hover:ring-purple-400/25 transition-[box-shadow] duration-500" />
      <div className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-purple-500/20 via-transparent to-fuchsia-600/10" />
    </article>
  );
}

export default function WhyNovraSection() {
  const t = useTranslations("home");
  const [heroCard, ...stackCards] = FEATURES;

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-[420px] w-[min(100%,920px)] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-fuchsia-600/8 blur-[100px]" />
      </div>

      <div className="site-container relative">
        <ScrollReveal variant="fade-up" className="mx-auto mb-12 sm:mb-16 max-w-3xl text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-600/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
            <Sparkles size={14} aria-hidden />
            {t("whyBadge")}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.08] mb-4">
            {t("whyTitle")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-600">
              NOVRA
            </span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg font-light leading-relaxed">
            {t("whySubtitle")}
          </p>
        </ScrollReveal>

        {/* Mobile & tablet: horizontal scroll */}
        <div className="lg:hidden">
          <div className="-mx-4 flex gap-4 overflow-x-auto overscroll-x-contain px-4 pb-3 snap-x snap-mandatory sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FEATURES.map((card, index) => (
              <ScrollReveal
                key={card.key}
                variant="scale-up"
                delay={index * 70}
                className="w-[min(88vw,380px)] shrink-0 snap-center"
              >
                <PremiumFeatureCard
                  card={card}
                  variant={card.key === "whyBends" ? "hero" : "standard"}
                  title={t(`${card.key}Title`)}
                  description={t(`${card.key}Desc`)}
                  verifiedLabel={t("whyVerified")}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Desktop: hero + stacked grid */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:grid-rows-[minmax(280px,1fr)_minmax(280px,1fr)_minmax(240px,auto)] gap-5">
          <ScrollReveal variant="slide-right" className="lg:col-span-5 lg:row-span-2">
            <PremiumFeatureCard
              card={heroCard}
              variant="hero"
              title={t(`${heroCard.key}Title`)}
              description={t(`${heroCard.key}Desc`)}
              verifiedLabel={t("whyVerified")}
              className="h-full"
            />
          </ScrollReveal>

          {stackCards.slice(0, 2).map((card, index) => (
            <ScrollReveal
              key={card.key}
              variant={index === 0 ? "slide-left" : "fade-up"}
              delay={index * 80}
              className="lg:col-span-7"
            >
              <PremiumFeatureCard
                card={card}
                title={t(`${card.key}Title`)}
                description={t(`${card.key}Desc`)}
                verifiedLabel={t("whyVerified")}
              />
            </ScrollReveal>
          ))}

          {stackCards.slice(2).map((card, index) => (
            <ScrollReveal
              key={card.key}
              variant={index === 0 ? "slide-left" : "slide-right"}
              delay={(index + 2) * 80}
              className="lg:col-span-6"
            >
              <PremiumFeatureCard
                card={card}
                title={t(`${card.key}Title`)}
                description={t(`${card.key}Desc`)}
                verifiedLabel={t("whyVerified")}
              />
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal variant="fade-up" delay={160} className="mt-10 sm:mt-12 flex justify-center">
          <Link
            href="/novra-lab"
            className="group inline-flex items-center gap-2.5 rounded-full border border-purple-500/30 bg-gradient-to-r from-purple-600/20 to-fuchsia-600/10 px-6 py-3.5 text-sm font-semibold text-purple-100 shadow-lg shadow-purple-950/30 backdrop-blur-sm transition-all duration-300 hover:border-purple-400/45 hover:from-purple-600/30 hover:to-fuchsia-600/15"
          >
            <FlaskConical size={16} className="text-purple-300" aria-hidden />
            {t("whyLabLink")}
            <ArrowRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

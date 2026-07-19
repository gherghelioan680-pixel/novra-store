"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ProductImage from "@/components/produse/ProductImage";
import BundleProductImages from "@/components/produse/BundleProductImages";
import ProductGalleryBox from "@/components/produse/ProductGalleryBox";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, RefreshCcw, Gem, ShieldCheck, CheckCircle2, ShoppingBag, Package, ArrowRight, Mail, Sparkles, Gift, Star, Quote } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppCta from "@/components/WhatsAppCta";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { getReviewAvatarUrl } from "@/lib/reviews";
import {
  getProductsByCategory,
  getProductById,
  loadProductOverrides,
  getBundleSavings,
  isBundleProduct,
  getProductStockQuantity,
  formatStockLabel,
  isProductInStock,
} from "@/lib/catalog";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useReviews } from "@/hooks/useReviews";
import CampaignHomeBanner from "@/components/CampaignHomeBanner";
import HomeExploreLinks from "@/components/HomeExploreLinks";
import { addNewsletterSubscriber } from "@/lib/newsletter";
import { buildWhatsAppUrl, createStoreRefreshEffect } from "@/lib/store";

const LiveVisitors = dynamic(() => import("@/components/LiveVisitors"), {
  ssr: false,
});

const FEATURED_PRODUCT_IDS = ["usb-c-100w", "usb-c-lightning-pd", "bundle-travel-pack"];

const HERO_CATEGORY_IDS = ["usb-c", "lightning", "accesorii"] as const;

const PREMIUM_GLOW_OVERLAY = (
  <>
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(139,92,246,0.12),transparent_70%)]" />
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(15,5,25,0.55)_100%)]" />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-purple-950/50 to-transparent" />
  </>
);

const ECOSYSTEM_ADAPTER_COLORS = ["violet", "albastru", "roz"] as const;

function getCategoryMinPrice(categoryId: string): number {
  const products = getProductsByCategory(categoryId);
  if (!products.length) return 0;
  return Math.min(...products.map((p) => p.basePrice));
}

function HeroPriceRotator() {
  const th = useTranslations("home");
  const tc = useTranslations("categories");
  const [heroProducts, setHeroProducts] = useState(() =>
    HERO_CATEGORY_IDS.map((id) => ({
      id,
      label: tc(id),
      description: th(`${id === "usb-c" ? "cables" : id === "lightning" ? "adapters" : "bundles"}Desc`),
      price: getCategoryMinPrice(id).toFixed(2),
    }))
  );
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoRotate = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_CATEGORY_IDS.length);
    }, 4000);
  }, []);

  useEffect(() => {
    return createStoreRefreshEffect(async () => {
      await loadProductOverrides();
      setHeroProducts(
        HERO_CATEGORY_IDS.map((id) => ({
          id,
          label: tc(id),
          description: th(`${id === "usb-c" ? "cables" : id === "lightning" ? "adapters" : "bundles"}Desc`),
          price: getCategoryMinPrice(id).toFixed(2),
        }))
      );
    }, { scopes: ["products"] });
  }, []);

  useEffect(() => {
    startAutoRotate();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoRotate]);

  const handleDotClick = (i: number) => {
    setIndex(i);
    startAutoRotate();
  };

  const current = heroProducts[index];

  return (
    <div>
      <div className="relative min-h-[110px] sm:min-h-[140px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.label}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45 }}
            className="absolute inset-0 pointer-events-none"
          >
            <p className="text-purple-400 text-sm font-semibold uppercase tracking-[0.2em] mb-2">
              {current.label}
            </p>
            <p className="text-3xl min-[375px]:text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter text-white mb-2">
              {current.price}{" "}
              <span className="text-lg sm:text-xl font-medium text-gray-400">{th("currency")}</span>
            </p>
            <p className="text-gray-400 text-sm sm:text-base max-w-md">{current.description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-10 flex gap-1 -ml-2 mt-1">
        {heroProducts.map((product, i) => (
          <button
            key={product.label}
            type="button"
            aria-label={th("showCategory", { label: product.label })}
            aria-pressed={i === index}
            onClick={() => handleDotClick(i)}
            className="min-h-11 min-w-11 flex items-center justify-center touch-manipulation rounded-full"
          >
            <span
              className={`block h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-purple-500" : "w-1.5 bg-novra-border"
              }`}
              aria-hidden
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const th = useTranslations("home");
  const tcat = useTranslations("categories");
  const { whatsappNumber } = useSiteSettings();
  const reviews = useReviews(2);
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "sending" | "success" | "duplicate" | "error">("idle");
  const [newsletterDiscountMessage, setNewsletterDiscountMessage] = useState("");
  const [homepageProducts, setHomepageProducts] = useState(() => buildHomepageProducts(tcat));

  useEffect(() => {
    return createStoreRefreshEffect(async () => {
      await loadProductOverrides();
      setHomepageProducts(buildHomepageProducts(tcat));
    }, { scopes: ["products"] });
  }, [tcat]);

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setNewsletterStatus("sending");

    const formElements = form.elements as HTMLFormControlsCollection & { email: HTMLInputElement };
    const emailValue = formElements.email.value;

    const result = await addNewsletterSubscriber(emailValue, { source: "homepage" });

    if (result.ok) {
      if (result.alreadySubscribed) {
        setNewsletterStatus("duplicate");
        setNewsletterDiscountMessage(result.discountMessage ?? "");
      } else {
        setNewsletterStatus("success");
        setNewsletterDiscountMessage(result.discountMessage ?? "");
        form.reset();
      }
    } else {
      setNewsletterStatus("error");
      setNewsletterDiscountMessage("");
    }
  };

  const whatsappHref = buildWhatsAppUrl(whatsappNumber, th("whatsappMessage"));

  return (
    <>
      <Navbar />
      <LiveVisitors />

      <main className="w-full">

      <div className="site-container pt-6">
        <CampaignHomeBanner />
      </div>

      {/* Hero */}
      <section id="acasa" className="flex flex-col lg:flex-row items-center justify-between py-10 sm:py-16 md:py-24 site-container gap-10 lg:gap-16">
        <motion.div
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-xl"
        >
          <p className="text-purple-400 text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] mb-4">
            {th("badge")}
          </p>
          <h1 className="text-3xl min-[375px]:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-5 sm:mb-6 leading-[1.05]">
            {th("heroLine1")}
            <br />
            {th("heroLine2")}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
              {th("heroLine3")}
            </span>
          </h1>
          <p className="text-gray-300 text-base sm:text-lg mb-8 max-w-md leading-relaxed">
            {th("heroSubtitle")}
          </p>

          <div className="mb-10 p-5 sm:p-6 rounded-2xl border border-novra-border bg-novra-card/30 backdrop-blur-sm">
            <HeroPriceRotator />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/produse"
              className="inline-flex items-center justify-center gap-2 bg-purple-600 px-6 sm:px-8 py-3.5 min-h-11 rounded-full font-semibold hover:bg-purple-700 transition duration-300 text-center text-sm sm:text-base shadow-lg shadow-purple-900/30 touch-manipulation"
            >
              {th("shopNow")}
              <ArrowRight size={16} aria-hidden />
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] px-6 sm:px-8 py-3.5 rounded-full font-semibold transition duration-300 text-center text-sm sm:text-base shadow-lg shadow-green-500/20"
            >
              <FaWhatsapp size={18} aria-hidden />
              {th("orderWhatsapp")}
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative w-full max-w-[560px] lg:max-w-[620px] shrink-0"
        >
          <div className="pointer-events-none absolute -inset-4 bg-purple-600/12 rounded-[2.5rem] blur-2xl" />
          <ProductGalleryBox
            aspectClassName="aspect-[4/5] sm:aspect-square min-h-[300px] sm:min-h-[380px] md:min-h-[520px]"
            contentPadding="p-0"
            className="rounded-3xl border border-purple-500/20 bg-gradient-to-b from-purple-950/40 to-novra-card/60 shadow-2xl shadow-purple-950/40"
            overlay={PREMIUM_GLOW_OVERLAY}
          >
            <div className="relative h-full w-full">
              <ProductImage
                src="/products/cabluri/violet.png"
                category="usb-c"
                alt={th("heroImageAlt")}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 620px"
                className="object-contain object-center scale-[1.15] sm:scale-[1.2] translate-y-4 sm:translate-y-6 drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)]"
              />
              <div className="absolute inset-x-0 top-[8%] flex justify-center">
                <div className="relative w-[48%] sm:w-[44%] aspect-square">
                  <ProductImage
                    src="/products/adaptoare/violet.png"
                    category="lightning"
                    alt={th("heroImageAlt")}
                    fill
                    sizes="280px"
                    className="object-contain object-center drop-shadow-[0_16px_32px_rgba(0,0,0,0.5)]"
                  />
                </div>
              </div>
            </div>
          </ProductGalleryBox>
        </motion.div>
      </section>

      {/* Beneficii */}
      <motion.section
        initial={false}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-10 sm:py-16 border-y border-novra-border grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 site-container"
      >
        <div className="flex flex-col items-center text-center gap-3">
          <Zap className="text-purple-500" size={32} />
          <div>
            <h3 className="font-semibold text-sm sm:text-lg">{th("benefitFastCharge")}</h3>
            <p className="text-xs sm:text-sm text-gray-300">{th("benefitFastChargeSub")}</p>
          </div>
        </div>
        <div className="flex flex-col items-center text-center gap-3">
          <RefreshCcw className="text-purple-500" size={32} />
          <div>
            <h3 className="font-semibold text-sm sm:text-lg">{th("benefitDataTransfer")}</h3>
            <p className="text-xs sm:text-sm text-gray-300">{th("benefitDataTransferSub")}</p>
          </div>
        </div>
        <div className="flex flex-col items-center text-center gap-3">
          <Gem className="text-purple-500" size={32} />
          <div>
            <h3 className="font-semibold text-sm sm:text-lg">{th("benefitMaterials")}</h3>
            <p className="text-xs sm:text-sm text-gray-300">{th("benefitMaterialsSub")}</p>
          </div>
        </div>
        <div className="flex flex-col items-center text-center gap-3">
          <ShieldCheck className="text-purple-500" size={32} />
          <div>
            <h3 className="font-semibold text-sm sm:text-lg">{th("benefitWarranty")}</h3>
            <p className="text-xs sm:text-sm text-gray-300">{th("benefitWarrantySub")}</p>
          </div>
        </div>
      </motion.section>

      {/* Produse */}
      <motion.section
        id="produse"
        initial={false}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-16 sm:py-20 site-container relative"
      >
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-48 bg-purple-600/8 blur-[100px] rounded-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8 sm:mb-12 relative">
          <div>
            <span className="inline-flex items-center gap-2 text-purple-400 font-semibold text-xs sm:text-sm mb-3 uppercase tracking-[0.2em]">
              <Zap size={14} aria-hidden />
              {th("popularProducts")}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              {th("choosePerformance")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                NOVRA
              </span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-lg">
              {th("productsSubtitle")}
            </p>
          </div>
          <Link
            href="/produse"
            className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition font-medium"
          >
            {th("viewAllProducts")}
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
          {homepageProducts.map((product, i) => (
            <ProductCard key={product.productId} index={i} whatsappNumber={whatsappNumber} {...product} />
          ))}
        </div>
      </motion.section>

      {/* Banner Pachet */}
      <motion.section
        initial={false}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-8 sm:py-12 site-container"
      >
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/60 via-novra-card/50 to-novra-surface p-6 sm:p-10 md:p-12 lg:p-14">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/8 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                <Package size={14} aria-hidden />
                {th("bundleBadge")}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
                {th("bundleTitle")}
              </h2>
              <p className="text-gray-300 text-sm sm:text-base mb-6 max-w-xl mx-auto lg:mx-0">
                {th("bundleDesc")}
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-purple-400">{th("bundlePrice")}</span>
                <span className="text-sm text-gray-500 line-through">{th("bundleOldPrice")}</span>
                <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                  {th("bundleSavings")}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/produse?category=accesorii"
                  className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-full font-semibold transition text-sm sm:text-base"
                >
                  {th("viewBundles")}
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <Link
                  href="/accesorii"
                  className="inline-flex items-center justify-center gap-2 border border-novra-border hover:bg-novra-elevated px-6 py-3 rounded-full font-semibold transition text-sm sm:text-base"
                >
                  {th("exploreRange")}
                </Link>
              </div>
            </div>

            <div className="relative w-full max-w-[380px] sm:max-w-[420px] lg:max-w-[460px] shrink-0 order-1 lg:order-2">
              <ProductGalleryBox
                aspectClassName="aspect-square min-h-[280px] sm:min-h-[340px]"
                contentPadding="p-3 sm:p-4"
                className="rounded-2xl border border-purple-500/15 bg-gradient-to-b from-purple-950/30 to-novra-card/40 shadow-xl shadow-purple-950/30"
                overlay={
                  <>
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(139,92,246,0.1),transparent_65%)]" />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(15,5,25,0.4)_100%)]" />
                  </>
                }
              >
                <div className="grid h-full w-full grid-cols-3 gap-2 sm:gap-3">
                  {ECOSYSTEM_ADAPTER_COLORS.map((color) => (
                    <div key={color} className="relative min-h-0">
                      <ProductImage
                        src={`/products/adaptoare/${color}.png`}
                        category="lightning"
                        alt={th("bundleImageAlt")}
                        fill
                        sizes="120px"
                        className="object-contain object-center scale-[1.08] drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)]"
                      />
                    </div>
                  ))}
                </div>
              </ProductGalleryBox>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Despre NOVRA */}
      <motion.section
        id="despre"
        initial={false}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-16 sm:py-24 border-t border-novra-border site-container"
      >
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="order-2 lg:order-1">
            <span className="inline-flex items-center gap-2 text-purple-400 font-semibold tracking-[0.2em] uppercase text-xs sm:text-sm mb-4">
              <Sparkles size={14} aria-hidden />
              {th("aboutBadge")}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-[1.1]">
              {th("aboutTitle")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-600">
                {th("aboutTitleHighlight")}
              </span>
            </h2>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed font-light mb-6">
              {th("aboutDesc")}
            </p>
            <ul className="space-y-3 mb-8">
              {[
                { icon: Zap, text: th("aboutFeature1") },
                { icon: Gem, text: th("aboutFeature2") },
                { icon: ShieldCheck, text: th("aboutFeature3") },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="w-8 h-8 rounded-lg bg-purple-600/15 border border-purple-500/25 flex items-center justify-center shrink-0">
                    <item.icon size={15} className="text-purple-400" aria-hidden />
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/despre-noi"
                className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-full font-semibold transition duration-300 text-sm sm:text-base"
              >
                {th("discoverStory")}
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          </div>
          <div className="order-1 lg:order-2 relative h-72 sm:h-96 lg:h-[480px] rounded-3xl overflow-hidden border border-purple-500/15 bg-gradient-to-b from-purple-950/50 to-novra-card/40 shadow-2xl shadow-purple-950/25">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(139,92,246,0.14),transparent_65%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(15,5,25,0.5)_100%)]" />
            <div className="absolute inset-0">
              <ProductImage
                src="/products/bundle/novra-bundle-preview.png"
                category="accesorii"
                alt={th("aboutImageAlt")}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain object-center scale-[1.05] sm:scale-[1.1] drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
              />
            </div>
            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-novra-bg/80 backdrop-blur-md border border-purple-500/15">
              <p className="text-xs text-purple-300 font-semibold uppercase tracking-widest mb-1">{th("customersCount")}</p>
              <p className="text-sm text-white font-medium">{th("brandTagline")}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Recenzii — teaser */}
      <motion.section
        initial={false}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-16 sm:py-24 bg-novra-bg-alt border-y border-novra-border/60"
      >
        <div className="site-container">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-12">
            <div>
              <span className="inline-flex items-center gap-2 text-purple-400 font-semibold text-xs sm:text-sm mb-3 uppercase tracking-[0.2em]">
                <Star size={14} aria-hidden />
                {th("reviewsBadge")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                {th("reviewsTitle")}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                  {th("reviewsTitleHighlight")}
                </span>{" "}
                {th("reviewsTitleEnd")}
              </h2>
            </div>
            <Link
              href="/recenzii"
              className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition font-medium"
            >
              {th("viewAllReviews")}
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group relative p-6 sm:p-7 rounded-2xl border border-white/8 bg-novra-card/40 hover:border-purple-500/30 transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 blur-[30px] rounded-full group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
                <Quote size={20} className="text-purple-500/40 mb-3" aria-hidden />
                <div className="flex gap-0.5 mb-4" aria-label={th("starsLabel", { count: review.rating })}>
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} size={14} className="text-yellow-500 fill-yellow-500" aria-hidden />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic text-sm sm:text-base leading-relaxed flex-1">
                  &ldquo;{review.comment}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t border-white/8 pt-4">
                  <img
                    src={getReviewAvatarUrl(review.name)}
                    alt={review.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full shrink-0 border-2 border-purple-500/30"
                  />
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-1">
                      {review.name}
                      <CheckCircle2 size={14} className="text-purple-400 shrink-0" aria-label={th("verifiedCustomer")} />
                    </p>
                    <p className="text-xs text-gray-500">{review.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <HomeExploreLinks />

      {/* Newsletter Premium */}
      <motion.section
        id="newsletter"
        initial={false}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-16 sm:py-24 site-container"
      >
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/15 bg-novra-card/30">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_50%,rgba(139,92,246,0.08),transparent_60%)]" />

          <div className="relative z-10 grid lg:grid-cols-2 gap-8 lg:gap-0 items-stretch">
            <div className="relative min-h-[260px] sm:min-h-[320px] lg:min-h-[420px] bg-gradient-to-br from-purple-950/40 to-novra-card/20 border-b lg:border-b-0 lg:border-r border-purple-500/10">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(139,92,246,0.1),transparent_65%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(15,5,25,0.45)_100%)]" />
              <div className="absolute inset-0 p-4 sm:p-6 lg:p-8">
                <ProductImage
                  src="/products/adaptoare/roz.png"
                  category="lightning"
                  alt={th("newsletterImageAlt")}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain object-center scale-[1.08] sm:scale-[1.14] drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
                />
              </div>
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-novra-bg/80 backdrop-blur-md border border-purple-500/15">
                <p className="text-xs text-purple-300 font-semibold uppercase tracking-widest mb-1">{th("welcomeOffer")}</p>
                <p className="text-sm text-white font-medium">{th("welcomeDiscount")}</p>
              </div>
            </div>

            <div className="flex flex-col justify-center p-6 sm:p-10 md:p-12 lg:p-14">
              <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-600/10 text-purple-300 text-xs font-semibold uppercase tracking-[0.2em] px-3 py-1.5 mb-5 w-fit">
                <Mail size={13} aria-hidden />
                {th("newsletterBadge")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-[1.15]">
                {th("newsletterTitle")}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-purple-500">
                  {th("newsletterTitleHighlight")}
                </span>
              </h2>
              <p className="text-gray-300 text-sm sm:text-base mb-6 max-w-md leading-relaxed">
                {th("newsletterLongDesc")}
              </p>

              <ul className="space-y-2.5 mb-8">
                {[th("newsletterPerk1"), th("newsletterPerk2"), th("newsletterPerk3")].map((perk) => (
                  <li key={perk} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600/10 border border-purple-500/20 shrink-0">
                      <Gift size={13} className="text-purple-400" aria-hidden />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>

              <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5 rounded-xl border border-purple-500/20 bg-novra-bg/50 p-1.5">
                  <div className="relative flex-1 min-w-0">
                    <Mail
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400/60 pointer-events-none"
                      aria-hidden
                    />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder={th("emailPlaceholder")}
                      className="w-full bg-transparent border-0 pl-11 pr-4 py-3.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-500/30 text-white placeholder:text-novra-muted text-sm sm:text-base"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={newsletterStatus === "sending"}
                    className="inline-flex items-center justify-center gap-2 min-h-11 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 px-6 sm:px-8 py-3.5 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 cursor-pointer whitespace-nowrap text-sm sm:text-base shadow-lg shadow-purple-900/30 touch-manipulation"
                  >
                    {newsletterStatus === "sending" ? th("sending") : th("subscribe")}
                    {newsletterStatus !== "sending" && <ArrowRight size={16} aria-hidden />}
                  </button>
                </div>

                {newsletterStatus === "success" && (
                  <motion.p
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-purple-300 font-medium text-sm flex flex-col items-start gap-1"
                  >
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-400 shrink-0" aria-hidden />
                      {th("newsletterSuccess")}
                    </span>
                    {newsletterDiscountMessage && (
                      <span className="text-emerald-400 text-xs font-semibold pl-6">{newsletterDiscountMessage}</span>
                    )}
                  </motion.p>
                )}

                {newsletterStatus === "duplicate" && (
                  <motion.p
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-purple-300 font-medium text-sm flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} className="text-amber-400 shrink-0" aria-hidden />
                    {th("newsletterDuplicate")}
                  </motion.p>
                )}

                {newsletterStatus === "error" && (
                  <p className="text-red-400 font-medium text-sm">
                    {th("newsletterError")}
                  </p>
                )}
              </form>

              <p className="text-xs text-novra-muted mt-4">{th("noSpam")}</p>
            </div>
          </div>
        </div>
      </motion.section>

      <WhatsAppCta />
      </main>

      <footer id="contact">
        <Footer />
      </footer>
    </>
  );
}

function buildHomepageProducts(tcat: (key: string) => string) {
  return FEATURED_PRODUCT_IDS.map((id) => {
    const product = getProductById(id);
    if (!product) return null;
    const categoryLabel = tcat(product.category);
    return {
      title: product.title,
      category: categoryLabel,
      categoryId: product.category,
      price: `${product.basePrice.toFixed(2)} Lei`,
      imageSrc: product.imageSrc,
      productId: product.id,
      unitPrice: product.basePrice,
      variantLabel: product.tag || product.options[0] || "Standard",
      bestseller: product.bestseller,
      bundleSavings: getBundleSavings(product),
      isBundle: isBundleProduct(product.category),
      stockQuantity: getProductStockQuantity(product),
      stockLabel: formatStockLabel(getProductStockQuantity(product)),
      inStock: isProductInStock(product),
    };
  }).filter(Boolean) as Array<{
    title: string;
    category: string;
    categoryId: string;
    price: string;
    imageSrc: string;
    productId: string;
    unitPrice: number;
    variantLabel: string;
    bestseller?: boolean;
    bundleSavings: number | null;
    isBundle: boolean;
    stockQuantity: number;
    stockLabel: string;
    inStock: boolean;
  }>;
}

function ProductCard({
  title,
  category,
  categoryId,
  price,
  imageSrc,
  productId,
  unitPrice,
  variantLabel,
  whatsappNumber,
  bestseller,
  bundleSavings,
  isBundle,
  stockLabel,
  inStock,
  index = 0,
}: {
  title: string;
  category: string;
  categoryId: string;
  price: string;
  imageSrc: string;
  productId: string;
  unitPrice: number;
  variantLabel: string;
  whatsappNumber: string;
  bestseller?: boolean;
  bundleSavings: number | null;
  isBundle: boolean;
  stockLabel: string;
  inStock: boolean;
  index?: number;
}) {
  const th = useTranslations("home");
  const tp = useTranslations("products");
  const tc = useTranslations("common");
  const { addItem } = useCart();
  const [showGoToCart, setShowGoToCart] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!inStock) return;
    addItem({ productId, title, variantLabel, unitPrice, imageSrc });
    setShowGoToCart(true);
  };

  const handleWhatsAppOrder = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const message = th("productWhatsappMessage", { title, category, price });
    window.open(buildWhatsAppUrl(whatsappNumber, message), "_blank");
  };

  return (
    <motion.div
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group relative bg-novra-card/40 border border-white/8 rounded-2xl p-5 sm:p-6 hover:border-purple-500/40 hover:bg-novra-card/60 transition-all duration-500 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-[40px] rounded-full group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
      <div className="h-48 sm:h-56 rounded-xl mb-4 sm:mb-5 overflow-hidden relative border border-white/5 bg-gradient-to-br from-purple-500/5 to-transparent">
        <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-3">
          <div className="relative h-full w-full min-h-0">
            {isBundle ? (
              <BundleProductImages
                productId={productId}
                imageClassName="object-contain object-center group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : (
              <ProductImage
                src={imageSrc}
                category={categoryId}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-contain object-center group-hover:scale-105 transition-transform duration-500"
              />
            )}
          </div>
        </div>
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {bestseller && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-600/90 to-orange-500/85 border border-amber-500/40 text-white shadow-lg">
              {tp("bestseller")}
            </span>
          )}
          {isBundle && bundleSavings !== null && bundleSavings > 0 && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-600/85 border border-emerald-500/40 text-white shadow-lg">
              {th("saveAmount", { amount: bundleSavings.toFixed(0) })}
            </span>
          )}
        </div>
        <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full bg-purple-600/80 backdrop-blur-sm border border-purple-500/30">
          {variantLabel}
        </span>
      </div>
      <p className="text-purple-400 text-xs font-semibold uppercase tracking-widest mb-1">{category}</p>
      <h3 className="font-bold text-base sm:text-lg mb-2 group-hover:text-purple-300 transition-colors">{title}</h3>
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" aria-hidden />
        ))}
        <span className="text-xs text-gray-500 ml-1">(5.0)</span>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-white/8">
        <div>
          <p className="text-purple-400 font-bold text-lg sm:text-xl">{price}</p>
          <p className={`text-xs mt-1 ${inStock ? "text-emerald-400" : "text-red-400"}`}>{stockLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleQuickAdd}
            title={inStock ? th("quickAddTitle") : tc("outOfStock")}
            aria-label={inStock ? th("addToCartAria", { title }) : th("outOfStockAria", { title })}
            disabled={!inStock}
            className={`relative z-10 min-h-11 inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-full transition-colors duration-300 shadow-lg touch-manipulation text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
              inStock
                ? "bg-purple-600 hover:bg-purple-700 shadow-purple-900/30"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <ShoppingBag size={14} aria-hidden />
            {inStock ? th("quickAdd") : tc("outOfStock")}
          </button>
          {showGoToCart && (
            <Link
              href="/cos"
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 min-h-11 flex items-center justify-center px-3 bg-white/10 border border-white/20 text-white text-[10px] font-semibold uppercase tracking-wider rounded-full hover:bg-white/15 transition-colors touch-manipulation whitespace-nowrap"
            >
              {th("goToCart")}
            </Link>
          )}
          <button
            type="button"
            onClick={handleWhatsAppOrder}
            title={th("orderWhatsappTitle")}
            aria-label={th("orderWhatsappAria", { title })}
            className="relative z-10 min-w-11 min-h-11 flex items-center justify-center p-3 bg-[#25D366] rounded-full hover:bg-[#20bd5a] transition-colors duration-300 text-white shadow-lg shadow-green-500/20 touch-manipulation"
          >
            <FaWhatsapp size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

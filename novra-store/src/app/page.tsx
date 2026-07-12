"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import ProductImage from "@/components/produse/ProductImage";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, RefreshCcw, Gem, ShieldCheck, CheckCircle2, ShoppingBag, Package, ArrowRight, Mail, Sparkles, Gift, Star, Quote } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppCta from "@/components/WhatsAppCta";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getReviewAvatarUrl } from "@/lib/reviews";
import {
  CATALOG_CATEGORIES,
  buildProduseUrl,
  getProductsByCategory,
  getProductById,
  loadProductOverrides,
  getBundleSavings,
  isBundleProduct,
} from "@/lib/catalog";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useReviews } from "@/hooks/useReviews";
import { addNewsletterSubscriber } from "@/lib/newsletter";
import { buildWhatsAppUrl, createStoreRefreshEffect } from "@/lib/store";

const LiveVisitors = dynamic(() => import("@/components/LiveVisitors"), {
  ssr: false,
});

const WHATSAPP_MESSAGE = "Salut! Sunt interesat de produsele NOVRA.";

const FEATURED_PRODUCT_IDS = ["usb-c-100w", "usb-c-lightning-pd", "bundle-travel-pack"];

const HERO_CATEGORIES = [
  {
    id: "usb-c",
    label: "Cabluri",
    description: "Power Delivery până la 100W — viteză și durabilitate premium.",
    image: "/cablu.png",
  },
  {
    id: "lightning",
    label: "Adaptoare",
    description: "Compatibilitate iOS & Android — încărcare rapidă, design compact.",
    image: "/cablu.png",
  },
  {
    id: "accesorii",
    label: "Cablu + Adaptor",
    description: "Pachet complet — tot ce ai nevoie într-un singur kit NOVRA.",
    image: "/cutie.png",
  },
] as const;

function getCategoryMinPrice(categoryId: string): number {
  const products = getProductsByCategory(categoryId);
  if (!products.length) return 0;
  return Math.min(...products.map((p) => p.basePrice));
}

function HeroPriceRotator() {
  const [heroProducts, setHeroProducts] = useState(() =>
    HERO_CATEGORIES.map((cat) => ({
      ...cat,
      price: getCategoryMinPrice(cat.id).toFixed(2),
    }))
  );
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoRotate = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_CATEGORIES.length);
    }, 4000);
  }, []);

  useEffect(() => {
    return createStoreRefreshEffect(async () => {
      await loadProductOverrides();
      setHeroProducts(
        HERO_CATEGORIES.map((cat) => ({
          ...cat,
          price: getCategoryMinPrice(cat.id).toFixed(2),
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
              <span className="text-lg sm:text-xl font-medium text-gray-400">Lei</span>
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
            aria-label={`Afișează ${product.label}`}
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
  const { whatsappNumber } = useSiteSettings();
  const reviews = useReviews(3);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "sending" | "success" | "duplicate" | "error">("idle");
  const [newsletterDiscountMessage, setNewsletterDiscountMessage] = useState("");
  const [homepageProducts, setHomepageProducts] = useState(() => buildHomepageProducts());

  useEffect(() => {
    return createStoreRefreshEffect(async () => {
      await loadProductOverrides();
      setHomepageProducts(buildHomepageProducts());
    }, { scopes: ["products"] });
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

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

  const whatsappHref = buildWhatsAppUrl(whatsappNumber, WHATSAPP_MESSAGE);

  return (
    <>
      <Navbar />
      <LiveVisitors />

      <main className="w-full px-4 sm:px-6">

      {/* Hero */}
      <section id="acasa" className="flex flex-col lg:flex-row items-center justify-between py-10 sm:py-16 md:py-24 max-w-7xl mx-auto gap-10 lg:gap-16">
        <motion.div
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-xl"
        >
          <p className="text-purple-400 text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] mb-4">
            NOVRA Premium Accessories
          </p>
          <h1 className="text-3xl min-[375px]:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-5 sm:mb-6 leading-[1.05]">
            PRECISION.
            <br />
            PERFORMANCE.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
              POWER.
            </span>
          </h1>
          <p className="text-gray-300 text-base sm:text-lg mb-8 max-w-md leading-relaxed">
            Cabluri și adaptoare premium create pentru viteză, siguranță și performanță fără compromis.
          </p>

          <div className="mb-10 p-5 sm:p-6 rounded-2xl border border-novra-border bg-novra-card/30 backdrop-blur-sm">
            <HeroPriceRotator />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/produse"
              className="inline-flex items-center justify-center gap-2 bg-purple-600 px-6 sm:px-8 py-3.5 min-h-11 rounded-full font-semibold hover:bg-purple-700 transition duration-300 text-center text-sm sm:text-base shadow-lg shadow-purple-900/30 touch-manipulation"
            >
              Descoperă produsele
              <ArrowRight size={16} aria-hidden />
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] px-6 sm:px-8 py-3.5 rounded-full font-semibold transition duration-300 text-center text-sm sm:text-base shadow-lg shadow-green-500/20"
            >
              <FaWhatsapp size={18} aria-hidden />
              Comandă pe WhatsApp
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative w-full max-w-[500px] h-[240px] sm:h-[360px] md:h-[480px] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-purple-900/25 rounded-full blur-3xl" />
          <div className="relative z-10 w-full">
            <Image
              src="/cablu.png"
              alt="Cablu NOVRA Premium"
              width={500}
              height={500}
              priority
              className="w-full h-auto drop-shadow-2xl"
            />
          </div>
        </motion.div>
      </section>

      {/* Beneficii */}
      <motion.section
        initial={false}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-10 sm:py-16 border-y border-novra-border grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto"
      >
        <div className="flex flex-col items-center text-center gap-3">
          <Zap className="text-purple-500" size={32} />
          <div>
            <h3 className="font-semibold text-sm sm:text-lg">Încărcare rapidă</h3>
            <p className="text-xs sm:text-sm text-gray-300">până la 100W</p>
          </div>
        </div>
        <div className="flex flex-col items-center text-center gap-3">
          <RefreshCcw className="text-purple-500" size={32} />
          <div>
            <h3 className="font-semibold text-sm sm:text-lg">Transfer de date</h3>
            <p className="text-xs sm:text-sm text-gray-300">până la 480Mbps</p>
          </div>
        </div>
        <div className="flex flex-col items-center text-center gap-3">
          <Gem className="text-purple-500" size={32} />
          <div>
            <h3 className="font-semibold text-sm sm:text-lg">Materiale premium</h3>
            <p className="text-xs sm:text-sm text-gray-300">durabile și sigure</p>
          </div>
        </div>
        <div className="flex flex-col items-center text-center gap-3">
          <ShieldCheck className="text-purple-500" size={32} />
          <div>
            <h3 className="font-semibold text-sm sm:text-lg">Garanție</h3>
            <p className="text-xs sm:text-sm text-gray-300">2 ani</p>
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
        className="py-16 sm:py-20 max-w-7xl mx-auto relative"
      >
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-48 bg-purple-600/8 blur-[100px] rounded-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8 sm:mb-12 relative">
          <div>
            <span className="inline-flex items-center gap-2 text-purple-400 font-semibold text-xs sm:text-sm mb-3 uppercase tracking-[0.2em]">
              <Zap size={14} aria-hidden />
              Produse populare
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Alege performanța{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                NOVRA
              </span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-lg">
              Cabluri și adaptoare testate riguros — Power Delivery, materiale premium, garanție 2 ani.
            </p>
          </div>
          <Link
            href="/produse"
            className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition font-medium"
          >
            Vezi toate produsele
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
        className="py-8 sm:py-12 max-w-7xl mx-auto"
      >
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/80 via-novra-card/60 to-novra-surface p-6 sm:p-10 md:p-12">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/15 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                <Package size={14} aria-hidden />
                Pachet Ecosystem
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Cablu + Adaptor — totul într-un singur pachet
              </h2>
              <p className="text-gray-300 text-sm sm:text-base mb-6 max-w-xl mx-auto lg:mx-0">
                Combină un cablu premium NOVRA cu un adaptor de înaltă performanță. Economisești și obții compatibilitate
                completă pentru birou, acasă sau călătorii.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-purple-400">159,99 Lei</span>
                <span className="text-sm text-gray-500 line-through">179,98 Lei</span>
                <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                  Economisești ~20 Lei
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/produse?category=accesorii"
                  className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-full font-semibold transition text-sm sm:text-base"
                >
                  Vezi pachetele
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <Link
                  href="/accesorii"
                  className="inline-flex items-center justify-center gap-2 border border-novra-border hover:bg-novra-elevated px-6 py-3 rounded-full font-semibold transition text-sm sm:text-base"
                >
                  Explorează gama
                </Link>
              </div>
            </div>

            <div className="relative w-full max-w-[280px] sm:max-w-xs shrink-0">
              <div className="absolute inset-0 bg-purple-600/20 rounded-2xl blur-2xl" />
              <Image
                src="/cutie.png"
                alt="Pachet Cablu + Adaptor NOVRA"
                width={320}
                height={320}
                className="relative z-10 w-full h-auto rounded-2xl"
              />
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
        className="py-16 sm:py-24 border-t border-novra-border max-w-7xl mx-auto"
      >
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="order-2 lg:order-1">
            <span className="inline-flex items-center gap-2 text-purple-400 font-semibold tracking-[0.2em] uppercase text-xs sm:text-sm mb-4">
              <Sparkles size={14} aria-hidden />
              Despre NOVRA
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-[1.1]">
              Tehnologie care{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-600">
                conectează viitorul
              </span>
            </h2>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed font-light mb-6">
              NOVRA este mai mult decât un cablu. Este promisiunea performanței, a siguranței și a designului premium,
              creat pentru cei care cer mai mult de la tehnologie.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                { icon: Zap, text: "Power Delivery până la 100W" },
                { icon: Gem, text: "Materiale premium, finisaje impecabile" },
                { icon: ShieldCheck, text: "Garanție 2 ani la fiecare produs" },
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
                Descoperă povestea noastră
                <ArrowRight size={16} aria-hidden />
              </Link>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 border border-novra-border hover:bg-novra-elevated px-6 py-3 min-h-11 rounded-full font-semibold transition duration-300 text-sm sm:text-base touch-manipulation"
              >
                Rezumat rapid
              </button>
            </div>
          </div>
          <div className="order-1 lg:order-2 relative h-64 sm:h-80 lg:h-[420px] rounded-3xl overflow-hidden border border-novra-border group">
            <Image
              src="/technologie.png"
              alt="Despre NOVRA"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-novra-bg/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-novra-bg/70 backdrop-blur-md border border-novra-border/60">
              <p className="text-xs text-purple-300 font-semibold uppercase tracking-widest mb-1">Peste 10.000+ clienți</p>
              <p className="text-sm text-white font-medium">Brand românesc, standarde internaționale</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Recenzii */}
      <motion.section
        id="recenzii"
        initial={false}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-16 sm:py-24 bg-novra-bg-alt -mx-4 sm:-mx-6 px-4 sm:px-6 border-y border-novra-border/60"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-12">
            <div>
              <span className="inline-flex items-center gap-2 text-purple-400 font-semibold text-xs sm:text-sm mb-3 uppercase tracking-[0.2em]">
                <Star size={14} aria-hidden />
                Recenzii clienți
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                Peste{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                  10.000+
                </span>{" "}
                clienți mulțumiți
              </h2>
            </div>
            <Link
              href="/recenzii"
              className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition font-medium"
            >
              Vezi toate recenziile
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
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
                <div className="flex gap-0.5 mb-4" aria-label={`${review.rating} stele`}>
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
                      <CheckCircle2 size={14} className="text-purple-400 shrink-0" aria-label="Client verificat" />
                    </p>
                    <p className="text-xs text-gray-500">{review.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Newsletter Premium */}
      <motion.section
        id="newsletter"
        initial={false}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-16 sm:py-24 max-w-7xl mx-auto"
      >
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/25 bg-gradient-to-br from-purple-950/60 via-novra-card/50 to-novra-surface">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-600/15 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-fuchsia-500/10 blur-[70px] rounded-full pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,0.08),transparent_60%)] pointer-events-none" />

          <div className="relative z-10 grid lg:grid-cols-2 gap-8 lg:gap-12 p-6 sm:p-10 md:p-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-purple-500/15 text-purple-300 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5 border border-purple-500/20">
                <Sparkles size={13} aria-hidden />
                Newsletter NOVRA
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Fii primul care află{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">
                  noutățile
                </span>
              </h2>
              <p className="text-gray-300 text-sm sm:text-base mb-6 max-w-md leading-relaxed">
                Abonează-te și primești oferte exclusive, lansări speciale și acces prioritar la promoțiile NOVRA.
                Comunitatea noastră primește reduceri înaintea tuturor.
              </p>

              <ul className="space-y-2.5 mb-8">
                {[
                  "Reduceri exclusive pentru abonați",
                  "Acces prioritar la lansări noi",
                  "Sfaturi de la echipa NOVRA",
                ].map((perk) => (
                  <li key={perk} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <Gift size={15} className="text-purple-400 shrink-0" aria-hidden />
                    {perk}
                  </li>
                ))}
              </ul>

              <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5 p-1.5 rounded-2xl bg-novra-bg/50 border border-novra-border/80 backdrop-blur-sm">
                  <div className="relative flex-1 min-w-0">
                    <Mail
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400/70 pointer-events-none"
                      aria-hidden
                    />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="Adresa ta de email"
                      className="w-full bg-transparent border-0 pl-11 pr-4 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/40 text-white placeholder:text-novra-muted text-sm sm:text-base"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={newsletterStatus === "sending"}
                    className="inline-flex items-center justify-center gap-2 min-h-11 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 px-6 sm:px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 cursor-pointer whitespace-nowrap text-sm sm:text-base shadow-lg shadow-purple-900/30 touch-manipulation"
                  >
                    {newsletterStatus === "sending" ? "Se trimite..." : "Abonează-te"}
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
                      Abonat cu succes! Mulțumim că te-ai abonat la newsletter-ul NOVRA.
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
                    Ești deja abonat!
                  </motion.p>
                )}

                {newsletterStatus === "error" && (
                  <p className="text-red-400 font-medium text-sm">
                    Trimiterea a eșuat. Te rugăm să încerci din nou.
                  </p>
                )}
              </form>

              <p className="text-xs text-novra-muted mt-4">Fără spam. Dezabonare oricând.</p>
            </div>

            <div className="relative h-56 sm:h-72 lg:h-80 rounded-2xl overflow-hidden border border-purple-500/15">
              <Image
                src="/cutie.png"
                alt="Newsletter NOVRA"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-novra-bg/70 backdrop-blur-md border border-novra-border/60">
                <p className="text-xs text-purple-300 font-semibold uppercase tracking-widest mb-1">Ofertă de bun venit</p>
                <p className="text-sm text-white font-medium">Primești 10% reducere la prima comandă</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <WhatsAppCta />
      </main>

      <footer id="contact">
        <Footer />
      </footer>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-novra-bg/85 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="rezumat-rapid-title"
              className="bg-novra-surface border border-novra-border p-5 sm:p-8 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90dvh] sm:max-h-[85dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="rezumat-rapid-title" className="text-2xl font-bold mb-2">
                Rezumat rapid NOVRA
              </h2>
              <p className="text-gray-300 mb-6 text-sm sm:text-base">
                Accesează rapid categoriile noastre sau explorează întregul catalog de cabluri și adaptoare premium.
              </p>

              <div className="space-y-2.5 mb-6">
                {CATALOG_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href={buildProduseUrl({ category: cat.id })}
                    onClick={() => setIsModalOpen(false)}
                    className="flex items-center justify-between gap-3 min-h-11 px-4 py-3 rounded-xl border border-novra-border bg-novra-card/40 hover:border-purple-500/40 hover:bg-novra-card/70 transition-colors touch-manipulation"
                  >
                    <span className="font-medium text-sm sm:text-base">{cat.label}</span>
                    <ArrowRight size={16} className="text-purple-400 shrink-0" aria-hidden />
                  </Link>
                ))}
                <Link
                  href="/produse"
                  onClick={() => setIsModalOpen(false)}
                  className="flex items-center justify-between gap-3 min-h-11 px-4 py-3 rounded-xl border border-purple-500/30 bg-purple-600/15 hover:bg-purple-600/25 transition-colors touch-manipulation"
                >
                  <span className="font-semibold text-sm sm:text-base">Toate produsele</span>
                  <ArrowRight size={16} className="text-purple-300 shrink-0" aria-hidden />
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full min-h-11 bg-purple-600 py-3 rounded-lg font-semibold hover:bg-purple-700 touch-manipulation"
              >
                Închide
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function buildHomepageProducts() {
  return FEATURED_PRODUCT_IDS.map((id) => {
    const product = getProductById(id);
    if (!product) return null;
    const categoryLabel =
      CATALOG_CATEGORIES.find((c) => c.id === product.category)?.label ?? product.category;
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
  index?: number;
}) {
  const { addItem } = useCart();
  const [showGoToCart, setShowGoToCart] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    addItem({ productId, title, variantLabel, unitPrice, imageSrc });
    setShowGoToCart(true);
  };

  const handleWhatsAppOrder = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const message = `Salut, aș dori să comand produsul: ${title} (${category}) — Preț: ${price}.`;
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
      <div className="h-48 sm:h-56 rounded-xl mb-4 sm:mb-5 flex items-center justify-center overflow-hidden relative border border-white/5 bg-gradient-to-br from-purple-500/5 to-transparent">
        <ProductImage
          src={imageSrc}
          category={categoryId}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {bestseller && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-600/90 to-orange-500/85 border border-amber-500/40 text-white shadow-lg">
              Bestseller
            </span>
          )}
          {isBundle && bundleSavings !== null && bundleSavings > 0 && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-600/85 border border-emerald-500/40 text-white shadow-lg">
              Economisești {bundleSavings.toFixed(0)} lei
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
        <p className="text-purple-400 font-bold text-lg sm:text-xl">{price}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleQuickAdd}
            title="Adaugă rapid în coș"
            aria-label={`Adaugă rapid ${title} în coș`}
            className="relative z-10 min-h-11 inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-purple-600 rounded-full hover:bg-purple-700 transition-colors duration-300 shadow-lg shadow-purple-900/30 touch-manipulation text-[10px] sm:text-xs font-semibold whitespace-nowrap"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <ShoppingBag size={14} aria-hidden />
            Adaugă rapid
          </button>
          {showGoToCart && (
            <Link
              href="/cos"
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 min-h-11 flex items-center justify-center px-3 bg-white/10 border border-white/20 text-white text-[10px] font-semibold uppercase tracking-wider rounded-full hover:bg-white/15 transition-colors touch-manipulation whitespace-nowrap"
            >
              Mergi la coș
            </Link>
          )}
          <button
            type="button"
            onClick={handleWhatsAppOrder}
            title="Comandă pe WhatsApp"
            aria-label={`Comandă ${title} pe WhatsApp`}
            className="relative z-10 min-w-11 min-h-11 flex items-center justify-center p-3 bg-[#25D366] rounded-full hover:bg-[#20bd5a] transition-colors duration-300 text-white shadow-lg shadow-green-500/20 touch-manipulation"
          >
            <FaWhatsapp size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

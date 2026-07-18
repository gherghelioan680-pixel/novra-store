"use client";

import { useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Truck, CreditCard, Shield, Clock, Banknote, Package, MapPin, CheckCircle2, Sparkles } from "lucide-react";
import { fadeUp } from "@/lib/motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function LivrareSiPlata() {
  const t = useTranslations("shipping");
  const { deliveryCost, freeShippingThreshold } = useSiteSettings();

  const highlights = useMemo(
    () => [
      { icon: Clock, label: t("highlight1Label"), sub: t("highlight1Sub") },
      { icon: MapPin, label: t("highlight2Label"), sub: t("highlight2Sub") },
      { icon: Shield, label: t("highlight3Label"), sub: t("highlight3Sub") },
      { icon: CreditCard, label: t("highlight4Label"), sub: t("highlight4Sub") },
    ],
    [t]
  );

  const deliverySteps = useMemo(
    () => [
      { step: "01", title: t("step1Title"), description: t("step1Desc") },
      { step: "02", title: t("step2Title"), description: t("step2Desc") },
      { step: "03", title: t("step3Title"), description: t("step3Desc") },
      { step: "04", title: t("step4Title"), description: t("step4Desc") },
    ],
    [t]
  );

  const paymentMethods = useMemo(
    () => [
      {
        icon: CreditCard,
        title: t("cardTitle"),
        badge: t("cardBadge"),
        description: t("cardDesc"),
        features: [t("cardF1"), t("cardF2"), t("cardF3")],
      },
      {
        icon: Banknote,
        title: t("codTitle"),
        badge: t("codBadge"),
        description: t("codDesc"),
        features: [t("codF1"), t("codF2"), t("codF3")],
      },
    ],
    [t]
  );

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="site-container-md pb-page">
        <section className="relative overflow-hidden pt-8 sm:pt-12 pb-12 sm:pb-16 mb-4">
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
          {highlights.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl border border-white/8 bg-novra-card/30 hover:border-purple-500/25 transition-colors"
            >
              <item.icon size={22} className="text-purple-500 mb-2" />
              <span className="text-sm sm:text-base font-semibold text-white">{item.label}</span>
              <span className="text-xs text-gray-500 mt-0.5">{item.sub}</span>
            </div>
          ))}
        </motion.div>

        <section className="mb-16 sm:mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Truck size={22} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white tracking-tight">{t("deliveryTitle")}</h3>
              <p className="text-gray-500 text-sm">{t("deliverySubtitle")}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-8">
            <div className="group p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40 hover:border-purple-500/25 transition-all">
              <Package size={24} className="text-purple-400 mb-4" />
              <h4 className="text-white font-bold text-lg mb-2">{t("expressTitle")}</h4>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">{t("expressDesc")}</p>
            </div>
            <div className="group p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40 hover:border-purple-500/25 transition-all">
              <Shield size={24} className="text-purple-400 mb-4" />
              <h4 className="text-white font-bold text-lg mb-2">{t("packagingTitle")}</h4>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">{t("packagingDesc")}</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-purple-500/8 to-transparent backdrop-blur-sm p-6 sm:p-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />
            <h4 className="text-lg font-bold text-white mb-8 tracking-tight">{t("flowTitle")}</h4>
            <ol className="grid sm:grid-cols-2 gap-6">
              {deliverySteps.map((item) => (
                <li key={item.step} className="flex gap-4 items-start">
                  <span className="text-purple-500 font-bold text-sm tracking-tight pt-0.5 shrink-0">{item.step}.</span>
                  <div>
                    <h5 className="font-semibold text-white mb-1">{item.title}</h5>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mb-16 sm:mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Clock size={22} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white tracking-tight">{t("timeTitle")}</h3>
              <p className="text-gray-500 text-sm">{t("timeSubtitle")}</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-transparent relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 blur-[40px] rounded-full pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
              <div className="shrink-0">
                <div className="text-4xl sm:text-5xl font-bold text-white tracking-tight">{t("timeValue")}</div>
                <p className="text-purple-400 font-medium text-sm mt-1">{t("timeValueSub")}</p>
              </div>
              <div className="space-y-3 text-gray-300 text-sm sm:text-base font-light leading-relaxed">
                <p>{t("timeP1")}</p>
                <p>{t("timeP2")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16 sm:mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Truck size={22} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white tracking-tight">{t("costsTitle")}</h3>
              <p className="text-gray-500 text-sm">{t("costsSubtitle")}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl border border-white/8 bg-novra-card/40">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-white">{deliveryCost.toFixed(2)} RON</span>
                <span className="text-gray-500 text-sm">{t("standardLabel")}</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{t("standardDesc")}</p>
            </div>
            <div className="p-6 rounded-2xl border border-purple-500/25 bg-purple-500/5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={18} className="text-purple-400" />
                <span className="text-lg font-bold text-white">{t("freeShipping")}</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t("freeShippingDesc", { threshold: freeShippingThreshold })}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <CreditCard size={22} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white tracking-tight">{t("paymentTitle")}</h3>
              <p className="text-gray-500 text-sm">{t("paymentSubtitle")}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-8">
            {paymentMethods.map((method) => (
              <div
                key={method.title}
                className="relative p-6 sm:p-8 rounded-3xl border border-white/8 bg-novra-card/40 hover:border-purple-500/30 transition-all overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-[40px] rounded-full group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
                <div className="flex items-start justify-between gap-3 mb-4">
                  <method.icon size={28} className="text-purple-400 shrink-0" />
                  <span className="text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    {method.badge}
                  </span>
                </div>
                <h4 className="text-white font-bold text-lg mb-2">{method.title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">{method.description}</p>
                <ul className="space-y-2">
                  {method.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {["Visa", "Mastercard", "Maestro", "Apple Pay"].map((brand) => (
              <span
                key={brand}
                className="px-4 py-2 rounded-xl border border-white/10 bg-novra-card/30 text-xs font-semibold uppercase tracking-wider text-gray-400"
              >
                {brand}
              </span>
            ))}
          </div>

          <div className="p-6 sm:p-8 relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/8 to-transparent backdrop-blur-sm">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full pointer-events-none" />
            <div className="flex gap-4 items-start">
              <Shield size={28} className="text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-lg text-white mb-2">{t("secureTitle")}</h4>
                <p className="text-gray-400 leading-relaxed text-sm sm:text-base">{t("secureDesc")}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="text-center pt-4">
          <p className="text-gray-500 text-sm mb-6">
            {t("footerText")}{" "}
            <Link href="/faq" className="text-purple-400 hover:underline">
              {t("footerFaq")}
            </Link>{" "}
            {t("footerOr")}{" "}
            <Link href="/contact" className="text-purple-400 hover:underline">
              {t("footerContact")}
            </Link>
            .
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

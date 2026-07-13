"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Banknote,
  Cookie,
  Link2,
  Shield,
  UserPlus,
  Wallet,
} from "lucide-react";
import {
  AFFILIATE_ATTRIBUTION_DAYS,
  DEFAULT_AFFILIATE_COMMISSION_RATE,
  MIN_AFFILIATE_PAYOUT_AMOUNT,
} from "@/lib/affiliates-types";

export default function AffiliateProgramSection() {
  const t = useTranslations("affiliate");

  const steps = [
    { num: "01", title: t("step1Title"), desc: t("step1Desc") },
    { num: "02", title: t("step2Title"), desc: t("step2Desc") },
    { num: "03", title: t("step3Title"), desc: t("step3Desc") },
    { num: "04", title: t("step4Title"), desc: t("step4Desc") },
  ];

  const highlights = [
    {
      icon: Wallet,
      title: t("highlightCommissionTitle", { rate: DEFAULT_AFFILIATE_COMMISSION_RATE }),
      desc: t("highlightCommissionDesc"),
    },
    {
      icon: Cookie,
      title: t("highlightTrackingTitle", { days: AFFILIATE_ATTRIBUTION_DAYS }),
      desc: t("highlightTrackingDesc"),
    },
    {
      icon: Banknote,
      title: t("highlightMinTitle", { amount: MIN_AFFILIATE_PAYOUT_AMOUNT }),
      desc: t("highlightMinDesc"),
    },
  ];

  return (
    <motion.section
      id="program-afiliere"
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="py-16 sm:py-24 -mx-4 sm:-mx-6 px-4 sm:px-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/50 via-novra-card/40 to-novra-bg-alt">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-fuchsia-500/8 blur-[60px] rounded-full pointer-events-none" />

          <div className="relative z-10 p-6 sm:p-10 md:p-12">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 mb-10">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 text-purple-400 font-semibold text-xs sm:text-sm mb-3 uppercase tracking-[0.2em]">
                  <Link2 size={14} aria-hidden />
                  {t("badge")}
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  {t("titleEarn")}{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                    {t("titleCommission", { rate: DEFAULT_AFFILIATE_COMMISSION_RATE })}
                  </span>{" "}
                  {t("titlePromote")}
                </h2>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                  {t("intro", { amount: MIN_AFFILIATE_PAYOUT_AMOUNT })}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Link
                  href="/contul-meu"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
                >
                  <UserPlus size={16} aria-hidden />
                  {t("applyNow")}
                  <ArrowRight size={14} aria-hidden />
                </Link>
                <Link
                  href="/termeni-program-afiliere"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-gray-300 transition hover:border-purple-500/30 hover:text-white"
                >
                  {t("programTerms")}
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-10">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/8 bg-black/20 p-5 sm:p-6"
                  >
                    <Icon size={20} className="text-purple-400 mb-3" aria-hidden />
                    <h3 className="font-semibold text-white text-sm sm:text-base mb-1.5">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">{t("howItWorks")}</h3>
                <ol className="space-y-4">
                  {steps.map((step) => (
                    <li key={step.num} className="flex gap-4">
                      <span className="shrink-0 w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/25 flex items-center justify-center text-xs font-bold text-purple-300">
                        {step.num}
                      </span>
                      <div>
                        <p className="font-medium text-white text-sm">{step.title}</p>
                        <p className="text-xs sm:text-sm text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
                  <h3 className="text-lg font-semibold text-white mb-3">{t("payoutTitle")}</h3>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
                      {t("payout1")}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
                      {t("payout2", { amount: MIN_AFFILIATE_PAYOUT_AMOUNT })}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
                      {t("payout3")}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
                      {t("payout4")}
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-purple-500/15 bg-purple-500/5 p-5">
                  <div className="flex items-start gap-3">
                    <Shield size={18} className="text-purple-400 shrink-0 mt-0.5" aria-hidden />
                    <div>
                      <h3 className="font-semibold text-white text-sm mb-2">{t("gdprTitle")}</h3>
                      <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                        {t.rich("gdprText", {
                          privacyLink: (chunks) => (
                            <Link href="/politica-confidentialitate" className="text-purple-400 hover:underline">
                              {chunks}
                            </Link>
                          ),
                          termsLink: (chunks) => (
                            <Link href="/termeni-program-afiliere" className="text-purple-400 hover:underline">
                              {chunks}
                            </Link>
                          ),
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500">
              {t("readyToStart")}{" "}
              <Link href="/contul-meu" className="text-purple-400 hover:text-purple-300 font-medium">
                {t("accountLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

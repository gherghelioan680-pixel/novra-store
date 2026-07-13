"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ChevronDown,
  Search,
  HelpCircle,
  Sparkles,
  MessageCircle,
  ArrowRight,
  Package,
  CreditCard,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { fadeUp } from "@/lib/motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildWhatsAppUrl } from "@/lib/store";
import { FAQ_LINKS, renderRichText } from "@/lib/render-rich-text";

type FaqItem = { q: string; a: string };

export default function FaqPage() {
  const t = useTranslations("faq");
  const { whatsappNumber } = useSiteSettings();
  const faqs = useMemo(() => t.raw("items") as FaqItem[], [t]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const faqCategories = [
    { icon: Package, label: t("catOrders") },
    { icon: CreditCard, label: t("catPayment") },
    { icon: Truck, label: t("catDelivery") },
    { icon: ShieldCheck, label: t("catWarranty") },
  ];

  const whatsappLink = { tag: "whatsappLink", href: buildWhatsAppUrl(whatsappNumber), external: true };
  const richLinks = [...FAQ_LINKS, whatsappLink];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const q = searchQuery.toLowerCase();
    return faqs.filter((faq) => faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q));
  }, [searchQuery, faqs]);

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="px-4 sm:px-6 md:px-12 max-w-4xl mx-auto pb-page">
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

        <motion.div {...fadeUp} className="flex flex-wrap gap-2 mb-8">
          {faqCategories.map((cat) => (
            <span
              key={cat.label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/8 bg-novra-card/40 text-xs text-gray-400"
            >
              <cat.icon size={12} className="text-purple-500" aria-hidden />
              {cat.label}
            </span>
          ))}
        </motion.div>

        <motion.div {...fadeUp} className="relative mb-10">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400/70 pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-novra-card/40 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white placeholder:text-novra-muted focus:outline-none focus:border-purple-500/50 transition-colors font-light"
          />
        </motion.div>

        <motion.section {...fadeUp}>
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <HelpCircle size={32} className="mx-auto mb-3 text-purple-500/50" aria-hidden />
                <p>{t("noResults")}</p>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={faq.q}
                    className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isOpen
                        ? "border-purple-500/30 bg-novra-card/50"
                        : "border-white/8 bg-novra-card/30 hover:border-purple-500/20"
                    }`}
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full p-5 sm:p-6 flex justify-between items-center text-left group transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="flex items-start gap-3 pr-4">
                        <HelpCircle
                          size={18}
                          className={`shrink-0 mt-0.5 ${isOpen ? "text-purple-400" : "text-purple-500/50"}`}
                          aria-hidden
                        />
                        <span
                          className={`font-medium text-base sm:text-lg tracking-tight transition-colors ${
                            isOpen ? "text-purple-300" : "text-white group-hover:text-purple-300"
                          }`}
                        >
                          {faq.q}
                        </span>
                      </span>
                      <ChevronDown
                        size={20}
                        className={`shrink-0 text-gray-500 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-purple-400" : "group-hover:text-purple-400"
                        }`}
                        aria-hidden
                      />
                    </button>

                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pl-11 sm:pl-14">
                          <p className="text-gray-400 text-sm sm:text-base font-light leading-relaxed">
                            {renderRichText(faq.a, richLinks)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.section>

        <motion.div
          {...fadeUp}
          className="mt-12 sm:mt-16 text-center p-8 sm:p-10 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/8 to-transparent"
        >
          <MessageCircle size={28} className="text-purple-400 mx-auto mb-4" aria-hidden />
          <h3 className="text-xl font-bold mb-2">{t("ctaTitle")}</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">{t("ctaDesc")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-full font-semibold transition text-sm"
            >
              {t("contactUs")}
              <ArrowRight size={14} aria-hidden />
            </Link>
            <Link
              href="/garantie-si-retur"
              className="inline-flex items-center justify-center gap-2 border border-novra-border hover:bg-novra-elevated px-6 py-3 rounded-full font-semibold transition text-sm"
            >
              {t("warrantyLink")}
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

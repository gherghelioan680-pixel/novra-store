"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Timer, Zap } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type PromoItem = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  discount: string;
  oldPrice: string;
  newPrice: string;
  description: string;
  gradient: string;
};

export default function Promotii() {
  const t = useTranslations("promotions");
  const [activeFilter, setActiveFilter] = useState("toate");

  const promotions = useMemo(() => {
    const items = t.raw("items") as Omit<PromoItem, "gradient">[];
    const gradients = ["from-purple-600/20 to-blue-600/20", "from-amber-500/20 to-orange-600/20"];
    return items.map((item, i) => ({ ...item, gradient: gradients[i % gradients.length] }));
  }, [t]);

  const filters = useMemo(
    () => [
      { id: "toate", label: t("filterAll") },
      { id: "kituri", label: t("filterKits") },
      { id: "cabluri", label: t("filterCables") },
    ],
    [t]
  );

  const filteredPromotions =
    activeFilter === "toate" ? promotions : promotions.filter((promo) => promo.category === activeFilter);

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="pb-page site-container">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-purple-400 uppercase tracking-widest mb-8 transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          {t("backHome")}
        </Link>

        <div className="relative border-b border-white/10 pb-12 mb-12">
          <div className="max-w-2xl">
            <span className="text-purple-500 text-xs font-semibold tracking-[0.3em] uppercase block mb-3">
              {t("badge")}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tighter mb-4">{t("title")}</h1>
            <p className="text-gray-400 text-base font-light leading-relaxed">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12 bg-novra-card/30 border border-white/8 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium uppercase tracking-wider px-2">
            <Sparkles size={14} className="text-purple-500" />
            <span>{t("filterBy")}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-300 cursor-pointer ${
                  activeFilter === filter.id
                    ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20"
                    : "bg-transparent text-gray-400 border-white/8 hover:border-white/20 hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredPromotions.map((promo) => (
              <motion.div
                layout
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35 }}
                key={promo.id}
                whileHover={{ y: -6, scale: 1.01 }}
                className={`group bg-gradient-to-br ${promo.gradient} border border-white/10 rounded-3xl p-8 relative overflow-hidden`}
              >
                <div className="absolute top-4 right-4 bg-novra-bg/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <Timer size={14} />
                  {promo.discount}
                </div>

                <div className="h-36 rounded-2xl border border-white/10 bg-novra-card/40 mb-6 flex items-center justify-center">
                  <Zap className="text-purple-400" size={32} />
                </div>

                <h3 className="text-2xl font-bold mb-1">{promo.title}</h3>
                <p className="text-white/60 text-sm mb-4">{promo.subtitle}</p>
                <p className="text-gray-300 text-sm mb-8 max-w-sm">{promo.description}</p>

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-gray-500 block font-medium">
                      {t("promoPrice")}
                    </span>
                    <span className="text-2xl font-bold">{promo.newPrice}</span>
                  </div>
                  <span className="text-sm text-gray-500 line-through mb-1">{promo.oldPrice}</span>
                </div>

                <button className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white text-black px-6 py-3 rounded-xl hover:bg-purple-500 hover:text-white transition-colors">
                  {t("viewOffer")} <ArrowRight size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

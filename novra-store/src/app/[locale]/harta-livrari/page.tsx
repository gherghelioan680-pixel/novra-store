"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { MapPin, Sparkles, Package } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RomaniaDeliveryMap from "@/components/delivery/RomaniaDeliveryMap";
import { fadeUp } from "@/lib/motion";
import type { DeliveryMapPublicPayload } from "@/lib/delivery-map";

export default function HartaLivrariPage() {
  const t = useTranslations("deliveryMap");
  const [data, setData] = useState<DeliveryMapPublicPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/store/delivery-map")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: DeliveryMapPublicPayload | null) => {
        if (!cancelled) {
          setData(payload);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const topCounties = useMemo(() => {
    if (!data?.counties) return [];
    return [...data.counties]
      .filter((county) => county.orderCount > 0)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 8);
  }, [data]);

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="pb-page site-container-md">
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
            <p className="text-gray-400 text-base sm:text-lg font-light max-w-2xl leading-relaxed">
              {t("subtitle")}
            </p>
          </motion.div>
        </section>

        {loading ? (
          <p className="text-gray-500 text-sm">{t("loading")}</p>
        ) : !data?.enabled ? (
          <motion.div
            {...fadeUp}
            className="rounded-3xl border border-white/10 bg-novra-card/40 p-8 text-center text-gray-400"
          >
            {t("hidden")}
          </motion.div>
        ) : (
          <>
            <motion.div {...fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
              <div className="flex items-center gap-3 p-4 sm:p-5 rounded-2xl border border-white/8 bg-novra-card/40">
                <span className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Package size={18} className="text-purple-400" aria-hidden />
                </span>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">{t("totalOrders")}</p>
                  <p className="text-sm font-semibold text-white">{data.totalOrders}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 sm:p-5 rounded-2xl border border-white/8 bg-novra-card/40">
                <span className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-purple-400" aria-hidden />
                </span>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">{t("activeCounties")}</p>
                  <p className="text-sm font-semibold text-white">
                    {data.counties.filter((county) => county.orderCount > 0).length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 sm:p-5 rounded-2xl border border-white/8 bg-novra-card/40 sm:col-span-1">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">{t("updatedAt")}</p>
                  <p className="text-sm font-semibold text-white">
                    {new Date(data.updatedAt).toLocaleDateString(undefined, {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div {...fadeUp}>
              <RomaniaDeliveryMap
                counties={data.counties}
                labels={{ orders: t("orders"), noData: t("noData") }}
              />
            </motion.div>

            {topCounties.length > 0 ? (
              <motion.section {...fadeUp} className="mt-10">
                <h2 className="text-xl font-bold text-white mb-4">{t("topCounties")}</h2>
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white/5 text-left text-gray-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">{t("county")}</th>
                        <th className="px-4 py-3 font-medium">{t("orders")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCounties.map((county) => (
                        <tr key={county.countyCode} className="border-t border-white/5">
                          <td className="px-4 py-3 text-white">{county.countyName}</td>
                          <td className="px-4 py-3 text-purple-300 font-semibold">{county.orderCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.section>
            ) : null}

            <p className="mt-8 text-xs text-gray-500">{t("privacyNote")}</p>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

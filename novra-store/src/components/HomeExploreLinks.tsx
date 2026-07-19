"use client";

import { motion } from "framer-motion";
import { ArrowRight, MapPin, Megaphone, ShieldCheck, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const LINKS = [
  { href: "/promotii", icon: Megaphone, titleKey: "explorePromotionsTitle", descKey: "explorePromotionsDesc" },
  { href: "/recenzii", icon: Star, titleKey: "exploreReviewsTitle", descKey: "exploreReviewsDesc" },
  { href: "/harta-livrari", icon: MapPin, titleKey: "exploreDeliveryTitle", descKey: "exploreDeliveryDesc" },
  {
    href: "/verificare-autenticitate",
    icon: ShieldCheck,
    titleKey: "exploreAuthenticityTitle",
    descKey: "exploreAuthenticityDesc",
  },
] as const;

export default function HomeExploreLinks() {
  const t = useTranslations("home");

  return (
    <motion.section
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="py-12 sm:py-16 site-container"
    >
      <div className="mb-8 sm:mb-10">
        <span className="inline-flex items-center gap-2 text-purple-400 font-semibold text-xs sm:text-sm mb-3 uppercase tracking-[0.2em]">
          {t("exploreBadge")}
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("exploreTitle")}</h2>
        <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-xl">{t("exploreSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {LINKS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              viewport={{ once: true }}
            >
              <Link
                href={item.href}
                className="group flex h-full flex-col rounded-2xl border border-white/8 bg-novra-card/40 p-5 sm:p-6 hover:border-purple-500/35 hover:bg-novra-card/60 transition-all duration-300"
              >
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-600/10">
                  <Icon size={18} className="text-purple-400" aria-hidden />
                </span>
                <h3 className="font-semibold text-white text-sm sm:text-base mb-1.5 group-hover:text-purple-200 transition-colors">
                  {t(item.titleKey)}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed flex-1">{t(item.descKey)}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
                  {t("seeMore")}
                  <ArrowRight size={14} className="transition group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

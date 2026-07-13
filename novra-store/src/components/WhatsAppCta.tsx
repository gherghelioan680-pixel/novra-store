"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";
import { Mail, MessageCircle, HelpCircle, Clock, ArrowRight } from "lucide-react";
import { fadeUp } from "@/lib/motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildWhatsAppUrl } from "@/lib/store";

export default function WhatsAppCta() {
  const t = useTranslations("whatsapp");
  const { whatsappNumber } = useSiteSettings();

  const supportChannels = [
    {
      icon: FaWhatsapp,
      label: t("label"),
      title: t("rapidResponse"),
      description: t("rapidResponseDesc"),
      href: buildWhatsAppUrl(whatsappNumber, t("ctaMessage")),
      external: true,
      accent: "from-green-500/10 to-transparent border-green-500/20 hover:border-green-500/40",
      iconClass: "text-[#25D366]",
      cta: t("writeNow"),
    },
    {
      icon: Mail,
      label: t("email"),
      title: t("officialSupport"),
      description: t("officialSupportDesc"),
      href: "mailto:support@novra.ro",
      external: false,
      accent: "from-purple-500/10 to-transparent border-white/8 hover:border-purple-500/30",
      iconClass: "text-purple-400",
      cta: t("sendEmail"),
    },
    {
      icon: HelpCircle,
      label: t("faq"),
      title: t("faqTitle"),
      description: t("faqDesc"),
      href: "/faq",
      external: false,
      accent: "from-purple-500/10 to-transparent border-white/8 hover:border-purple-500/30",
      iconClass: "text-purple-400",
      cta: t("viewFaq"),
    },
  ];

  return (
    <section className="py-14 sm:py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-10 sm:mb-12">
          <span className="inline-flex items-center gap-2 text-purple-400 font-semibold tracking-[0.2em] uppercase text-xs sm:text-sm mb-4">
            <MessageCircle size={14} aria-hidden />
            {t("quickSupport")}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
            {t("hereForYou")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
              {t("forYou")}
            </span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto flex items-center justify-center gap-2">
            <Clock size={15} className="text-purple-500 shrink-0" aria-hidden />
            {t("hours")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {supportChannels.map((channel, i) => {
            const Icon = channel.icon;
            const content = (
              <>
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-[40px] rounded-full pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
                <div className={`w-12 h-12 rounded-xl bg-novra-card/60 border border-white/8 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={22} className={channel.iconClass} aria-hidden />
                </div>
                <p className="text-purple-400 text-xs font-semibold uppercase tracking-widest mb-1">{channel.label}</p>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{channel.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-5 flex-1">{channel.description}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-400 group-hover:gap-2.5 transition-all">
                  {channel.cta}
                  <ArrowRight size={14} aria-hidden />
                </span>
              </>
            );

            const className = `group relative flex flex-col p-6 sm:p-7 rounded-2xl border bg-gradient-to-br ${channel.accent} bg-novra-card/30 transition-all duration-300 overflow-hidden h-full`;

            return (
              <motion.div
                key={channel.label}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                {channel.external ? (
                  <a href={channel.href} target="_blank" rel="noopener noreferrer" className={className}>
                    {content}
                  </a>
                ) : (
                  <Link href={channel.href} className={className}>
                    {content}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

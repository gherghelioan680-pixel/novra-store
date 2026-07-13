"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Mail,
  Phone,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { fadeUp } from "@/lib/motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildWhatsAppUrl, formatWhatsAppDisplay } from "@/lib/store";

export default function Contact() {
  const t = useTranslations("contact");
  const { whatsappNumber } = useSiteSettings();
  const phoneDisplay = formatWhatsAppDisplay(whatsappNumber);

  const contactChannels = useMemo(
    () => [
      {
        icon: FaWhatsapp,
        label: t("whatsappLabel"),
        title: "WhatsApp",
        value: phoneDisplay,
        description: t("whatsappDesc"),
        href: buildWhatsAppUrl(whatsappNumber, t("whatsappMessage")),
        external: true,
        accent: "hover:border-green-500/40",
        iconBg: "bg-green-500/10 border-green-500/20",
        iconClass: "text-[#25D366]",
      },
      {
        icon: Mail,
        label: t("emailLabel"),
        title: t("emailLabel"),
        value: "support@novra.ro",
        description: t("emailDesc"),
        href: "mailto:support@novra.ro",
        external: false,
        accent: "hover:border-purple-500/30",
        iconBg: "bg-purple-500/10 border-purple-500/20",
        iconClass: "text-purple-400",
      },
    ],
    [t, whatsappNumber, phoneDisplay]
  );

  const infoCards = useMemo(
    () => [
      { icon: Clock, title: t("program"), value: t("programValue") },
      { icon: Phone, title: t("phone"), value: phoneDisplay },
      { icon: MapPin, title: t("delivery"), value: t("deliveryValue") },
    ],
    [t, phoneDisplay]
  );

  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: "b7020925-857c-4f6e-97eb-23f4c1139e97",
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          from_name: "NOVRA Contact Form",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="px-4 sm:px-6 md:px-12 max-w-5xl mx-auto pb-page">
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

        <motion.div {...fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-10">
          {infoCards.map((card) => (
            <div
              key={card.title}
              className="flex items-center gap-3 p-4 sm:p-5 rounded-2xl border border-white/8 bg-novra-card/40"
            >
              <span className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <card.icon size={18} className="text-purple-400" aria-hidden />
              </span>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest">{card.title}</p>
                <p className="text-sm font-semibold text-white">{card.value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div {...fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {contactChannels.map((channel) => {
            const Icon = channel.icon;
            const content = (
              <>
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-[30px] rounded-full group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
                <div className={`w-12 h-12 rounded-xl ${channel.iconBg} border flex items-center justify-center mb-5`}>
                  <Icon size={22} className={channel.iconClass} aria-hidden />
                </div>
                <p className="text-purple-400 font-medium text-xs uppercase tracking-wider mb-1">{channel.label}</p>
                <div className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2 group-hover:text-purple-300 transition-colors">
                  {channel.title}
                </div>
                <p className="text-purple-400/80 text-sm font-medium mb-2">{channel.value}</p>
                <p className="text-gray-400 text-sm font-light leading-relaxed">{channel.description}</p>
              </>
            );

            const className = `group p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40 ${channel.accent} transition-all duration-300 relative overflow-hidden block h-full`;

            return channel.external ? (
              <a key={channel.title} href={channel.href} target="_blank" rel="noopener noreferrer" className={className}>
                {content}
              </a>
            ) : (
              <a key={channel.title} href={channel.href} className={className}>
                {content}
              </a>
            );
          })}
        </motion.div>

        <motion.section
          {...fadeUp}
          className="p-8 sm:p-10 relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-purple-500/8 to-transparent"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none" />

          <div className="flex items-center gap-3 mb-8 relative z-10">
            <MessageCircle size={24} className="text-purple-400" aria-hidden />
            <h2 className="text-2xl font-bold tracking-tight text-white">{t("formTitle")}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-gray-400 font-medium">{t("nameLabel")}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("namePlaceholder")}
                  className="w-full bg-novra-card/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-novra-muted focus:outline-none focus:border-purple-500/50 transition-colors font-light"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-gray-400 font-medium">{t("emailFieldLabel")}</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t("emailPlaceholder")}
                  className="w-full bg-novra-card/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-novra-muted focus:outline-none focus:border-purple-500/50 transition-colors font-light"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-gray-400 font-medium">{t("subjectLabel")}</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder={t("subjectPlaceholder")}
                className="w-full bg-novra-card/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-novra-muted focus:outline-none focus:border-purple-500/50 transition-colors font-light"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-gray-400 font-medium">{t("messageLabel")}</label>
              <textarea
                rows={5}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={t("messagePlaceholder")}
                className="w-full bg-novra-card/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-novra-muted focus:outline-none focus:border-purple-500/50 transition-colors font-light resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 font-semibold transition-all duration-300 shadow-lg shadow-purple-900/30 text-sm sm:text-base"
            >
              {status === "sending" ? t("sending") : t("submit")}
              {status !== "sending" && <ArrowRight size={16} aria-hidden />}
            </button>

            {status === "success" && (
              <p className="text-purple-300 font-medium text-sm mt-2 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-400 shrink-0" aria-hidden />
                {t("success")}
              </p>
            )}

            {status === "error" && (
              <p className="text-red-400 font-medium text-sm mt-2">{t("error")}</p>
            )}
          </form>
        </motion.section>

        <div className="text-center mt-10">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition text-sm font-medium"
          >
            {t("viewFaq")}
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

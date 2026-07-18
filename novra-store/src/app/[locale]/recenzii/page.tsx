"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getReviewAvatarUrl } from "@/lib/reviews";
import { useReviews } from "@/hooks/useReviews";
import {
  Star,
  Quote,
  CheckCircle2,
  Sparkles,
  Users,
  ThumbsUp,
  PenLine,
  ArrowRight,
} from "lucide-react";
import { fadeUp } from "@/lib/motion";

export default function Recenzii() {
  const t = useTranslations("reviews");
  const reviews = useReviews();
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const stats = useMemo(
    () => [
      { icon: Users, value: "10.000+", label: t("statCustomers") },
      { icon: Star, value: "4.9/5", label: t("statRating") },
      { icon: ThumbsUp, value: "98%", label: t("statRecommend") },
    ],
    [t]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const rating = String(formData.get("rating") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    try {
      const response = await fetch("/api/store/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, rating, message }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setStatus("success");
        e.currentTarget.reset();
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

      <section className="relative overflow-hidden pt-8 sm:pt-12 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(139,92,246,0.12),transparent)] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div {...fadeUp} className="text-center md:text-left max-w-3xl">
            <span className="inline-flex items-center gap-2 text-purple-400 font-semibold tracking-[0.2em] uppercase text-xs sm:text-sm mb-6">
              <Sparkles size={14} aria-hidden />
              {t("badge")}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.05] mb-6">
              {t("title")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-600">
                {t("titleHighlight")}
              </span>
            </h1>
            <p className="text-gray-300 text-lg sm:text-xl leading-relaxed font-light max-w-2xl">{t("subtitle")}</p>
          </motion.div>
        </div>
      </section>

      <main className="px-4 sm:px-6 md:px-12 max-w-6xl mx-auto pb-page">
        <motion.div {...fadeUp} className="grid grid-cols-3 gap-3 sm:gap-4 mb-12 sm:mb-16">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl border border-white/8 bg-novra-card/40 hover:border-purple-500/25 transition-colors"
            >
              <stat.icon size={20} className="text-purple-500 mb-2" aria-hidden />
              <span className="text-lg sm:text-2xl font-bold text-white">{stat.value}</span>
              <span className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-16 sm:mb-20">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              viewport={{ once: true }}
              className={`group p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40 hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden flex flex-col ${
                i === 0 ? "md:col-span-2 lg:col-span-1 lg:row-span-1" : ""
              }`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-[30px] rounded-full group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
              <Quote size={18} className="text-purple-500/40 mb-3" aria-hidden />
              <div className="flex gap-0.5 mb-4" aria-label={t("starsLabel", { count: review.rating })}>
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star key={j} size={14} className="text-yellow-500 fill-yellow-500" aria-hidden />
                ))}
              </div>
              <p className="text-gray-300 font-light leading-relaxed text-sm sm:text-base italic mb-6 flex-1">
                &ldquo;{review.comment}&rdquo;
              </p>
              <div className="border-t border-white/8 pt-4 flex justify-between items-center gap-3 mt-auto">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getReviewAvatarUrl(review.name)}
                    alt={review.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full shrink-0 border-2 border-purple-500/30"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate flex items-center gap-1">
                      {review.name}
                      <CheckCircle2 size={12} className="text-purple-400 shrink-0" aria-hidden />
                    </h4>
                    <p className="text-xs text-purple-400 uppercase tracking-widest font-medium mt-0.5">
                      {review.location || t("verifiedClient")}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-600 font-light shrink-0">{review.date}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.section
          {...fadeUp}
          className="p-8 sm:p-10 relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-purple-500/8 to-transparent max-w-3xl mx-auto"
        >
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none" />

          <div className="text-center mb-8 relative z-10">
            <span className="inline-flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-widest mb-3">
              <PenLine size={14} aria-hidden />
              {t("formBadge")}
            </span>
            <h3 className="text-2xl font-bold mb-2 tracking-tight text-white">{t("formTitle")}</h3>
            <p className="text-gray-400 font-light text-sm max-w-lg mx-auto">{t("formDesc")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">{t("nameLabel")}</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder={t("namePlaceholder")}
                  className="w-full bg-novra-card/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-novra-muted focus:outline-none focus:border-purple-500/50 transition-colors font-light"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">{t("emailLabel")}</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder={t("emailPlaceholder")}
                  className="w-full bg-novra-card/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-novra-muted focus:outline-none focus:border-purple-500/50 transition-colors font-light"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">{t("ratingLabel")}</label>
              <select
                name="rating"
                className="w-full bg-novra-card/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors font-light"
              >
                <option value="5 Stele ★★★★★">{t("rating5")}</option>
                <option value="4 Stele ★★★★☆">{t("rating4")}</option>
                <option value="3 Stele ★★★☆☆">{t("rating3")}</option>
                <option value="2 Stele ★★☆☆☆">{t("rating2")}</option>
                <option value="1 Stea  ★☆☆☆☆">{t("rating1")}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">{t("reviewLabel")}</label>
              <textarea
                rows={4}
                name="message"
                required
                placeholder={t("reviewPlaceholder")}
                className="w-full bg-novra-card/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-novra-muted focus:outline-none focus:border-purple-500/50 transition-colors font-light resize-none"
              />
            </div>

            <div className="text-center pt-2">
              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 font-semibold transition-all duration-300 text-sm cursor-pointer shadow-lg shadow-purple-900/30"
              >
                {status === "sending" ? t("sending") : t("submit")}
                {status !== "sending" && <ArrowRight size={16} aria-hidden />}
              </button>
            </div>

            {status === "success" && (
              <p className="text-purple-300 font-medium text-center text-sm mt-3 flex items-center justify-center gap-2">
                <CheckCircle2 size={16} className="text-green-400 shrink-0" aria-hidden />
                {t("success")}
              </p>
            )}

            {status === "error" && (
              <p className="text-red-400 font-medium text-center text-sm mt-3">{t("error")}</p>
            )}
          </form>
        </motion.section>

        <div className="text-center mt-12">
          <Link
            href="/produse"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition text-sm font-medium"
          >
            {t("discoverProducts")}
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

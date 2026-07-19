"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ShieldCheck, Sparkles, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fadeUp } from "@/lib/motion";

type VerifyState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string; productName?: string }
  | { status: "error"; message: string };

export default function VerificareAutenticitatePage() {
  const t = useTranslations("authenticity");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<VerifyState>({ status: "idle" });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setResult({ status: "loading" });

    try {
      const response = await fetch("/api/store/authenticity/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
        productName?: string;
      };

      if (data.ok) {
        setResult({
          status: "success",
          message: data.message ?? t("successDefault"),
          productName: data.productName,
        });
        return;
      }

      setResult({
        status: "error",
        message: data.message ?? t("errorDefault"),
      });
    } catch {
      setResult({ status: "error", message: t("errorDefault") });
    }
  };

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

        <motion.section
          {...fadeUp}
          className="p-8 sm:p-10 relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-purple-500/8 to-transparent max-w-2xl"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none" />

          <div className="flex items-center gap-3 mb-8 relative z-10">
            <ShieldCheck size={24} className="text-purple-400" aria-hidden />
            <h2 className="text-2xl font-bold tracking-tight text-white">{t("formTitle")}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-gray-400 font-medium">
                {t("codeLabel")}
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder={t("codePlaceholder")}
                className="w-full bg-novra-card/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-novra-muted focus:outline-none focus:border-purple-500/50 transition-colors font-light tracking-wider uppercase"
              />
              <p className="text-xs text-gray-500">{t("codeHint")}</p>
            </div>

            <button
              type="submit"
              disabled={result.status === "loading"}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 font-semibold transition-all duration-300 shadow-lg shadow-purple-900/30 text-sm sm:text-base"
            >
              {result.status === "loading" ? t("verifying") : t("submit")}
              {result.status !== "loading" && <ArrowRight size={16} aria-hidden />}
            </button>

            {result.status === "success" && (
              <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm">
                <p className="font-semibold text-green-300 flex items-center gap-2">
                  <CheckCircle2 size={18} aria-hidden />
                  {t("successTitle")}
                </p>
                <p className="mt-2 text-green-200/90">{result.message}</p>
                {result.productName ? (
                  <p className="mt-1 text-green-200/70">{result.productName}</p>
                ) : null}
              </div>
            )}

            {result.status === "error" && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 flex items-start gap-2">
                <XCircle size={18} className="shrink-0 mt-0.5" aria-hidden />
                <span>{result.message}</span>
              </div>
            )}
          </form>
        </motion.section>

        <motion.div {...fadeUp} className="mt-10 max-w-2xl rounded-2xl border border-white/8 bg-novra-card/30 p-6">
          <h3 className="text-lg font-semibold text-white mb-2">{t("howTitle")}</h3>
          <ol className="space-y-2 text-sm text-gray-400 list-decimal list-inside">
            <li>{t("howStep1")}</li>
            <li>{t("howStep2")}</li>
            <li>{t("howStep3")}</li>
          </ol>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

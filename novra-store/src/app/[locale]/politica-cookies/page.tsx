"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Cookie, Sparkles, Settings, BarChart3, Link2, Mail } from "lucide-react";

import { fadeUp } from "@/lib/motion";
import { AFFILIATE_ATTRIBUTION_DAYS, AFFILIATE_REF_COOKIE } from "@/lib/affiliates-types";

const cookieTypes = [
  {
    name: "Esențiale (strict necesare)",
    purpose: "Funcționarea coșului, autentificarea contului, securitatea sesiunii.",
    duration: "Sesiune / până la 30 zile",
    required: true,
  },
  {
    name: AFFILIATE_REF_COOKIE,
    purpose: `Atribuire comenzi program afiliere (parametru ?ref=). Durată: ${AFFILIATE_ATTRIBUTION_DAYS} zile.`,
    duration: `${AFFILIATE_ATTRIBUTION_DAYS} zile`,
    required: false,
  },
  {
    name: "Preferințe site",
    purpose: "Salvare setări locale (ex. coș, preferințe UI).",
    duration: "Variabil",
    required: false,
  },
];

export default function PoliticaCookies() {
  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="px-4 sm:px-6 md:px-12 max-w-4xl mx-auto pb-page">
        <section className="relative overflow-hidden pt-8 sm:pt-12 pb-12 sm:pb-16 mb-8">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 text-purple-400 font-semibold tracking-[0.2em] uppercase text-xs sm:text-sm mb-4">
              <Sparkles size={14} aria-hidden />
              Cookie-uri
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter mb-4">
              Politica de{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                Cookie-uri
              </span>
            </h1>
            <p className="text-gray-400 text-sm font-light">Ultima actualizare: Iulie 2026</p>
          </motion.div>
        </section>

        <div className="space-y-5">
          <motion.section {...fadeUp} className="p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40">
            <div className="flex items-start gap-4 mb-4">
              <Cookie size={20} className="text-purple-400 shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">Ce sunt cookie-urile?</h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Cookie-urile sunt fișiere mici stocate pe dispozitivul tău când vizitezi NOVRA Store. Ne ajută să
                  oferim funcționalități esențiale (coș, cont, checkout) și, opțional, să atribuim comenzi în programul
                  de afiliere.
                </p>
              </div>
            </div>
          </motion.section>

          <motion.section {...fadeUp} className="p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings size={18} className="text-purple-400" />
              Tipuri de cookie-uri utilizate
            </h2>
            <div className="space-y-4">
              {cookieTypes.map((cookie) => (
                <div key={cookie.name} className="rounded-xl border border-white/8 bg-novra-bg/40 p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-medium text-white text-sm">{cookie.name}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${
                        cookie.required
                          ? "bg-purple-500/15 text-purple-300"
                          : "bg-gray-500/15 text-gray-400"
                      }`}
                    >
                      {cookie.required ? "Necesar" : "Opțional"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">{cookie.purpose}</p>
                  <p className="text-xs text-gray-500">Durată: {cookie.duration}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section {...fadeUp} className="p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Link2 size={18} className="text-purple-400" />
              Cookie afiliere (?ref=)
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Când accesezi site-ul printr-un link de afiliat (ex. novra.ro/?ref=COD), setăm un cookie care reține codul
              afiliatului timp de {AFFILIATE_ATTRIBUTION_DAYS} zile. Dacă plasezi o comandă în această perioadă, comisionul
              poate fi atribuit afiliatului respectiv. Poți șterge cookie-urile din setările browserului.
            </p>
          </motion.section>

          <motion.section {...fadeUp} className="p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <BarChart3 size={18} className="text-purple-400" />
              Gestionarea cookie-urilor
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              Poți configura browserul să refuze cookie-urile sau să te alerteze când sunt setate. Dezactivarea cookie-urilor
              esențiale poate afecta funcționarea coșului, checkout-ului și contului.
            </p>
            <p className="text-sm text-gray-400">
              Mai multe detalii în{" "}
              <Link href="/politica-confidentialitate" className="text-purple-400 hover:underline">
                Politica de confidențialitate
              </Link>
              .
            </p>
          </motion.section>

          <motion.section
            {...fadeUp}
            className="p-6 sm:p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-transparent"
          >
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-purple-500" />
              <span className="text-gray-400">Întrebări:</span>
              <a href="mailto:contact@novra.ro" className="text-purple-400 hover:underline">
                contact@novra.ro
              </a>
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

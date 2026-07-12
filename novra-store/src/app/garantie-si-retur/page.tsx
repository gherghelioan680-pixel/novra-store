"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShieldCheck,
  RotateCcw,
  Clock,
  Package,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Mail,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { fadeUp } from "@/lib/motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildWhatsAppUrl } from "@/lib/store";

const warrantyHighlights = [
  { icon: ShieldCheck, label: "24 luni", sub: "Garanție completă" },
  { icon: RotateCcw, label: "14 zile", sub: "Drept de retur" },
  { icon: Clock, label: "48h", sub: "Procesare retur" },
  { icon: CheckCircle2, label: "100%", sub: "Ramburs integral" },
];

const returnSteps = [
  {
    step: "01",
    title: "Contactează-ne",
    description: "Scrie-ne pe WhatsApp sau email pentru a iniția cererea de retur. Îți confirmăm procedura în aceeași zi.",
  },
  {
    step: "02",
    title: "Pregătește coletul",
    description: "Ambalează produsul în starea originală, cu accesoriile și ambalajul intact. Urmează instrucțiunile primite.",
  },
  {
    step: "03",
    title: "Expediere retur",
    description: "Predă coletul curierului conform indicațiilor. Îți comunicăm adresa de retur și detaliile logistice.",
  },
  {
    step: "04",
    title: "Rambursare",
    description: "După verificarea produsului, returnăm suma integrală în contul tău bancar în maximum 14 zile lucrătoare.",
  },
];

const warrantyCovers = [
  "Defecte de fabricație sau materiale",
  "Funcționare necorespunzătoare în condiții normale de utilizare",
  "Probleme la conectori sau la împletitura cablului",
  "Înlocuire sau reparare gratuită în perioada garanției",
];

const warrantyExcludes = [
  "Deteriorări cauzate de utilizare necorespunzătoare",
  "Uzură normală sau deteriorări mecanice accidentale",
  "Modificări sau reparații efectuate de terți neautorizați",
  "Deteriorări cauzate de lichide, foc sau forță majoră",
];

export default function GarantieSiRetur() {
  const { whatsappNumber } = useSiteSettings();
  const whatsappHref = buildWhatsAppUrl(
    whatsappNumber,
    "Salut! Am o solicitare legată de garanție/retur."
  );

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="px-4 sm:px-6 md:px-12 max-w-5xl mx-auto pb-page">
        {/* Hero */}
        <section className="relative overflow-hidden pt-8 sm:pt-12 pb-12 sm:pb-16 mb-8">
          <div className="absolute -top-8 right-0 w-48 h-48 bg-purple-500/8 blur-[80px] rounded-full pointer-events-none" />
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 text-purple-400 font-semibold tracking-[0.2em] uppercase text-xs sm:text-sm mb-4">
              <Sparkles size={14} aria-hidden />
              Angajamentul NOVRA
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6">
              Garanție{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                & Retur
              </span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg font-light max-w-2xl leading-relaxed">
              Standarde clare, proces transparent. Fiecare produs NOVRA vine cu garanție de 24 luni și drept de retur în
              14 zile — fără complicații.
            </p>
          </motion.div>
        </section>

        {/* Quick highlights */}
        <motion.div {...fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-16 sm:mb-20">
          {warrantyHighlights.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl border border-white/8 bg-novra-card/40 hover:border-purple-500/25 transition-colors"
            >
              <item.icon size={22} className="text-purple-500 mb-2" aria-hidden />
              <span className="text-sm sm:text-base font-semibold text-white">{item.label}</span>
              <span className="text-xs text-gray-500 mt-0.5">{item.sub}</span>
            </div>
          ))}
        </motion.div>

        {/* Garanție */}
        <motion.section {...fadeUp} className="mb-16 sm:mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <ShieldCheck size={22} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white tracking-tight">Garanția calității</h2>
              <p className="text-gray-500 text-sm">Încredere totală în fiecare produs</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/50 via-novra-card/40 to-novra-surface p-6 sm:p-10 mb-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
              <div className="shrink-0">
                <div className="text-5xl sm:text-6xl font-bold text-white tracking-tight">24</div>
                <p className="text-purple-400 font-semibold text-sm mt-1 uppercase tracking-widest">Luni garanție</p>
              </div>
              <p className="text-gray-300 text-base sm:text-lg font-light leading-relaxed">
                Fiecare produs NOVRA trece printr-un proces riguros de testare înainte de a părăsi depozitul nostru.
                Suntem atât de încrezători în durabilitatea accesoriilor noastre, încât oferim garanție completă pentru
                defectele de fabricație.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-6 sm:p-7 rounded-2xl border border-white/8 bg-novra-card/40">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={18} className="text-green-400" aria-hidden />
                <h3 className="font-bold text-white">Ce acoperă garanția</h3>
              </div>
              <ul className="space-y-2.5">
                {warrantyCovers.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 sm:p-7 rounded-2xl border border-white/8 bg-novra-card/40">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={18} className="text-amber-400" aria-hidden />
                <h3 className="font-bold text-white">Ce nu acoperă garanția</h3>
              </div>
              <ul className="space-y-2.5">
                {warrantyExcludes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="w-1 h-1 rounded-full bg-gray-500 shrink-0 mt-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Retur */}
        <motion.section {...fadeUp} className="mb-16 sm:mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <RotateCcw size={22} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white tracking-tight">Politică de retur</h2>
              <p className="text-gray-500 text-sm">14 zile calendaristice, fără explicații</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-8">
            <div className="group p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40 hover:border-purple-500/25 transition-all">
              <Package size={24} className="text-purple-400 mb-4" aria-hidden />
              <h3 className="text-white font-bold text-lg mb-2">Condiții de retur</h3>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                Dacă nu ești pe deplin mulțumit, poți returna produsele în termen de{" "}
                <strong className="text-white font-semibold">14 zile calendaristice</strong> de la primirea coletului.
                Produsele trebuie să fie în starea originală, cu ambalajul intact.
              </p>
            </div>
            <div className="group p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40 hover:border-purple-500/25 transition-all">
              <CheckCircle2 size={24} className="text-purple-400 mb-4" aria-hidden />
              <h3 className="text-white font-bold text-lg mb-2">Rambursare</h3>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                După recepționarea și verificarea produsului, returnăm suma integrală în contul tău bancar. Costurile de
                transport pentru retur sunt suportate de client, cu excepția produselor defecte.
              </p>
            </div>
          </div>

          {/* Return flow */}
          <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-purple-500/8 to-transparent p-6 sm:p-10">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full pointer-events-none" />
            <h3 className="text-lg font-bold text-white mb-8 tracking-tight">Cum procedezi?</h3>
            <ol className="grid sm:grid-cols-2 gap-6">
              {returnSteps.map((item) => (
                <li key={item.step} className="flex gap-4 items-start">
                  <span className="text-purple-500 font-bold text-sm tracking-tight pt-0.5 shrink-0">{item.step}.</span>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          {...fadeUp}
          className="text-center p-8 sm:p-10 rounded-3xl border border-novra-border bg-novra-card/30"
        >
          <h3 className="text-xl sm:text-2xl font-bold mb-3">Ai nevoie de asistență?</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
            Echipa NOVRA te ghidează pas cu pas prin procesul de garanție sau retur.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] px-6 py-3 rounded-full font-semibold transition text-sm"
            >
              <FaWhatsapp size={18} aria-hidden />
              WhatsApp
            </a>
            <a
              href="mailto:support@novra.ro"
              className="inline-flex items-center justify-center gap-2 border border-novra-border hover:bg-novra-elevated px-6 py-3 rounded-full font-semibold transition text-sm"
            >
              <Mail size={16} aria-hidden />
              support@novra.ro
            </a>
            <Link
              href="/faq"
              className="inline-flex items-center justify-center gap-2 text-purple-400 hover:text-purple-300 px-6 py-3 font-semibold transition text-sm"
            >
              Vezi FAQ
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

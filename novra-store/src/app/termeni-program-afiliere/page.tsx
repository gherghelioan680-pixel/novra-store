"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Link2,
  Wallet,
  Cookie,
  Scale,
  Mail,
  Sparkles,
  CheckCircle,
  Ban,
  Banknote,
} from "lucide-react";

import { fadeUp } from "@/lib/motion";
import { AFFILIATE_ATTRIBUTION_DAYS, DEFAULT_AFFILIATE_COMMISSION_RATE, MIN_AFFILIATE_PAYOUT_AMOUNT } from "@/lib/affiliates-types";

const sections = [
  {
    num: 1,
    icon: Link2,
    title: "Definiții și acceptare",
    content: (
      <p>
        Programul de Afiliere NOVRA („Programul”) permite utilizatorilor aprobați să promoveze produsele NOVRA Store
        și să primească comision pentru comenzile validate atribuite link-ului lor. Prin aplicarea și participarea la
        Program, accepți integral prezentele termeni, precum și{" "}
        <Link href="/politica-confidentialitate" className="text-purple-400 hover:underline">
          Politica de confidențialitate
        </Link>
        .
      </p>
    ),
  },
  {
    num: 2,
    icon: CheckCircle,
    title: "Eligibilitate",
    content: (
      <ul className="space-y-2 text-gray-400">
        <li className="flex items-start gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
          Vârsta minimă 18 ani și rezidență în România.
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
          Cont activ NOVRA Store și prezență pe rețele sociale sau canal de promovare.
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
          Aprobare explicită din partea echipei NOVRA.
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
          Interzis auto-referral (comenzi proprii prin link-ul de afiliat).
        </li>
      </ul>
    ),
  },
  {
    num: 3,
    icon: Cookie,
    title: "Link-uri, tracking și atribuire",
    content: (
      <>
        <p className="mb-4">
          Fiecare afiliat primește un link unic de forma{" "}
          <code className="text-purple-300">https://www.novra.ro/?ref=COD</code>. Atribuirea comenzilor se face astfel:
        </p>
        <ul className="space-y-2 text-gray-400">
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Cookie de atribuire: {AFFILIATE_ATTRIBUTION_DAYS} zile de la ultimul click pe link.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            O comandă este atribuită o singură dată (idempotent per orderId).
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Comisionul se calculează din subtotalul produselor (total minus transport), cu excepția ratelor personalizate.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Comision implicit: {DEFAULT_AFFILIATE_COMMISSION_RATE}% din produse; adminul poate seta rată sau sumă fixă.
          </li>
        </ul>
      </>
    ),
  },
  {
    num: 4,
    icon: Wallet,
    title: "Comisioane și status",
    content: (
      <ul className="space-y-2 text-gray-400">
        <li className="flex items-start gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
          Comisionul apare ca „în așteptare” după finalizarea comenzii atribuite.
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
          NOVRA poate ajusta sau anula comisionul în caz de fraudă, retur total sau anulare comandă.
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
          Comisionul devine disponibil pentru retragere conform soldului afișat în cont.
        </li>
      </ul>
    ),
  },
  {
    num: 5,
    icon: Banknote,
    title: "Retrageri comision (payout)",
    content: (
      <>
        <p className="mb-4">Poți solicita retragerea comisionului din panoul de afiliat:</p>
        <ul className="space-y-2 text-gray-400">
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Suma minimă: {MIN_AFFILIATE_PAYOUT_AMOUNT} RON.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Date necesare: titular cont, IBAN (preferat) sau număr card, bancă (opțional).
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Plata se face manual prin transfer bancar, după aprobarea echipei NOVRA.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Termen estimativ procesare: 5–15 zile lucrătoare de la aprobare.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Ești responsabil pentru corectitudinea datelor bancare furnizate.
          </li>
        </ul>
      </>
    ),
  },
  {
    num: 6,
    icon: Ban,
    title: "Conduite interzise",
    content: (
      <ul className="space-y-2 text-gray-400">
        <li className="flex items-start gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
          Spam, publicitate înșelătoare sau promisiuni false despre produse.
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
          Cookie stuffing, click fraud sau trafic artificial.
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
          Utilizarea mărcii NOVRA fără acord scris prealabil.
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
          Încălcarea legislației privind publicitatea online.
        </li>
      </ul>
    ),
  },
  {
    num: 7,
    icon: Scale,
    title: "Modificări și reziliere",
    content: (
      <p>
        NOVRA își rezervă dreptul de a modifica comisionul, termenii sau de a suspenda/închide contul de afiliat, cu
        notificare rezonabilă când este posibil. Poți renunța oricând la Program; comisioanele validate rămân supuse
        procesării conform termenilor în vigoare la data comenzii.
      </p>
    ),
  },
];

export default function TermeniProgramAfiliere() {
  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="px-4 sm:px-6 md:px-12 max-w-4xl mx-auto pb-page">
        <section className="relative overflow-hidden pt-8 sm:pt-12 pb-12 sm:pb-16 mb-8">
          <div className="absolute -top-8 right-0 w-48 h-48 bg-purple-500/8 blur-[80px] rounded-full pointer-events-none" />
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 text-purple-400 font-semibold tracking-[0.2em] uppercase text-xs sm:text-sm mb-4">
              <Sparkles size={14} aria-hidden />
              Program Afiliere
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter mb-4">
              Termeni{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                Program Afiliere
              </span>
            </h1>
            <p className="text-gray-400 text-sm font-light">Ultima actualizare: Iulie 2026</p>
          </motion.div>
        </section>

        <div className="space-y-4 sm:space-y-5">
          {sections.map((section, i) => (
            <motion.section
              key={section.num}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              viewport={{ once: true }}
              className="p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
                  <section.icon size={18} className="text-purple-400" aria-hidden />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight pt-1.5">
                  {section.num}. {section.title}
                </h2>
              </div>
              <div className="text-gray-300 font-light leading-relaxed text-sm sm:text-base sm:pl-14">
                {section.content}
              </div>
            </motion.section>
          ))}

          <motion.section
            {...fadeUp}
            className="p-6 sm:p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-transparent"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Contact program afiliere</h2>
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-purple-500" aria-hidden />
              <a href="mailto:support@novra.ro" className="text-purple-400 hover:underline">
                support@novra.ro
              </a>
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

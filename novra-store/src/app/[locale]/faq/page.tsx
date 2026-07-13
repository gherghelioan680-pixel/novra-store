"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ChevronDown,
  Search,
  HelpCircle,
  Sparkles,
  MessageCircle,
  ArrowRight,
  Package,
  CreditCard,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { fadeUp } from "@/lib/motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildWhatsAppUrl } from "@/lib/store";

const faqCategories = [
  { icon: Package, label: "Comenzi" },
  { icon: CreditCard, label: "Plată" },
  { icon: Truck, label: "Livrare" },
  { icon: ShieldCheck, label: "Garanție" },
];

const buildFaqs = (whatsappNumber: string) => [
  {
    q: "Cum pot plasa o comandă?",
    a: (
      <>
        Selectează produsul dorit din{" "}
        <Link href="/produse" className="text-purple-400 hover:underline">
          catalog
        </Link>
        , configurează varianta (culoare, lungime etc.) și apasă butonul de comandă. Poți finaliza prin WhatsApp sau
        prin formularul de checkout de pe site.
      </>
    ),
  },
  {
    q: "Ce metode de plată acceptați?",
    a: (
      <>
        Acceptăm plată cu cardul online (Visa, Mastercard) și ramburs la livrare. La ramburs plătești doar după ce
        verifici coletul. Vezi detalii complete în pagina{" "}
        <Link href="/livrare-si-plata" className="text-purple-400 hover:underline">
          Livrare și plată
        </Link>
        .
      </>
    ),
  },
  {
    q: "În cât timp primesc comanda?",
    a: "Expediem comenzile în 24–48 de ore lucrătoare prin curier rapid, cu asigurare completă. Timpul exact de livrare depinde de localitatea ta și de disponibilitatea stocului la momentul comenzii.",
  },
  {
    q: "Livrați în toată România?",
    a: "Da, livrăm în toată țara prin parteneri logistici de încredere. La finalizarea comenzii, confirmăm adresa de livrare și îți comunicăm estimarea de primire a coletului.",
  },
  {
    q: "Cum vă pot contacta pentru asistență?",
    a: (
      <>
        Ne poți scrie pe{" "}
        <a
          href={buildWhatsAppUrl(whatsappNumber)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:underline"
        >
          WhatsApp
        </a>
        , pe{" "}
        <a href="mailto:support@novra.ro" className="text-purple-400 hover:underline">
          support@novra.ro
        </a>{" "}
        sau prin{" "}
        <Link href="/contact" className="text-purple-400 hover:underline">
          pagina de contact
        </Link>
        . Răspundem în cel mai scurt timp posibil.
      </>
    ),
  },
  {
    q: "Unde găsesc informații despre garanție și retur?",
    a: (
      <>
        Politica completă de garanție (24 luni) și retur (14 zile) este disponibilă în pagina dedicată{" "}
        <Link href="/garantie-si-retur" className="text-purple-400 hover:underline">
          Garanție și retur
        </Link>
        .
      </>
    ),
  },
  {
    q: "Produsele NOVRA sunt compatibile cu dispozitivele mele?",
    a: "Fiecare produs din catalog include specificațiile tehnice relevante (tip conector, lungime, compatibilitate iOS/Android etc.). Dacă ai dubii înainte de comandă, contactează-ne și îți confirmăm compatibilitatea cu dispozitivul tău.",
  },
];

export default function FaqPage() {
  const { whatsappNumber } = useSiteSettings();
  const faqs = useMemo(() => buildFaqs(whatsappNumber), [whatsappNumber]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const q = searchQuery.toLowerCase();
    return faqs.filter(
      (faq) =>
        faq.q.toLowerCase().includes(q) ||
        (typeof faq.a === "string" && faq.a.toLowerCase().includes(q))
    );
  }, [searchQuery, faqs]);

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="px-4 sm:px-6 md:px-12 max-w-4xl mx-auto pb-page">
        {/* Hero */}
        <section className="relative overflow-hidden pt-8 sm:pt-12 pb-12 sm:pb-16 mb-4">
          <div className="absolute -top-8 right-0 w-48 h-48 bg-purple-500/8 blur-[80px] rounded-full pointer-events-none" />
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 text-purple-400 font-semibold tracking-[0.2em] uppercase text-xs sm:text-sm mb-4">
              <Sparkles size={14} aria-hidden />
              Suport NOVRA
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6">
              Întrebări{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                frecvente
              </span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg font-light max-w-2xl leading-relaxed">
              Răspunsuri rapide la cele mai comune întrebări despre comenzi, livrare și asistență.
            </p>
          </motion.div>
        </section>

        {/* Category pills */}
        <motion.div {...fadeUp} className="flex flex-wrap gap-2 mb-8">
          {faqCategories.map((cat) => (
            <span
              key={cat.label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/8 bg-novra-card/40 text-xs text-gray-400"
            >
              <cat.icon size={12} className="text-purple-500" aria-hidden />
              {cat.label}
            </span>
          ))}
        </motion.div>

        {/* Search */}
        <motion.div {...fadeUp} className="relative mb-10">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400/70 pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Caută o întrebare..."
            className="w-full bg-novra-card/40 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white placeholder:text-novra-muted focus:outline-none focus:border-purple-500/50 transition-colors font-light"
          />
        </motion.div>

        {/* FAQ accordion */}
        <motion.section {...fadeUp}>
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <HelpCircle size={32} className="mx-auto mb-3 text-purple-500/50" aria-hidden />
                <p>Nu am găsit întrebări care să corespundă căutării tale.</p>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={faq.q}
                    className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isOpen
                        ? "border-purple-500/30 bg-novra-card/50"
                        : "border-white/8 bg-novra-card/30 hover:border-purple-500/20"
                    }`}
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full p-5 sm:p-6 flex justify-between items-center text-left group transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="flex items-start gap-3 pr-4">
                        <HelpCircle
                          size={18}
                          className={`shrink-0 mt-0.5 ${isOpen ? "text-purple-400" : "text-purple-500/50"}`}
                          aria-hidden
                        />
                        <span
                          className={`font-medium text-base sm:text-lg tracking-tight transition-colors ${
                            isOpen ? "text-purple-300" : "text-white group-hover:text-purple-300"
                          }`}
                        >
                          {faq.q}
                        </span>
                      </span>
                      <ChevronDown
                        size={20}
                        className={`shrink-0 text-gray-500 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-purple-400" : "group-hover:text-purple-400"
                        }`}
                        aria-hidden
                      />
                    </button>

                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pl-11 sm:pl-14">
                          <p className="text-gray-400 text-sm sm:text-base font-light leading-relaxed">{faq.a}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          {...fadeUp}
          className="mt-12 sm:mt-16 text-center p-8 sm:p-10 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/8 to-transparent"
        >
          <MessageCircle size={28} className="text-purple-400 mx-auto mb-4" aria-hidden />
          <h3 className="text-xl font-bold mb-2">Nu ai găsit răspunsul?</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
            Echipa NOVRA îți stă la dispoziție pe WhatsApp sau email.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-full font-semibold transition text-sm"
            >
              Contactează-ne
              <ArrowRight size={14} aria-hidden />
            </Link>
            <Link
              href="/garantie-si-retur"
              className="inline-flex items-center justify-center gap-2 border border-novra-border hover:bg-novra-elevated px-6 py-3 rounded-full font-semibold transition text-sm"
            >
              Garanție și retur
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

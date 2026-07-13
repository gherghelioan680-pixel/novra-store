"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";
import { Truck, CreditCard, Shield, Clock, Banknote, Package, MapPin, CheckCircle2, Sparkles } from "lucide-react";
import { fadeUp } from "@/lib/motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const deliverySteps = [
  {
    step: "01",
    title: "Plasezi comanda",
    description: "Alegi produsele din catalog și finalizezi comanda online sau prin WhatsApp.",
  },
  {
    step: "02",
    title: "Confirmăm detaliile",
    description: "Te contactăm pentru confirmare, adresă de livrare și metoda de plată preferată.",
  },
  {
    step: "03",
    title: "Expediem coletul",
    description: "Ambalăm cu grijă și predăm coletul curierului în 24–48 de ore lucrătoare.",
  },
  {
    step: "04",
    title: "Primești produsul",
    description: "Verifici coletul la livrare și plătești cu cardul sau ramburs, după preferință.",
  },
];

const paymentMethods = [
  {
    icon: CreditCard,
    title: "Plată cu cardul (online)",
    badge: "Recomandat",
    description:
      "Plătești securizat cu Visa, Mastercard sau alte carduri bancare. Primești link-ul de plată după confirmarea comenzii.",
    features: ["Tranzacție criptată SSL", "Confirmare instantă", "Fără comisioane suplimentare"],
  },
  {
    icon: Banknote,
    title: "Ramburs la livrare",
    badge: "Clasic",
    description:
      "Plătești numerar exact la primirea coletului, după ce te-ai asigurat de calitatea produsului.",
    features: ["Zero plată în avans", "Verifici înainte de plată", "Transparență totală"],
  },
];

export default function LivrareSiPlata() {
  const { deliveryCost, freeShippingThreshold } = useSiteSettings();

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="px-4 sm:px-6 md:px-12 max-w-5xl mx-auto pb-page">
        {/* Hero */}
        <section className="relative overflow-hidden pt-8 sm:pt-12 pb-12 sm:pb-16 mb-4">
          <div className="absolute -top-8 right-0 w-48 h-48 bg-purple-500/8 blur-[80px] rounded-full pointer-events-none" />
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 text-purple-400 font-semibold tracking-[0.2em] uppercase text-xs sm:text-sm mb-4">
              <Sparkles size={14} aria-hidden />
              Logistica NOVRA
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6">
              Livrare{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                & Plată
              </span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg font-light max-w-2xl leading-relaxed">
              Expediere rapidă în toată România, ambalare premium și flexibilitate la plată — card online sau ramburs la livrare.
            </p>
          </motion.div>
        </section>
        {/* Quick highlights */}
        <motion.div {...fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-16 sm:mb-20">          {[
            { icon: Clock, label: "24–48 ore", sub: "Expediere rapidă" },
            { icon: MapPin, label: "Toată România", sub: "Livrare națională" },
            { icon: Shield, label: "Asigurat", sub: "Colet protejat" },
            { icon: CreditCard, label: "2 metode", sub: "Card sau ramburs" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl border border-white/8 bg-novra-card/30 hover:border-purple-500/25 transition-colors"
            >
              <item.icon size={22} className="text-purple-500 mb-2" />
              <span className="text-sm sm:text-base font-semibold text-white">{item.label}</span>
              <span className="text-xs text-gray-500 mt-0.5">{item.sub}</span>
            </div>
          ))}
        </motion.div>
        {/* Livrare */}
        <section className="mb-16 sm:mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Truck size={22} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white tracking-tight">Livrare</h3>
              <p className="text-gray-500 text-sm">Logistică de elită, de la depozit la ușa ta</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-8">
            <div className="group p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40 hover:border-purple-500/25 transition-all">
              <Package size={24} className="text-purple-400 mb-4" />
              <h4 className="text-white font-bold text-lg mb-2">Curierat Rapid</h4>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                Expediem prin parteneri logistici de încredere, cu urmărire colet și asigurare completă pentru siguranța ta.
              </p>
            </div>
            <div className="group p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40 hover:border-purple-500/25 transition-all">
              <Shield size={24} className="text-purple-400 mb-4" />
              <h4 className="text-white font-bold text-lg mb-2">Ambalare Premium</h4>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                Fiecare produs NOVRA este protejat suplimentar pentru a garanta că experiența ta de unboxing este impecabilă.
              </p>
            </div>
          </div>

          {/* Delivery flow */}
          <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-purple-500/8 to-transparent backdrop-blur-sm p-6 sm:p-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />
            <h4 className="text-lg font-bold text-white mb-8 tracking-tight">Cum ajunge comanda la tine</h4>
            <ol className="grid sm:grid-cols-2 gap-6">
              {deliverySteps.map((item) => (
                <li key={item.step} className="flex gap-4 items-start">
                  <span className="text-purple-500 font-bold text-sm tracking-tight pt-0.5 shrink-0">{item.step}.</span>
                  <div>
                    <h5 className="font-semibold text-white mb-1">{item.title}</h5>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Timp livrare */}
        <section className="mb-16 sm:mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Clock size={22} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white tracking-tight">Timp livrare</h3>
              <p className="text-gray-500 text-sm">Estimări clare, fără surprize</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-transparent relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 blur-[40px] rounded-full pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
              <div className="shrink-0">
                <div className="text-4xl sm:text-5xl font-bold text-white tracking-tight">24–48h</div>
                <p className="text-purple-400 font-medium text-sm mt-1">Ore lucrătoare de la confirmare</p>
              </div>
              <div className="space-y-3 text-gray-300 text-sm sm:text-base font-light leading-relaxed">
                <p>Comenzile plasate până la ora 14:00 sunt procesate în aceeași zi lucrătoare.</p>
                <p>Timpul exact de livrare depinde de localitatea ta — te ținem la curent prin SMS sau telefon.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Costuri */}
        <section className="mb-16 sm:mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Truck size={22} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white tracking-tight">Costuri livrare</h3>
              <p className="text-gray-500 text-sm">Transparente și competitive</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl border border-white/8 bg-novra-card/40">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-white">{deliveryCost.toFixed(2)} RON</span>
                <span className="text-gray-500 text-sm">standard</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Tarif unic pentru livrare prin curier rapid în orice localitate din România.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-purple-500/25 bg-purple-500/5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={18} className="text-purple-400" />
                <span className="text-lg font-bold text-white">Livrare gratuită</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Pentru comenzi de peste {freeShippingThreshold} RON. Beneficiază de transport gratuit automat la checkout.
              </p>
            </div>
          </div>
        </section>

        {/* Plată */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <CreditCard size={22} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white tracking-tight">Metode de plată</h3>
              <p className="text-gray-500 text-sm">Alege varianta care ți se potrivește</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-8">
            {paymentMethods.map((method) => (
              <div
                key={method.title}
                className="relative p-6 sm:p-8 rounded-3xl border border-white/8 bg-novra-card/40 hover:border-purple-500/30 transition-all overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-[40px] rounded-full group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
                <div className="flex items-start justify-between gap-3 mb-4">
                  <method.icon size={28} className="text-purple-400 shrink-0" />
                  <span className="text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    {method.badge}
                  </span>
                </div>
                <h4 className="text-white font-bold text-lg mb-2">{method.title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">{method.description}</p>
                <ul className="space-y-2">
                  {method.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Payment badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {["Visa", "Mastercard", "Maestro", "Apple Pay"].map((brand) => (
              <span
                key={brand}
                className="px-4 py-2 rounded-xl border border-white/10 bg-novra-card/30 text-xs font-semibold uppercase tracking-wider text-gray-400"
              >
                {brand}
              </span>
            ))}
          </div>

          {/* Security callout */}
          <div className="p-6 sm:p-8 relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/8 to-transparent backdrop-blur-sm">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full pointer-events-none" />
            <div className="flex gap-4 items-start">
              <Shield size={28} className="text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-lg text-white mb-2">Plată 100% securizată</h4>
                <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                  Toate tranzacțiile cu cardul sunt procesate prin gateway-uri certificate, cu criptare SSL.
                  La ramburs, plătești doar după ce ai verificat coletul — zero risc, zero surprize.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center pt-4">
          <p className="text-gray-500 text-sm mb-6">
            Ai întrebări despre livrare sau plată? Consultă{" "}
            <Link href="/faq" className="text-purple-400 hover:underline">
              întrebările frecvente
            </Link>{" "}
            sau{" "}
            <Link href="/contact" className="text-purple-400 hover:underline">
              contactează-ne
            </Link>
            .
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

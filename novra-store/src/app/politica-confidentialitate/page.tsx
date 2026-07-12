"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Shield,
  Eye,
  Database,
  Clock,
  Share2,
  Scale,
  Lock,
  Mail,
  Sparkles,
  FileText,
} from "lucide-react";

import { fadeUp } from "@/lib/motion";

const sections = [
  {
    num: 1,
    icon: FileText,
    title: "Informații generale",
    content: (
      <p>
        Confidențialitatea vizitatorilor site-ului{" "}
        <span className="text-white font-medium">NOVRA</span> este extrem de importantă pentru noi. Această politică
        explică în mod transparent ce date colectăm, cum le utilizăm și cum le protejăm atunci când interacționezi cu
        platforma noastră.
      </p>
    ),
  },
  {
    num: 2,
    icon: Database,
    title: "Ce date personale colectăm",
    content: (
      <>
        <p className="mb-4">
          Atunci când folosești site-ul nostru (de exemplu, prin completarea formularului de contact), putem colecta
          următoarele categorii de date:
        </p>
        <ul className="space-y-2 text-gray-400">
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Date de identificare:</strong> Numele și prenumele transmise voluntar.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Date de contact:</strong> Adresa de email și subiectul solicitării tale.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Date tehnice (prin module cookie):</strong> Adresa IP, tipul de browser,
              paginile vizitate și durata sesiunii pe site-ul nostru.
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    num: 3,
    icon: Eye,
    title: "Scopul și temeiul prelucrării",
    content: (
      <>
        <p className="mb-4">Prelucrăm datele tale cu caracter personal în mod legal, echitabil și transparent:</p>
        <ul className="space-y-2 text-gray-400">
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Pentru a răspunde mesajelor, întrebărilor sau solicitărilor tale de asistență.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Pentru a asigura buna funcționare, securitatea și optimizarea performanței site-ului NOVRA.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Pentru a respecta obligațiile legale aplicabile (dacă este cazul).
          </li>
        </ul>
      </>
    ),
  },
  {
    num: 4,
    icon: Clock,
    title: "Cât timp stocăm datele tale",
    content: (
      <p>
        Păstrăm datele tale personale doar atât timp cât este necesar pentru a îndeplini scopurile pentru care au fost
        colectate (de exemplu, soluționarea completă a cererii tale trimise pe email), sau conform cerințelor legale în
        vigoare. Dacă dorești ștergerea lor anticipată, ne poți contacta în orice moment.
      </p>
    ),
  },
  {
    num: 5,
    icon: Share2,
    title: "Destinatarii datelor (Cui le transmitem)",
    content: (
      <p>
        Nu vindem, nu închiriem și nu tranzacționăm datele tale personale către terți. Pentru procesarea securizată a
        mesajelor din formularul de contact, utilizăm serviciul securizat terț{" "}
        <span className="text-purple-400 font-medium">Web3Forms</span>, care acționează strict ca un procesator tehnic
        de redirecționare a mesajului către adresa noastră oficială de email.
      </p>
    ),
  },
];

const rights = [
  { title: "Acces & Rectificare", desc: "Poți cere confirmarea prelucrării datelor tale și corectarea oricăror informații inexacte." },
  { title: "Ștergerea datelor", desc: "Ai dreptul de a solicita eliminarea completă a datelor tale din sistemele noastre." },
  { title: "Restricționare & Opoziție", desc: "Te poți opune prelucrării datelor în scopuri de marketing direct sau din motive legitime." },
  { title: "Portabilitate & Plângeri", desc: "Poți solicita transferul datelor tale sau te poți adresa ANSPDCP în caz de nereguli." },
];

export default function PoliticaConfidentialitate() {
  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="px-4 sm:px-6 md:px-12 max-w-4xl mx-auto pb-page">
        {/* Hero */}
        <section className="relative overflow-hidden pt-8 sm:pt-12 pb-12 sm:pb-16 mb-8">
          <div className="absolute -top-8 right-0 w-48 h-48 bg-purple-500/8 blur-[80px] rounded-full pointer-events-none" />
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 text-purple-400 font-semibold tracking-[0.2em] uppercase text-xs sm:text-sm mb-4">
              <Sparkles size={14} aria-hidden />
              Legal & Transparență
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-4">
              Politica de{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                Confidențialitate
              </span>
            </h1>
            <p className="text-gray-400 text-sm font-light">
              Ultima actualizare: Iunie 2026 · În conformitate cu Regulamentul (UE) 2016/679 (GDPR)
            </p>
          </motion.div>
        </section>

        {/* Numbered sections in cards */}
        <div className="space-y-4 sm:space-y-5">
          {sections.map((section, i) => (
            <motion.section
              key={section.num}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              viewport={{ once: true }}
              className="p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40 hover:border-purple-500/20 transition-colors"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
                  <section.icon size={18} className="text-purple-400" aria-hidden />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight pt-1.5">
                  {section.num}. {section.title}
                </h2>
              </div>
              <div className="text-gray-300 font-light leading-relaxed text-sm sm:text-base pl-0 sm:pl-14">
                {section.content}
              </div>
            </motion.section>
          ))}

          {/* Rights grid */}
          <motion.section
            {...fadeUp}
            className="p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
                <Scale size={18} className="text-purple-400" aria-hidden />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight pt-1.5">
                6. Drepturile tale în calitate de persoană vizată
              </h2>
            </div>
            <p className="text-gray-300 font-light text-sm sm:text-base mb-6 sm:pl-14">
              Conform GDPR, beneficiezi de drepturi extinse privind controlul asupra propriilor date personale:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 sm:pl-14">
              {rights.map((right) => (
                <div key={right.title} className="p-4 sm:p-5 rounded-xl bg-novra-bg/40 border border-white/8">
                  <h3 className="text-sm font-semibold text-white mb-1">{right.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{right.desc}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            {...fadeUp}
            className="p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
                <Lock size={18} className="text-purple-400" aria-hidden />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight pt-1.5">
                7. Securitatea datelor
              </h2>
            </div>
            <p className="text-gray-300 font-light leading-relaxed text-sm sm:text-base sm:pl-14">
              Site-ul NOVRA utilizează un certificat de securitate SSL de ultimă generație pentru a cripta toate datele
              transmise în tranzit prin formulare. Deși nicio metodă de transmisie pe internet nu este 100% sigură,
              implementăm constant cele mai bune practici din industrie pentru a preveni accesul neautorizat, pierderea
              sau alterarea datelor tale.
            </p>
          </motion.section>

          {/* Contact legal */}
          <motion.section
            {...fadeUp}
            className="p-6 sm:p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-transparent relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-[40px] rounded-full pointer-events-none" />
            <div className="flex items-start gap-4 mb-4 relative">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
                <Shield size={18} className="text-purple-400" aria-hidden />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight pt-1.5">
                8. Contact juridic
              </h2>
            </div>
            <p className="text-sm text-gray-400 mb-4 sm:pl-14 relative">
              Pentru orice întrebări, exercitarea drepturilor tale GDPR sau solicitări legate de datele tale personale:
            </p>
            <div className="text-sm space-y-2 sm:pl-14 relative">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-purple-500" aria-hidden />
                <span className="text-gray-500">Email:</span>{" "}
                <a href="mailto:contact@novra.ro" className="text-purple-400 hover:underline">
                  contact@novra.ro
                </a>
              </div>
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-purple-500" aria-hidden />
                <span className="text-gray-500">Website:</span>{" "}
                <Link href="/" className="text-purple-400 hover:underline">
                  www.novra.ro
                </Link>
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

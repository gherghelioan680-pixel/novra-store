"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  FileCheck,
  Copyright,
  UserCheck,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Gavel,
  Mail,
  Sparkles,
  Scale,
  ShoppingCart,
  CreditCard,
  Gift,
  Truck,
} from "lucide-react";

import { fadeUp } from "@/lib/motion";

const sections = [
  {
    num: 1,
    icon: FileCheck,
    title: "Acceptarea termenilor",
    content: (
      <p>
        Prin accesarea, navigarea sau utilizarea site-ului <span className="text-white font-medium">NOVRA</span> (numit în
        continuare „Site-ul”), ești de acord, în mod integral și necondiționat, cu respectarea prezentului set de Termeni
        și Condiții, precum și a legislației aplicabile. Dacă nu ești de acord cu oricare dintre aceste prevederi, te
        rugăm să oprești imediat utilizarea platformei.
      </p>
    ),
  },
  {
    num: 2,
    icon: Copyright,
    title: "Proprietatea intelectuală",
    content: (
      <>
        <p className="mb-3">
          Întregul conținut al acestui Site — incluzând, dar fără a se limita la elemente de design grafic, text,
          imagini, logo-uri, cod sursă, concepte de branding și structură — reprezintă proprietatea intelectuală
          exclusivă a <span className="text-white">NOVRA</span> și este protejat de legislația națională și
          internațională privind drepturile de autor și proprietatea industrială.
        </p>
        <p className="text-gray-400 text-sm">
          Este strict interzisă copierea, reproducerea, republicarea, descărcarea sau utilizarea comercială a oricărui
          material fără un acord prealabil scris din partea echipei noastre.
        </p>
      </>
    ),
  },
  {
    num: 3,
    icon: ShoppingCart,
    title: "Comenzi, cont client și checkout",
    content: (
      <>
        <p className="mb-4">
          NOVRA Store permite plasarea comenzilor cu sau fără cont (guest checkout). Prin finalizarea unei comenzi,
          confirmi că datele furnizate sunt corecte și că ești autorizat să utilizezi metoda de plată aleasă.
        </p>
        <ul className="space-y-2 text-gray-400">
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Contul client permite vizualizarea comenzilor, AWB tracking, NovraCredits, carduri cadou și cupoane.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Prețurile afișate includ TVA; transportul se calculează la checkout.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Comanda devine fermă după confirmarea plății sau a metodei de plată alese.
          </li>
        </ul>
      </>
    ),
  },
  {
    num: 4,
    icon: CreditCard,
    title: "Plăți Stripe",
    content: (
      <p>
        Plățile online sunt procesate securizat prin Stripe. NOVRA nu stochează datele complete ale cardului. Acceptăm
        plăți cu card bancar; tranzacțiile sunt supuse verificărilor antifraudă ale procesatorului de plăți.
      </p>
    ),
  },
  {
    num: 5,
    icon: Gift,
    title: "NovraCredits, carduri cadou și cupoane",
    content: (
      <ul className="space-y-2 text-gray-400">
        <li className="flex items-start gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
          NovraCredits și cardurile cadou au termeni de utilizare proprii; nu sunt convertibile în numerar.
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
          Cupoanele de reducere sunt personale, netransferabile și pot avea restricții (valabilitate, valoare minimă).
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
          NOVRA poate modifica sau retrage promoțiile cu notificare rezonabilă.
        </li>
      </ul>
    ),
  },
  {
    num: 6,
    icon: Truck,
    title: "Livrare, AWB și retur",
    content: (
      <p>
        Livrarea se face prin curieri parteneri; AWB-ul este comunicat prin email și în contul client. Condițiile de
        retur și garanție sunt detaliate în paginile{" "}
        <Link href="/livrare-si-plata" className="text-purple-400 hover:underline">
          Livrare și plată
        </Link>{" "}
        și{" "}
        <Link href="/garantie-si-retur" className="text-purple-400 hover:underline">
          Garanție și retur
        </Link>
        .
      </p>
    ),
  },
  {
    num: 7,
    icon: UserCheck,
    title: "Utilizarea corectă a Site-ului",
    content: (
      <>
        <p className="mb-4">În calitate de utilizator al site-ului, te angajezi să folosești platforma exclusiv în scopuri legitime. Sunt strict interzise:</p>
        <ul className="space-y-2 text-gray-400">
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Introducerea de date false, eronate sau care nu îți aparțin în formularul de contact.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Orice încercare de a perturba securitatea Site-ului sau de a introduce cod malițios (viruși, malware).
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Folosirea de sisteme automate (boti, scrapers) pentru a extrage date de pe platformă.
          </li>
        </ul>
      </>
    ),
  },
  {
    num: 8,
    icon: AlertTriangle,
    title: "Limitarea răspunderii",
    content: (
      <>
        <p className="mb-3">
          Echipa <span className="text-white">NOVRA</span> depune toate eforturile pentru ca informațiile prezentate pe
          site să fie corecte și actualizate. Cu toate acestea, conținutul este oferit „ca atare”, fără nicio garanție
          explicită sau implicită.
        </p>
        <p>
          Nu ne asumăm răspunderea pentru eventuale erori tehnice temporare, întreruperi ale funcționării site-ului sau
          daune directe ori indirecte cauzate de utilizarea sau imposibilitatea utilizării platformei.
        </p>
      </>
    ),
  },
  {
    num: 9,
    icon: ExternalLink,
    title: "Link-uri către terțe părți",
    content: (
      <p>
        Site-ul nostru poate conține legături către servicii terțe (Stripe, curieri, rețele sociale). Aceste servicii au
        proprii termeni și politici de confidențialitate; NOVRA nu controlează conținutul lor.
      </p>
    ),
  },
  {
    num: 10,
    icon: RefreshCw,
    title: "Modificarea Termenilor",
    content: (
      <p>
        Ne rezervăm dreptul de a actualiza, modifica sau înlocui periodic orice parte din acești Termeni și Condiții pentru
        a reflecta schimbările legislative sau de funcționare ale afacerii noastre. Orice modificare va deveni aplicabilă
        imediat după publicarea ei pe această pagină. Îți recomandăm să consulți periodic această pagină pentru a rămâne
        informat.
      </p>
    ),
  },
  {
    num: 11,
    icon: Gavel,
    title: "Legea aplicabilă și litigii",
    content: (
      <p>
        Prezentul document este guvernat și interpretat în conformitate cu legislația română și europeană în vigoare.
        Orice dispută sau litigiu apărut în legătură cu utilizarea acestui Site va fi soluționat pe cale amiabilă, iar
        în cazul în care acest lucru nu este posibil, competența va reveni instanțelor judecătorești românești
        competente.
      </p>
    ),
  },
];

export default function TermeniSiConditii() {
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
              Acord legal
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-4">
              Termeni și{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                Condiții
              </span>
            </h1>
            <p className="text-gray-400 text-sm font-light">
              Ultima actualizare: Iulie 2026 · Te rugăm să citești cu atenție prezentul document înainte de a utiliza
              magazinul.
            </p>
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
              <div className="text-gray-300 font-light leading-relaxed text-sm sm:text-base sm:pl-14">
                {section.content}
              </div>
            </motion.section>
          ))}

          {/* Contact legal */}
          <motion.section
            {...fadeUp}
            className="p-6 sm:p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-transparent relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-[40px] rounded-full pointer-events-none" />
            <div className="flex items-start gap-4 mb-4 relative">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
                <Scale size={18} className="text-purple-400" aria-hidden />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight pt-1.5">
                12. Întrebări și clarificări
              </h2>
            </div>
            <p className="text-sm text-gray-400 mb-4 sm:pl-14 relative">
              Dacă ai neclarități sau vrei să soliciți detalii suplimentare cu privire la termenii noștri legali:
            </p>
            <div className="text-sm space-y-2 sm:pl-14 relative">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-purple-500" aria-hidden />
                <span className="text-gray-500">Email oficial:</span>{" "}
                <a href="mailto:contact@novra.ro" className="text-purple-400 hover:underline">
                  contact@novra.ro
                </a>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck size={14} className="text-purple-500" aria-hidden />
                <span className="text-gray-500">Platformă:</span>{" "}
                <Link href="/" className="text-purple-400 hover:underline font-medium">
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

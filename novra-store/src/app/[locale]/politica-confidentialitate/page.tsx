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
  Cookie,
  CreditCard,
  Users,
  Gift,
  Truck,
} from "lucide-react";

import { fadeUp } from "@/lib/motion";

const sections = [
  {
    num: 1,
    icon: FileText,
    title: "Informații generale",
    content: (
      <p>
        Confidențialitatea vizitatorilor și clienților site-ului{" "}
        <span className="text-white font-medium">NOVRA Store</span> (www.novra.ro) este extrem de importantă pentru
        noi. Această politică explică ce date personale colectăm, cum le utilizăm, cât timp le păstrăm și ce drepturi
        ai în calitate de persoană vizată, în conformitate cu Regulamentul (UE) 2016/679 (GDPR) și legislația română
        aplicabilă.
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
          În funcție de modul în care interacționezi cu NOVRA Store, putem colecta următoarele categorii de date:
        </p>
        <ul className="space-y-2 text-gray-400">
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Date de identificare:</strong> nume, prenume, adresă de email, număr de
              telefon.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Date de livrare și facturare:</strong> adresă poștală, localitate, județ,
              cod poștal, detalii comandă.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Date cont client:</strong> credențiale de autentificare (parolă stocată
              criptat), istoric comenzi, preferințe, NovraCredits, carduri cadou, cupoane.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Date program afiliere:</strong> nume afiliat, email, cod de referință,
              statistici click-uri și comenzi, IBAN sau date card bancar pentru retrageri comision.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Date plată:</strong> informații procesate de Stripe (fără stocarea
              completă a datelor cardului pe serverele NOVRA).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Newsletter:</strong> adresa de email și preferințe de comunicare
              comercială (doar cu consimțământ).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Date tehnice:</strong> adresă IP, tip browser, pagini vizitate, cookie-uri
              de sesiune, cookie de atribuire afiliere (?ref=, 30 zile).
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
        <p className="mb-4">Prelucrăm datele tale în scopuri legitime și transparente:</p>
        <ul className="space-y-2 text-gray-400">
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Executarea contractului:</strong> procesarea comenzilor (inclusiv checkout
              fără cont), livrare, AWB tracking, gestionare retururi și garanții.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Cont client:</strong> crearea și administrarea contului, NovraCredits,
              carduri cadou, cupoane de reducere.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Plăți:</strong> procesarea tranzacțiilor prin Stripe.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Program afiliere:</strong> atribuirea comenzilor, calcul comision,
              procesarea cererilor de retragere.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Marketing:</strong> newsletter și comunicări promoționale (cu consimțământ
              explicit, retragibil oricând).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Obligații legale:</strong> evidențe contabile, fiscalitate, răspuns la
              solicitări ale autorităților.
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    num: 4,
    icon: Cookie,
    title: "Cookie-uri și tehnologii similare",
    content: (
      <>
        <p className="mb-4">Utilizăm cookie-uri și stocare locală pentru:</p>
        <ul className="space-y-2 text-gray-400 mb-4">
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Funcționarea coșului de cumpărături și a sesiunii de autentificare.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Atribuirea comenzilor în programul de afiliere (parametru ?ref=, cookie 30 zile).
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Preferințe site și securitate.
          </li>
        </ul>
        <p>
          Detalii complete în{" "}
          <Link href="/politica-cookies" className="text-purple-400 hover:underline">
            Politica de cookie-uri
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    num: 5,
    icon: Clock,
    title: "Perioada de stocare",
    content: (
      <ul className="space-y-2 text-gray-400">
        <li className="flex items-start gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
          Date cont și comenzi: pe durata relației contractuale + termene legale (de obicei 5–10 ani pentru documente
          fiscale).
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
          Cookie afiliere: maximum 30 zile de la ultimul click pe link.
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
          Newsletter: până la dezabonare sau retragerea consimțământului.
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
          Date payout afiliat: pe durata programului + termene contabile aplicabile.
        </li>
      </ul>
    ),
  },
  {
    num: 6,
    icon: Share2,
    title: "Destinatari și procesatori",
    content: (
      <>
        <p className="mb-4">Nu vindem datele tale. Le putem transmite doar către:</p>
        <ul className="space-y-2 text-gray-400">
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Stripe</strong> — procesare plăți online (PCI-DSS).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Curieri</strong> — livrare și AWB tracking (Fan Courier, Sameday etc.).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            <span>
              <strong className="text-gray-200">Upstash Redis / hosting</strong> — stocare securizată date aplicație.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
            Autorități publice, când legea o impune.
          </li>
        </ul>
      </>
    ),
  },
];

const rights = [
  { title: "Acces & Rectificare", desc: "Poți solicita confirmarea prelucrării și corectarea datelor inexacte." },
  { title: "Ștergere („dreptul de a fi uitat”)", desc: "Poți solicita ștergerea datelor, cu excepția cazurilor prevăzute legal." },
  { title: "Restricționare & Opoziție", desc: "Te poți opune prelucrării în scop de marketing direct." },
  { title: "Portabilitate & Plângeri", desc: "Poți solicita exportul datelor sau te poți adresa ANSPDCP (www.dataprotection.ro)." },
];

export default function PoliticaConfidentialitate() {
  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="px-4 sm:px-6 md:px-12 max-w-4xl mx-auto pb-page">
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
              Ultima actualizare: Iulie 2026 · GDPR (Regulament UE 2016/679)
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
              <div className="text-gray-300 font-light leading-relaxed text-sm sm:text-base pl-0 sm:pl-14">
                {section.content}
              </div>
            </motion.section>
          ))}

          <motion.section {...fadeUp} className="p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40">
            <div className="flex items-start gap-4 mb-6">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
                <Scale size={18} className="text-purple-400" aria-hidden />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight pt-1.5">
                7. Drepturile tale GDPR
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 sm:pl-14">
              {rights.map((right) => (
                <div key={right.title} className="p-4 sm:p-5 rounded-xl bg-novra-bg/40 border border-white/8">
                  <h3 className="text-sm font-semibold text-white mb-1">{right.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{right.desc}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section {...fadeUp} className="p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40">
            <div className="flex items-start gap-4 mb-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
                <CreditCard size={18} className="text-purple-400" aria-hidden />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight pt-1.5">
                8. Plăți Stripe
              </h2>
            </div>
            <p className="text-gray-300 font-light leading-relaxed text-sm sm:text-base sm:pl-14">
              Plățile online sunt procesate de Stripe Payments Europe Ltd. NOVRA nu stochează numărul complet al
              cardului. Stripe prelucrează datele de plată conform propriei politici de confidențialitate. Tranzacțiile
              sunt criptate SSL/TLS.
            </p>
          </motion.section>

          <motion.section {...fadeUp} className="p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40">
            <div className="flex items-start gap-4 mb-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
                <Users size={18} className="text-purple-400" aria-hidden />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight pt-1.5">
                9. Program afiliere
              </h2>
            </div>
            <p className="text-gray-300 font-light leading-relaxed text-sm sm:text-base sm:pl-14">
              Afiliații furnizează date de identificare și plată (IBAN/card) pentru retrageri comision. Cookie-ul de
              atribuire (?ref=) durează 30 zile. Detalii în{" "}
              <Link href="/termeni-program-afiliere" className="text-purple-400 hover:underline">
                Termenii Programului de Afiliere
              </Link>
              .
            </p>
          </motion.section>

          <motion.section {...fadeUp} className="p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40">
            <div className="flex items-start gap-4 mb-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
                <Lock size={18} className="text-purple-400" aria-hidden />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight pt-1.5">
                10. Securitatea datelor
              </h2>
            </div>
            <p className="text-gray-300 font-light leading-relaxed text-sm sm:text-base sm:pl-14">
              Implementăm măsuri tehnice și organizatorice: criptare SSL, parole hash, acces restricționat admin,
              stocare securizată. Nicio metodă de transmisie pe internet nu este 100% sigură; depunem eforturi rezonabile
              pentru protecția datelor.
            </p>
          </motion.section>

          <motion.section
            {...fadeUp}
            className="p-6 sm:p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-transparent relative overflow-hidden"
          >
            <div className="flex items-start gap-4 mb-4 relative">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
                <Shield size={18} className="text-purple-400" aria-hidden />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight pt-1.5">
                11. Contact DPO / confidențialitate
              </h2>
            </div>
            <p className="text-sm text-gray-400 mb-4 sm:pl-14 relative">
              Pentru exercitarea drepturilor GDPR sau întrebări despre datele personale:
            </p>
            <div className="text-sm space-y-2 sm:pl-14 relative">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-purple-500" aria-hidden />
                <a href="mailto:contact@novra.ro" className="text-purple-400 hover:underline">
                  contact@novra.ro
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Gift size={14} className="text-purple-500" aria-hidden />
                <Link href="/termeni-si-conditii" className="text-purple-400 hover:underline">
                  Termeni și condiții magazin
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-purple-500" aria-hidden />
                <Link href="/livrare-si-plata" className="text-purple-400 hover:underline">
                  Livrare și plată
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

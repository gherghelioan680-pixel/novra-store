"use client";

import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, Clock, MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildWhatsAppUrl, formatWhatsAppDisplay } from "@/lib/store";

export default function Footer() {
  const { whatsappNumber } = useSiteSettings();
  const phoneDisplay = formatWhatsAppDisplay(whatsappNumber);

  return (
    <footer className="bg-novra-bg-alt border-t border-novra-border/60 pt-16 pb-4 max-md:pb-[calc(1rem+env(safe-area-inset-bottom,0px))] px-4 sm:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 mb-16">
        <div className="sm:col-span-2">
          <div className="mb-4">
            <Image
              src="/logo.png"
              alt="NOVRA Logo"
              width={120}
              height={40}
              className="h-12 sm:h-14 w-auto"
              priority
            />
          </div>

          <p className="text-sm text-gray-400 mb-6 max-w-xs leading-relaxed">
            Cabluri premium pentru o lume în continuă mișcare. Performanță, siguranță și design — fără compromis.
          </p>

          <div className="flex gap-4 text-gray-400">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg border border-white/8 hover:border-purple-500/40 hover:text-purple-500 transition"
              aria-label="Facebook"
            >
              <FaFacebook size={18} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg border border-white/8 hover:border-purple-500/40 hover:text-purple-500 transition"
              aria-label="Instagram"
            >
              <FaInstagram size={18} />
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg border border-white/8 hover:border-purple-500/40 hover:text-purple-500 transition"
              aria-label="TikTok"
            >
              <FaTiktok size={18} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-4 text-white tracking-wider">MAGAZIN</h4>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li>
              <Link href="/produse" className="hover:text-purple-400 transition">
                Toate produsele
              </Link>
            </li>
            <li>
              <Link href="/promotii" className="hover:text-purple-400 transition">
                Promoții
              </Link>
            </li>
            <li>
              <Link href="/recenzii" className="hover:text-purple-400 transition">
                Recenzii clienți
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-4 text-white tracking-wider">INFORMAȚII</h4>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li>
              <Link href="/despre-noi" className="hover:text-purple-400 transition">
                Despre noi
              </Link>
            </li>
            <li>
              <Link href="/livrare-si-plata" className="hover:text-purple-400 transition">
                Livrare și plată
              </Link>
            </li>
            <li>
              <Link href="/garantie-si-retur" className="hover:text-purple-400 transition">
                Garanție și retur
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-purple-400 transition">
                Întrebări frecvente
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-purple-400 transition">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-4 text-white tracking-wider flex items-center gap-2">
            <MessageCircle size={14} className="text-purple-500" aria-hidden />
            SUPORT RAPID
          </h4>

          <ul className="space-y-3 text-sm">
            <li>
              <a
                href={buildWhatsAppUrl(whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-400 hover:text-[#25D366] transition group"
              >
                <span className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0 group-hover:border-green-500/40 transition">
                  <MessageCircle size={14} className="text-[#25D366]" aria-hidden />
                </span>
                <span>WhatsApp</span>
              </a>
            </li>
            <li>
              <a
                href="mailto:support@novra.ro"
                className="flex items-center gap-3 text-gray-400 hover:text-purple-400 transition group"
              >
                <span className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:border-purple-500/40 transition">
                  <Mail size={14} className="text-purple-400" aria-hidden />
                </span>
                <span className="break-all">support@novra.ro</span>
              </a>
            </li>
            <li>
              <a
                href={`tel:+${whatsappNumber.replace(/\D/g, "")}`}
                className="flex items-center gap-3 text-gray-400 hover:text-purple-400 transition group"
              >
                <span className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:border-purple-500/40 transition">
                  <Phone size={14} className="text-purple-400" aria-hidden />
                </span>
                <span>{phoneDisplay}</span>
              </a>
            </li>
            <li className="flex items-center gap-3 text-gray-500 text-xs pt-1">
              <span className="w-8 h-8 rounded-lg bg-novra-card/40 border border-white/8 flex items-center justify-center shrink-0">
                <Clock size={14} className="text-purple-500/70" aria-hidden />
              </span>
              <span>L–V 08:00 – 21:00</span>
            </li>
          </ul>

          <ul className="space-y-2 text-xs text-gray-500 mt-6 pt-4 border-t border-novra-border/60">
            <li>
              <Link href="/politica-confidentialitate" className="hover:text-purple-400 transition">
                Politica de confidențialitate
              </Link>
            </li>
            <li>
              <Link href="/termeni-si-conditii" className="hover:text-purple-400 transition">
                Termeni și condiții
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-novra-border/60 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-novra-muted">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <Image src="/logo.png" alt="Logo" width={100} height={40} className="w-24 h-auto opacity-60" />
          <p>© 2026 NOVRA. Toate drepturile rezervate.</p>
        </div>
      </div>
    </footer>
  );
}

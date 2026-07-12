"use client";

import Link from "next/link";
import { Headphones, MessageCircle, Mail, HelpCircle } from "lucide-react";

import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildWhatsAppUrl } from "@/lib/store";

export default function SupportCenterView() {
  const { whatsappNumber } = useSiteSettings();
  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">Support Center</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href={buildWhatsAppUrl(whatsappNumber, "Salut! Am nevoie de ajutor cu contul meu NOVRA.")}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-4 rounded-xl border border-white/10 bg-novra-card/30 p-5 transition hover:border-purple-500/30"
        >
          <MessageCircle className="h-6 w-6 shrink-0 text-green-400" />
          <div>
            <h3 className="font-medium text-white">WhatsApp Support</h3>
            <p className="mt-1 text-sm text-gray-400">Răspuns rapid de la echipa NOVRA</p>
          </div>
        </a>

        <Link
          href="/contact"
          className="flex items-start gap-4 rounded-xl border border-white/10 bg-novra-card/30 p-5 transition hover:border-purple-500/30"
        >
          <Mail className="h-6 w-6 shrink-0 text-purple-400" />
          <div>
            <h3 className="font-medium text-white">Contact Form</h3>
            <p className="mt-1 text-sm text-gray-400">Trimite-ne un mesaj</p>
          </div>
        </Link>

        <Link
          href="/faq"
          className="flex items-start gap-4 rounded-xl border border-white/10 bg-novra-card/30 p-5 transition hover:border-purple-500/30"
        >
          <HelpCircle className="h-6 w-6 shrink-0 text-blue-400" />
          <div>
            <h3 className="font-medium text-white">FAQ</h3>
            <p className="mt-1 text-sm text-gray-400">Întrebări frecvente</p>
          </div>
        </Link>

        <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-novra-card/30 p-5">
          <Headphones className="h-6 w-6 shrink-0 text-purple-400" />
          <div>
            <h3 className="font-medium text-white">Program suport</h3>
            <p className="mt-1 text-sm text-gray-400">Luni – Vineri, 09:00 – 18:00</p>
          </div>
        </div>
      </div>
    </div>
  );
}

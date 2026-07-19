"use client";

import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import Image from "next/image";
import { Mail, Phone, Clock, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildWhatsAppUrl, formatWhatsAppDisplay } from "@/lib/store";

const legalLinkClass = "hover:text-purple-400 transition whitespace-nowrap";

export default function Footer() {
  const t = useTranslations("footer");
  const { whatsappNumber, facebookUrl, instagramUrl, tiktokUrl } = useSiteSettings();
  const phoneDisplay = formatWhatsAppDisplay(whatsappNumber);

  const socialLinks = [
    { href: facebookUrl, label: "Facebook", Icon: FaFacebook },
    { href: instagramUrl, label: "Instagram", Icon: FaInstagram },
    { href: tiktokUrl, label: "TikTok", Icon: FaTiktok },
  ].filter((item) => item.href?.trim());

  const legalLinks = [
    { href: "/politica-confidentialitate", label: t("privacy"), external: false },
    { href: "/termeni-si-conditii", label: t("terms"), external: false },
    { href: "/politica-cookies", label: t("cookies"), external: false },
    { href: "/termeni-program-afiliere", label: t("affiliateTerms"), external: false },
    { href: "https://anpc.ro/", label: t("anpc"), external: true },
    { href: "https://ec.europa.eu/consumers/odr/", label: t("odr"), external: true },
  ];

  return (
    <footer className="bg-novra-bg-alt border-t border-novra-border/60 pt-8 sm:pt-10 pb-3 max-md:pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
      <div className="site-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 lg:gap-x-8 mb-8">
          <div className="text-center sm:col-span-2 sm:flex sm:flex-col sm:items-center lg:col-span-1 lg:text-left lg:items-start">
            <div className="mb-2">
              <Image
                src="/logo.png"
                alt="NOVRA Logo"
                width={120}
                height={40}
                className="h-9 sm:h-10 w-auto mx-auto lg:mx-0"
                priority
              />
            </div>

            <p className="text-sm text-gray-400 mb-4 max-w-xs mx-auto lg:mx-0 leading-snug">{t("tagline")}</p>

            <div className="flex gap-2.5 text-gray-400 justify-center lg:justify-start">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg border border-white/8 hover:border-purple-500/40 hover:text-purple-500 transition"
                  aria-label={label}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div className="text-center sm:text-left">
            <h4 className="font-semibold text-xs mb-2.5 text-white tracking-wider uppercase">{t("shop")}</h4>
            <ul className="space-y-1.5 text-sm text-gray-400">
              <li>
                <Link href="/produse" className="hover:text-purple-400 transition">
                  {t("allProducts")}
                </Link>
              </li>
              <li>
                <Link href="/urmareste-comanda" className="hover:text-purple-400 transition">
                  {t("trackOrder")}
                </Link>
              </li>
              <li>
                <Link href="/promotii" className="hover:text-purple-400 transition">
                  {t("promotions")}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-purple-400 transition">
                  {t("blog")}
                </Link>
              </li>
              <li>
                <Link href="/recenzii" className="hover:text-purple-400 transition">
                  {t("reviews")}
                </Link>
              </li>
              <li>
                <Link href="/verificare-autenticitate" className="hover:text-purple-400 transition">
                  {t("authenticity")}
                </Link>
              </li>
              <li>
                <Link href="/harta-livrari" className="hover:text-purple-400 transition">
                  {t("deliveryMap")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-center sm:text-left">
            <h4 className="font-semibold text-xs mb-2.5 text-white tracking-wider uppercase">{t("info")}</h4>
            <ul className="space-y-1.5 text-sm text-gray-400">
              <li>
                <Link href="/despre-noi" className="hover:text-purple-400 transition">
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link href="/livrare-si-plata" className="hover:text-purple-400 transition">
                  {t("shipping")}
                </Link>
              </li>
              <li>
                <Link href="/garantie-si-retur" className="hover:text-purple-400 transition">
                  {t("warranty")}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-purple-400 transition">
                  {t("faq")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-purple-400 transition">
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link href="/program-afiliere" className="hover:text-purple-400 transition">
                  {t("affiliateProgram")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-center sm:col-span-2 sm:flex sm:flex-col sm:items-center lg:col-span-1 lg:text-left lg:items-start">
            <h4 className="font-semibold text-xs mb-2.5 text-white tracking-wider uppercase flex items-center justify-center lg:justify-start gap-1.5">
              <MessageCircle size={12} className="text-purple-500" aria-hidden />
              {t("support")}
            </h4>

            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={buildWhatsAppUrl(whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center lg:justify-start gap-2 text-gray-400 hover:text-[#25D366] transition group"
                >
                  <span className="w-6 h-6 rounded-md bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0 group-hover:border-green-500/40 transition">
                    <MessageCircle size={12} className="text-[#25D366]" aria-hidden />
                  </span>
                  <span>WhatsApp</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@novra.ro"
                  className="flex items-center justify-center lg:justify-start gap-2 text-gray-400 hover:text-purple-400 transition group"
                >
                  <span className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:border-purple-500/40 transition">
                    <Mail size={12} className="text-purple-400" aria-hidden />
                  </span>
                  <span className="break-all">support@novra.ro</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:+${whatsappNumber.replace(/\D/g, "")}`}
                  className="flex items-center justify-center lg:justify-start gap-2 text-gray-400 hover:text-purple-400 transition group"
                >
                  <span className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:border-purple-500/40 transition">
                    <Phone size={12} className="text-purple-400" aria-hidden />
                  </span>
                  <span>{phoneDisplay}</span>
                </a>
              </li>
              <li className="flex items-center justify-center lg:justify-start gap-2 text-gray-500 text-xs">
                <span className="w-6 h-6 rounded-md bg-novra-card/40 border border-white/8 flex items-center justify-center shrink-0">
                  <Clock size={12} className="text-purple-500/70" aria-hidden />
                </span>
                <span>{t("hours")}</span>
              </li>
            </ul>
          </div>
        </div>

        <nav
          aria-label={t("legalNavAria")}
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-500 mb-6 pt-4 border-t border-novra-border/60"
        >
          {legalLinks.map(({ href, label, external }) =>
            external ? (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={legalLinkClass}
              >
                {label}
              </a>
            ) : (
              <Link key={href} href={href} className={legalLinkClass}>
                {label}
              </Link>
            ),
          )}
        </nav>

        <div className="border-t border-novra-border/60 pt-3 pb-1 flex flex-col items-center justify-center gap-2 text-[11px] text-novra-muted text-center">
          <Image src="/logo.png" alt="Logo" width={100} height={40} className="w-16 h-auto opacity-60" />
          <p>{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}

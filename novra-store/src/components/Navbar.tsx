"use client";

import { useRef, useEffect } from "react";
import { Menu, MessageCircle, ShoppingCart, User } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/context/CartContext";
import MarketingTicker from "@/components/MarketingTicker";
import CountdownBanner from "@/components/CountdownBanner";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { clampHeaderHeight } from "@/lib/motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildWhatsAppUrl } from "@/lib/store";

const MOBILE_HEADER_FALLBACK = 148;
const MOBILE_NAV_TOGGLE_ID = "mobile-nav-toggle";

export default function Navbar() {
  const t = useTranslations("nav");
  const { whatsappNumber } = useSiteSettings();
  const { totalItems } = useCart();
  const headerRef = useRef<HTMLElement>(null);
  const menuToggleRef = useRef<HTMLInputElement>(null);

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/produse", label: t("products") },
    { href: "/promotii", label: t("promotions") },
    { href: "/blog", label: t("guides") },
    { href: "/urmareste-comanda", label: t("trackOrder") },
  ];

  const mobileMenuLinks = [
    { href: "/", label: t("home") },
    { href: "/produse", label: t("products") },
    { href: "/promotii", label: t("promotions") },
    { href: "/blog", label: t("guides") },
    { href: "/urmareste-comanda", label: t("trackOrder") },
    { href: "/cos", label: t("cart"), showCartCount: true },
    { href: "/contul-meu", label: t("myAccount"), icon: "user" as const },
  ];

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeight = () => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      const measured = header.offsetHeight;
      const height = clampHeaderHeight(measured > 0 ? measured : MOBILE_HEADER_FALLBACK, isMobile);
      document.documentElement.style.setProperty("--header-height", `${height}px`);
      document.documentElement.style.setProperty(
        isMobile ? "--header-height-mobile" : "--header-height-desktop",
        `${height}px`
      );
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);

    const remeasureTimers = [100, 400, 1000].map((delay) => window.setTimeout(updateHeight, delay));

    return () => {
      observer.disconnect();
      remeasureTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const closeMobileMenu = () => {
    if (menuToggleRef.current) {
      menuToggleRef.current.checked = false;
    }
  };

  return (
    <>
      <header ref={headerRef} className="fixed top-0 left-0 w-full z-[9990]">
        <MarketingTicker />
        <CountdownBanner />

        <nav className="relative z-[9991] w-full bg-novra-bg/95 border-b border-white/10">
          <div className="site-container py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
            <Link href="/" className="flex items-center shrink-0 min-w-0">
              <Image
                src="/logo.png"
                alt="NOVRA Logo"
                width={180}
                height={60}
                className="h-8 sm:h-11 md:h-12 w-auto max-w-[140px] sm:max-w-none"
                priority
              />
            </Link>

            <div className="hidden md:flex gap-6 text-sm text-gray-300">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-1 py-1.5 transition-all duration-300 hover:-translate-y-0.5 hover:text-white after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-purple-500 after:transition-all after:duration-300 hover:after:w-full"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="relative z-[10001] flex gap-2 sm:gap-4 items-center shrink-0">
              <LanguageSwitcher />

              <Link
                href="/contul-meu"
                className="hidden sm:flex items-center gap-2 text-sm text-gray-300 transition-all duration-300 hover:-translate-y-0.5 hover:text-[#8b8cff]"
              >
                <User size={18} />
                <span>{t("myAccount")}</span>
              </Link>

              <Link
                href="/cos"
                className="relative min-w-11 min-h-11 flex items-center justify-center p-1 transition-all duration-300 hover:-translate-y-0.5 hover:text-purple-500 touch-manipulation"
                aria-label={t("cartAria")}
              >
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute top-1 right-0.5 bg-purple-600 text-white text-[10px] font-bold min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </Link>

              <a
                href={buildWhatsAppUrl(whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="relative min-w-11 min-h-11 flex items-center justify-center p-1 transition-all duration-300 hover:-translate-y-0.5 hover:text-green-500 touch-manipulation"
                aria-label={t("whatsappAria")}
              >
                <MessageCircle size={20} />
              </a>

              <div className="relative z-[10001] md:hidden">
                <input
                  ref={menuToggleRef}
                  type="checkbox"
                  id={MOBILE_NAV_TOGGLE_ID}
                  className="mobile-nav-toggle peer"
                />
                <label
                  htmlFor={MOBILE_NAV_TOGGLE_ID}
                  className="relative z-[10002] cursor-pointer touch-manipulation min-w-11 min-h-11 flex items-center justify-center p-2 -mr-1 text-white hover:text-purple-500 active:text-purple-400 transition-colors duration-300 [-webkit-tap-highlight-color:transparent]"
                  aria-label={t("openMenu")}
                >
                  <Menu size={22} aria-hidden />
                </label>

                <div className="mobile-nav-overlay hidden peer-checked:block fixed inset-0 z-[10000] md:hidden">
                  <label
                    htmlFor={MOBILE_NAV_TOGGLE_ID}
                    className="absolute inset-0 bg-novra-bg/80 backdrop-blur-sm cursor-pointer [-webkit-tap-highlight-color:transparent]"
                    aria-label={t("closeMenu")}
                  />

                  <nav
                    id="mobile-nav-menu"
                    className="absolute left-0 right-0 z-[10004] bg-novra-surface border-b border-purple-500/20 shadow-2xl overflow-y-auto"
                    style={{
                      top: "var(--header-height, 148px)",
                      maxHeight: "calc(100dvh - var(--header-height, 148px))",
                    }}
                    aria-label={t("mobileNavAria")}
                  >
                    <div className="relative z-[10004] px-4 py-4 flex flex-col gap-1 pb-safe">
                      {mobileMenuLinks.map((link) => (
                        <Link
                          key={`${link.href}-${link.label}`}
                          href={link.href}
                          onClick={closeMobileMenu}
                          className="flex items-center gap-2 px-4 py-3.5 min-h-11 rounded-xl text-base text-gray-200 hover:bg-novra-card/60 hover:text-white active:bg-novra-card/80 active:text-white transition-colors touch-manipulation [-webkit-tap-highlight-color:transparent]"
                        >
                          {"icon" in link && link.icon === "user" && (
                            <User size={18} className="text-purple-400" />
                          )}
                          {link.label}
                          {"showCartCount" in link && link.showCartCount && totalItems > 0 && (
                            <span className="ml-auto text-purple-400 text-sm font-semibold">({totalItems})</span>
                          )}
                        </Link>
                      ))}
                      <LanguageSwitcher variant="mobile" />
                    </div>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <div
        className="header-spacer shrink-0"
        aria-hidden="true"
        style={{ height: "var(--header-height, 148px)" }}
      />
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import { usePathname } from "next/navigation";
import { Cookie, Shield, X, Settings2 } from "lucide-react";
import Link from "next/link";
import {
  applyConsentPreset,
  getCookieConsent,
  hasCookieConsentDecision,
  saveCookieConsent,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";
import { clearAffiliateRef } from "@/lib/affiliate-attribution";

const BOTTOM_CTA_PATHS = ["/cos", "/checkout"];

function isBottomCtaPage(pathname: string) {
  if (BOTTOM_CTA_PATHS.includes(pathname)) return true;
  return pathname.startsWith("/produse/");
}

export default function CookieConsent() {
  const pathname = usePathname();
  const mounted = useIsClient();
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [affiliate, setAffiliate] = useState(false);
  const positionTop = isBottomCtaPage(pathname);

  useEffect(() => {
    if (!mounted) return;
    if (!hasCookieConsentDecision()) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  const persistChoice = (choice: CookieConsentChoice) => {
    saveCookieConsent(choice);
    if (!choice.categories.affiliate) {
      clearAffiliateRef();
    }
    setVisible(false);
    setShowCustomize(false);
  };

  const acceptAll = () => {
    persistChoice(applyConsentPreset("all"));
  };

  const rejectOptional = () => {
    persistChoice(applyConsentPreset("essential"));
  };

  const saveCustom = () => {
    persistChoice(applyConsentPreset("custom", { analytics, affiliate }));
  };

  const openCustomize = () => {
    const existing = getCookieConsent();
    setAnalytics(existing?.categories.analytics ?? false);
    setAffiliate(existing?.categories.affiliate ?? false);
    setShowCustomize(true);
  };

  if (!mounted || !visible) return null;

  return (
    <div
      className={`fixed left-0 right-0 z-50 p-3 sm:p-4 md:p-6 animate-[slideUp_0.35s_ease-out] ${
        positionTop
          ? "top-0 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]"
          : "bottom-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
      }`}
      role="dialog"
      aria-label="Consimțământ cookie-uri"
    >
      <div className="max-w-4xl mx-auto relative overflow-hidden rounded-2xl sm:rounded-3xl border border-purple-500/30 bg-gradient-to-br from-novra-surface/95 via-novra-card/95 to-purple-950/90 backdrop-blur-xl shadow-2xl shadow-purple-900/40">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-600/15 blur-[60px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-fuchsia-500/10 blur-[50px] rounded-full pointer-events-none" />

        {!showCustomize ? (
          <div className="relative p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                <Cookie className="text-purple-400" size={22} aria-hidden />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-white mb-1.5 flex items-center gap-2">
                  Respectăm confidențialitatea ta
                  <Shield size={14} className="text-purple-400 shrink-0" aria-hidden />
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Folosim cookie-uri esențiale pentru funcționarea site-ului, cookie-uri analitice și cookie-uri
                  pentru programul de afiliere (parametrul <code className="text-purple-300">?ref=</code>).
                  Poți alege ce accepți. Citește{" "}
                  <Link href="/politica-cookies" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
                    Politica cookie-uri
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={acceptAll}
                className="w-full sm:w-40 min-h-11 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-purple-900/30 touch-manipulation"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={rejectOptional}
                className="w-full sm:w-40 min-h-11 bg-novra-elevated hover:bg-novra-border/60 border border-novra-border text-gray-200 text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-300 touch-manipulation"
              >
                Refuz
              </button>
              <button
                type="button"
                onClick={openCustomize}
                className="w-full sm:w-44 min-h-11 inline-flex items-center justify-center gap-2 border border-purple-500/30 bg-purple-600/10 text-purple-200 text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-300 hover:bg-purple-600/20 touch-manipulation"
              >
                <Settings2 size={14} />
                Personalizează
              </button>
            </div>

            <button
              type="button"
              onClick={rejectOptional}
              className="absolute top-3 right-3 min-w-11 min-h-11 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors touch-manipulation"
              aria-label="Închide"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="relative p-4 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Personalizează cookie-urile</h3>
                <p className="mt-1 text-xs text-gray-400">
                  Cookie-urile esențiale sunt mereu active. Poți activa opțional celelalte categorii.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomize(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                aria-label="Înapoi"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-novra-bg/40 p-4 opacity-80">
                <input type="checkbox" checked disabled className="mt-1 h-4 w-4 rounded" />
                <span>
                  <span className="block text-sm font-medium text-white">Esențiale</span>
                  <span className="block text-xs text-gray-400 mt-1">
                    Necesare pentru coș, autentificare și funcționarea magazinului.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-novra-bg/40 p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-novra-bg/50 text-purple-500"
                />
                <span>
                  <span className="block text-sm font-medium text-white">Analitice</span>
                  <span className="block text-xs text-gray-400 mt-1">
                    Ne ajută să înțelegem cum este folosit site-ul și să îmbunătățim experiența.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-novra-bg/40 p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={affiliate}
                  onChange={(e) => setAffiliate(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-novra-bg/50 text-purple-500"
                />
                <span>
                  <span className="block text-sm font-medium text-white">Urmărire afiliere</span>
                  <span className="block text-xs text-gray-400 mt-1">
                    Salvează codul afiliat din linkurile cu <code className="text-purple-300">?ref=</code>.
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={saveCustom}
                className="flex-1 min-h-11 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
              >
                Salvează preferințele
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="min-h-11 rounded-xl border border-white/10 px-5 py-2.5 text-sm text-gray-300 hover:text-white"
              >
                Accept toate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

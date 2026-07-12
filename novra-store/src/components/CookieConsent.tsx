"use client";

import { useState, useEffect } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import { usePathname } from "next/navigation";
import { Cookie, Shield, X } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "novra-cookies-accepted";

const BOTTOM_CTA_PATHS = ["/cos", "/checkout"];

function isBottomCtaPage(pathname: string) {
  if (BOTTOM_CTA_PATHS.includes(pathname)) return true;
  return pathname.startsWith("/produse/");
}

export default function CookieConsent() {
  const pathname = usePathname();
  const mounted = useIsClient();
  const [visible, setVisible] = useState(false);
  const positionTop = isBottomCtaPage(pathname);

  useEffect(() => {
    if (!mounted) return;
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  const accept = (type: "all" | "essential") => {
    try {
      localStorage.setItem(STORAGE_KEY, type);
    } catch {
      // Storage blocked — still dismiss banner so it does not cover UI
    }
    setVisible(false);
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
                Folosim cookie-uri esențiale pentru funcționarea site-ului și cookie-uri analitice pentru a îmbunătăți
                experiența ta de cumpărături. Poți afla mai multe în{" "}
                <Link href="/politica-confidentialitate" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
                  Politica de confidențialitate
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => accept("all")}
              className="w-full sm:w-44 min-h-11 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 active:from-purple-700 active:to-purple-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-purple-900/30 touch-manipulation"
            >
              Accept toate
            </button>
            <button
              type="button"
              onClick={() => accept("essential")}
              className="w-full sm:w-44 min-h-11 bg-novra-elevated hover:bg-novra-border/60 active:bg-novra-border/80 border border-novra-border text-gray-200 text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-300 touch-manipulation"
            >
              Doar esențiale
            </button>
          </div>

          <button
            type="button"
            onClick={() => accept("essential")}
            className="absolute top-3 right-3 min-w-11 min-h-11 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors touch-manipulation"
            aria-label="Închide"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

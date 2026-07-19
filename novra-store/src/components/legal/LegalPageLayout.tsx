"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  ChevronRight,
  Home,
  List,
  Mail,
  Printer,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link as LocaleLink } from "@/i18n/navigation";
import { fadeUp } from "@/lib/motion";
import type { LegalTocItem } from "@/lib/legal-section-id";

type LegalPageLayoutProps = {
  badge: string;
  title: string;
  titleHighlight: string;
  lastUpdated: string;
  heroIcon: LucideIcon;
  breadcrumbLabel: string;
  tocItems: LegalTocItem[];
  contactEmail?: string;
  children: ReactNode;
};

export default function LegalPageLayout({
  badge,
  title,
  titleHighlight,
  lastUpdated,
  heroIcon: HeroIcon,
  breadcrumbLabel,
  tocItems,
  contactEmail = "contact@novra.ro",
  children,
}: LegalPageLayoutProps) {
  const t = useTranslations("legalLayout");
  const tNav = useTranslations("nav");
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState(tocItems[0]?.id ?? "");
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  useEffect(() => {
    if (tocItems.length === 0) return;

    const sectionElements = tocItems
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          setActiveSectionId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    sectionElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [tocItems]);

  const handleTocClick = useCallback((id: string) => {
    setActiveSectionId(id);
    setTocOpen(false);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30 print:bg-white print:text-black">
      <div
        className="fixed top-0 inset-x-0 z-50 h-0.5 bg-purple-900/40 print:hidden"
        role="progressbar"
        aria-label={t("readingProgress")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(readingProgress)}
      >
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-[width] duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="legal-no-print">
        <Navbar />
      </div>

      <main className="site-container-narrow pb-page print:max-w-none print:px-0">
        <nav
          aria-label="Breadcrumb"
          className="pt-6 sm:pt-8 print:hidden legal-no-print"
        >
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
            <li>
              <LocaleLink
                href="/"
                className="inline-flex items-center gap-1 hover:text-purple-400 transition-colors"
              >
                <Home size={12} aria-hidden />
                {tNav("home")}
              </LocaleLink>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-gray-600" />
            </li>
            <li className="text-gray-600">{t("breadcrumbLegal")}</li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-gray-600" />
            </li>
            <li className="text-purple-400/90 font-medium truncate max-w-[200px] sm:max-w-none">
              {breadcrumbLabel}
            </li>
          </ol>
        </nav>

        <section className="relative overflow-hidden pt-6 sm:pt-10 pb-10 sm:pb-14 mb-6 sm:mb-8 print:pt-0 print:pb-6">
          <div className="absolute -top-12 right-0 h-56 w-56 rounded-full bg-purple-500/10 blur-[90px] pointer-events-none print:hidden" />
          <div className="absolute -bottom-8 left-0 h-40 w-40 rounded-full bg-purple-600/5 blur-[70px] pointer-events-none print:hidden" />

          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-3xl border border-purple-500/15 bg-gradient-to-br from-purple-950/50 via-novra-card/40 to-novra-bg/80 p-6 sm:p-10 print:border-gray-300 print:bg-white print:shadow-none"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent print:hidden" />

            <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-6">
              <div className="shrink-0 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-600/15 shadow-lg shadow-purple-950/30 print:border-gray-300 print:bg-gray-100">
                <HeroIcon size={28} className="text-purple-400 print:text-purple-700" aria-hidden />
              </div>

              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-2 text-purple-400 font-semibold tracking-[0.2em] uppercase text-xs sm:text-sm mb-3 print:text-purple-700">
                  <Sparkles size={14} aria-hidden />
                  {badge}
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-3 print:text-black">
                  {title}{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600 print:text-black print:bg-none">
                    {titleHighlight}
                  </span>
                </h1>
                <p className="text-gray-400 text-sm sm:text-base font-light max-w-2xl leading-relaxed print:text-gray-600">
                  {lastUpdated}
                </p>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="legal-no-print shrink-0 self-start inline-flex items-center gap-2 rounded-xl border border-white/10 bg-novra-bg/40 px-3 py-2 text-xs text-gray-400 hover:border-purple-500/30 hover:text-purple-300 transition-colors print:hidden"
              >
                <Printer size={14} aria-hidden />
                {t("print")}
              </button>
            </div>
          </motion.div>
        </section>

        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8 xl:gap-10">
          <aside className="legal-no-print mb-6 lg:mb-0 print:hidden">
            <div className="lg:sticky lg:top-28">
              <button
                type="button"
                onClick={() => setTocOpen((open) => !open)}
                className="lg:hidden flex w-full items-center justify-between rounded-2xl border border-white/10 bg-novra-card/40 px-4 py-3 text-sm font-medium text-white"
                aria-expanded={tocOpen}
              >
                <span className="inline-flex items-center gap-2">
                  <List size={16} className="text-purple-400" aria-hidden />
                  {t("tocToggle")}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${tocOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>

              <nav
                aria-label={t("tocTitle")}
                className={`${tocOpen ? "mt-3 block" : "hidden"} lg:block rounded-2xl border border-white/8 bg-novra-card/30 p-4`}
              >
                <p className="hidden lg:flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-purple-400 mb-4">
                  <List size={14} aria-hidden />
                  {t("tocTitle")}
                </p>

                <ul className="space-y-1 max-h-[50vh] lg:max-h-[calc(100vh-10rem)] overflow-y-auto overscroll-contain">
                  {tocItems.map((item) => {
                    const isActive = activeSectionId === item.id;

                    return (
                      <li key={item.id}>
                        <Link
                          href={`#${item.id}`}
                          onClick={() => handleTocClick(item.id)}
                          className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs leading-snug transition-colors scroll-smooth ${
                            isActive
                              ? "bg-purple-500/15 text-purple-200 border border-purple-500/20"
                              : "text-gray-400 hover:text-purple-300 hover:bg-white/5"
                          }`}
                        >
                          {item.number !== undefined && (
                            <span
                              className={`shrink-0 font-mono text-[10px] mt-0.5 ${
                                isActive ? "text-purple-400" : "text-gray-600"
                              }`}
                            >
                              {item.number}
                            </span>
                          )}
                          <span>{item.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </aside>

          <div className="min-w-0 space-y-4 sm:space-y-5">{children}</div>
        </div>

        <footer className="mt-10 sm:mt-12 pt-6 border-t border-white/8 print:border-gray-300 print:mt-8">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 print:text-gray-600">
            <Mail size={14} className="text-purple-500 shrink-0" aria-hidden />
            <span>{t("contactFooter")}</span>
            <a
              href={`mailto:${contactEmail}`}
              className="text-purple-400 hover:underline print:text-purple-700"
            >
              {contactEmail}
            </a>
          </p>
        </footer>
      </main>

      <div className="legal-no-print">
        <Footer />
      </div>
    </div>
  );
}

export type { LegalTocItem };

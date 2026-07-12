"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildWhatsAppUrl } from "@/lib/store";

export default function FloatingWhatsApp() {
  const { whatsappNumber } = useSiteSettings();
  const isMounted = useIsClient();
  const [showTooltip, setShowTooltip] = useState(false);
  const message = "Salut! Am nevoie de informații despre produsele NOVRA.";

  useEffect(() => {
    if (!isMounted) return;
    const timer = setTimeout(() => setShowTooltip(true), 6000);
    return () => clearTimeout(timer);
  }, [isMounted]);

  if (!isMounted || !whatsappNumber) return null;

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1, duration: 0.5, type: "spring" }}
      className="fixed z-[80] flex flex-col items-end gap-2 sm:gap-3 right-3 sm:right-8 bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(2rem+env(safe-area-inset-bottom,0px))]"
    >
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="hidden sm:block bg-white/90 backdrop-blur-sm text-purple-900 px-4 py-2 rounded-2xl shadow-xl text-xs font-bold max-w-[220px] text-right border border-purple-200"
          >
            Ai nevoie de ajutor? Suntem aici! 👋
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <div className="absolute -inset-2 rounded-full border-2 border-purple-500/30 animate-ping pointer-events-none" />

        <a
          href={buildWhatsAppUrl(whatsappNumber, message)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat WhatsApp cu NOVRA"
          className="relative flex items-center gap-2 sm:gap-3 bg-gradient-to-br from-purple-600 to-purple-900 text-white p-2 sm:p-2.5 sm:pr-6 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-500 hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] border border-white/10 backdrop-blur-md overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />

          <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full overflow-hidden border border-purple-300/50 shadow-inner flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="" className="w-full h-full object-contain p-[5px] sm:p-[6px]" />
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-500 border-2 border-purple-900 rounded-full z-10" />
          </div>

          <div className="hidden sm:flex flex-col overflow-hidden transition-all duration-500 min-w-0">
            <span className="font-bold text-sm tracking-wide whitespace-nowrap">Chat cu NOVRA</span>
            <span className="text-[10px] text-purple-200 uppercase tracking-widest font-medium whitespace-nowrap">
              Asistență Premium
            </span>
          </div>

          <style jsx>{`
            @keyframes shine {
              100% {
                transform: translateX(100%);
              }
            }
            .group:hover .animate-shine {
              animation: shine 0.8s ease-out;
            }
          `}</style>
        </a>
      </div>
    </motion.div>
  );
}

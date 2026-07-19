"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type LegalSectionCardProps = {
  id: string;
  sectionNum: number | string;
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  variant?: "default" | "highlight";
  className?: string;
};

export default function LegalSectionCard({
  id,
  sectionNum,
  title,
  icon: Icon,
  children,
  variant = "default",
  className = "",
}: LegalSectionCardProps) {
  const isHighlight = variant === "highlight";

  return (
    <motion.section
      id={id}
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      viewport={{ once: true, margin: "-80px" }}
      className={`scroll-mt-28 sm:scroll-mt-32 group relative overflow-hidden rounded-2xl sm:rounded-3xl border p-6 sm:p-8 transition-colors duration-300 print:break-inside-avoid print:shadow-none ${
        isHighlight
          ? "border-purple-500/25 bg-gradient-to-br from-purple-500/8 via-novra-card/50 to-transparent shadow-lg shadow-purple-950/20"
          : "border-white/8 bg-novra-card/40 hover:border-purple-500/25 hover:shadow-lg hover:shadow-purple-950/10"
      } ${className}`}
    >
      {!isHighlight && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent print:hidden"
          aria-hidden
        />
      )}
      {isHighlight && (
        <div
          className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-full bg-purple-500/10 blur-[50px] print:hidden"
          aria-hidden
        />
      )}

      <div className="relative flex items-start gap-4 mb-5">
        <div className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/25 bg-purple-600/15 shadow-inner shadow-purple-500/10">
          <Icon size={18} className="text-purple-400" aria-hidden />
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-400/80 mb-1 print:text-gray-600">
            {sectionNum}
          </p>
          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight leading-snug print:text-black">
            {title}
          </h2>
        </div>
      </div>

      <div className="relative text-gray-300 font-light leading-relaxed text-sm sm:text-base sm:pl-[3.75rem] space-y-3 print:text-gray-800">
        {children}
      </div>
    </motion.section>
  );
}

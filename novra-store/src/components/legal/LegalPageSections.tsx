"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { LEGAL_LINKS, renderRichText } from "@/lib/render-rich-text";

export type LegalSectionData = {
  title: string;
  paragraphs: string[];
  list?: string[];
};

type LegalPageSectionsProps = {
  sections: LegalSectionData[];
  icons: LucideIcon[];
  startIndex?: number;
};

export default function LegalPageSections({ sections, icons, startIndex = 1 }: LegalPageSectionsProps) {
  return (
    <>
      {sections.map((section, i) => {
        const Icon = icons[i] ?? icons[icons.length - 1];
        const sectionNum = startIndex + i;

        return (
          <motion.section
            key={section.title}
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            viewport={{ once: true }}
            className="p-6 sm:p-8 rounded-2xl border border-white/8 bg-novra-card/40 hover:border-purple-500/20 transition-colors"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
                <Icon size={18} className="text-purple-400" aria-hidden />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight pt-1.5">
                {sectionNum}. {section.title}
              </h2>
            </div>
            <div className="text-gray-300 font-light leading-relaxed text-sm sm:text-base sm:pl-14 space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{renderRichText(paragraph, LEGAL_LINKS)}</p>
              ))}
              {section.list && section.list.length > 0 && (
                <ul className="space-y-2 text-gray-400">
                  {section.list.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-2.5" />
                      <span>{renderRichText(item, LEGAL_LINKS)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.section>
        );
      })}
    </>
  );
}

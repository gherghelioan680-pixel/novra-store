"use client";

import type { LucideIcon } from "lucide-react";
import { LEGAL_LINKS, renderRichText } from "@/lib/render-rich-text";
import { legalSectionId } from "@/lib/legal-section-id";
import LegalSectionCard from "@/components/legal/LegalSectionCard";

export type LegalSectionData = {
  title: string;
  paragraphs?: string[];
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
          <LegalSectionCard
            key={section.title}
            id={legalSectionId(sectionNum)}
            sectionNum={sectionNum}
            title={section.title}
            icon={Icon}
          >
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph}>{renderRichText(paragraph, LEGAL_LINKS)}</p>
            ))}
            {section.list && section.list.length > 0 && (
              <ul className="space-y-2 text-gray-400 print:text-gray-700">
                {section.list.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500/80 print:bg-gray-500" />
                    <span>{renderRichText(item, LEGAL_LINKS)}</span>
                  </li>
                ))}
              </ul>
            )}
          </LegalSectionCard>
        );
      })}
    </>
  );
}

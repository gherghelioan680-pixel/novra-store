export function legalSectionId(sectionNum: number | string): string {
  return `legal-section-${sectionNum}`;
}

export type LegalTocItem = {
  id: string;
  title: string;
  number?: number | string;
};

export function buildLegalTocItems(
  sections: { title: string }[],
  startIndex = 1,
  extraItems: LegalTocItem[] = [],
): LegalTocItem[] {
  const mainItems = sections.map((section, index) => ({
    id: legalSectionId(startIndex + index),
    title: section.title,
    number: startIndex + index,
  }));

  return [...mainItems, ...extraItems];
}

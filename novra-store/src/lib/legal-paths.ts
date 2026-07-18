import { stripLocalePrefix } from "@/lib/locale-path";

/** Public legal pages that must stay reachable (including during Coming Soon). */
export const LEGAL_PAGE_PATHS = [
  "/politica-confidentialitate",
  "/termeni-si-conditii",
  "/politica-cookies",
  "/termeni-program-afiliere",
] as const;

export function isLegalPagePath(pathname: string): boolean {
  const path = stripLocalePrefix(pathname);
  return LEGAL_PAGE_PATHS.some((legalPath) => path === legalPath);
}

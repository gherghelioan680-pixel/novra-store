import {
  AFFILIATE_ATTRIBUTION_DAYS,
  AFFILIATE_REF_COOKIE,
  AFFILIATE_REF_STORAGE_KEY,
  AFFILIATE_REF_TIMESTAMP_KEY,
  normalizeAffiliateCode,
} from "./affiliates-types";
import { hasAffiliateConsent } from "./cookie-consent";

const ATTRIBUTION_MS = AFFILIATE_ATTRIBUTION_DAYS * 24 * 60 * 60 * 1000;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isAttributionValid(timestampMs: number): boolean {
  return Date.now() - timestampMs <= ATTRIBUTION_MS;
}

export function storeAffiliateRef(code: string): void {
  if (!isBrowser()) return;
  if (!hasAffiliateConsent()) return;

  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return;

  const now = Date.now();
  const maxAge = AFFILIATE_ATTRIBUTION_DAYS * 24 * 60 * 60;

  try {
    window.localStorage.setItem(AFFILIATE_REF_STORAGE_KEY, normalized);
    window.localStorage.setItem(AFFILIATE_REF_TIMESTAMP_KEY, String(now));
    document.cookie = `${AFFILIATE_REF_COOKIE}=${encodeURIComponent(normalized)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function getAffiliateRef(): string | null {
  if (!isBrowser()) return null;

  try {
    const code = window.localStorage.getItem(AFFILIATE_REF_STORAGE_KEY);
    const tsRaw = window.localStorage.getItem(AFFILIATE_REF_TIMESTAMP_KEY);
    if (code && tsRaw) {
      const ts = Number(tsRaw);
      if (Number.isFinite(ts) && isAttributionValid(ts)) {
        return code;
      }
      clearAffiliateRef();
      return null;
    }
  } catch {
    /* ignore */
  }

  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${AFFILIATE_REF_COOKIE}=([^;]*)`));
    if (match?.[1]) {
      const decoded = decodeURIComponent(match[1]);
      const normalized = normalizeAffiliateCode(decoded);
      if (normalized) {
        storeAffiliateRef(normalized);
        return normalized;
      }
    }
  } catch {
    /* ignore */
  }

  return null;
}

export function clearAffiliateRef(): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(AFFILIATE_REF_STORAGE_KEY);
    window.localStorage.removeItem(AFFILIATE_REF_TIMESTAMP_KEY);
    document.cookie = `${AFFILIATE_REF_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function extractRefFromSearchParams(search: string): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const ref = params.get("ref");
  if (!ref) return null;
  const normalized = normalizeAffiliateCode(ref);
  return normalized || null;
}

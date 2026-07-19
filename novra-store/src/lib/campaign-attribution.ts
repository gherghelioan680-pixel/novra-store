import {
  CAMPAIGN_ATTRIBUTION_DAYS,
  CAMPAIGN_COOKIE,
  CAMPAIGN_DISCOUNT_CODE_KEY,
  CAMPAIGN_STORAGE_KEY,
  CAMPAIGN_TIMESTAMP_KEY,
  normalizeCampaignSlug,
} from "./campaigns-types";

const ATTRIBUTION_MS = CAMPAIGN_ATTRIBUTION_DAYS * 24 * 60 * 60 * 1000;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isAttributionValid(timestampMs: number): boolean {
  return Date.now() - timestampMs <= ATTRIBUTION_MS;
}

export function storeCampaignRef(slug: string, discountCode?: string): void {
  if (!isBrowser()) return;

  const normalized = normalizeCampaignSlug(slug);
  if (!normalized) return;

  const now = Date.now();
  const maxAge = CAMPAIGN_ATTRIBUTION_DAYS * 24 * 60 * 60;

  try {
    window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, normalized);
    window.localStorage.setItem(CAMPAIGN_TIMESTAMP_KEY, String(now));
    document.cookie = `${CAMPAIGN_COOKIE}=${encodeURIComponent(normalized)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    if (discountCode?.trim()) {
      window.localStorage.setItem(CAMPAIGN_DISCOUNT_CODE_KEY, discountCode.trim().toUpperCase());
    }
  } catch {
    /* ignore */
  }
}

export function getCampaignRef(): string | null {
  if (!isBrowser()) return null;

  try {
    const slug = window.localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    const tsRaw = window.localStorage.getItem(CAMPAIGN_TIMESTAMP_KEY);
    if (slug && tsRaw) {
      const ts = Number(tsRaw);
      if (Number.isFinite(ts) && isAttributionValid(ts)) {
        return slug;
      }
      clearCampaignRef();
      return null;
    }
  } catch {
    /* ignore */
  }

  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${CAMPAIGN_COOKIE}=([^;]*)`));
    if (match?.[1]) {
      const decoded = decodeURIComponent(match[1]);
      const normalized = normalizeCampaignSlug(decoded);
      if (normalized) {
        storeCampaignRef(normalized);
        return normalized;
      }
    }
  } catch {
    /* ignore */
  }

  return null;
}

export function clearCampaignRef(): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(CAMPAIGN_STORAGE_KEY);
    window.localStorage.removeItem(CAMPAIGN_TIMESTAMP_KEY);
    window.localStorage.removeItem(CAMPAIGN_DISCOUNT_CODE_KEY);
    document.cookie = `${CAMPAIGN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function getCampaignDiscountCode(): string | null {
  if (!isBrowser()) return null;

  try {
    const code = window.localStorage.getItem(CAMPAIGN_DISCOUNT_CODE_KEY);
    return code?.trim() ? code.trim().toUpperCase() : null;
  } catch {
    return null;
  }
}

export function extractCampaignFromSearchParams(search: string): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const campaign = params.get("campaign");
  if (!campaign) return null;
  const normalized = normalizeCampaignSlug(campaign);
  return normalized || null;
}

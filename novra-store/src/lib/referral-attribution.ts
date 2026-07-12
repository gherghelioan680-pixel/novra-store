import {
  INVITE_ATTRIBUTION_DAYS,
  INVITE_COOKIE,
  INVITE_STORAGE_KEY,
  INVITE_TIMESTAMP_KEY,
  normalizeReferralCode,
} from "./referrals-types";

const ATTRIBUTION_MS = INVITE_ATTRIBUTION_DAYS * 24 * 60 * 60 * 1000;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isAttributionValid(timestampMs: number): boolean {
  return Date.now() - timestampMs <= ATTRIBUTION_MS;
}

export function storeInviteRef(code: string): void {
  if (!isBrowser()) return;

  const normalized = normalizeReferralCode(code);
  if (!normalized) return;

  const now = Date.now();
  const maxAge = INVITE_ATTRIBUTION_DAYS * 24 * 60 * 60;

  try {
    window.localStorage.setItem(INVITE_STORAGE_KEY, normalized);
    window.localStorage.setItem(INVITE_TIMESTAMP_KEY, String(now));
    document.cookie = `${INVITE_COOKIE}=${encodeURIComponent(normalized)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function getInviteRef(): string | null {
  if (!isBrowser()) return null;

  try {
    const code = window.localStorage.getItem(INVITE_STORAGE_KEY);
    const tsRaw = window.localStorage.getItem(INVITE_TIMESTAMP_KEY);
    if (code && tsRaw) {
      const ts = Number(tsRaw);
      if (Number.isFinite(ts) && isAttributionValid(ts)) {
        return code;
      }
      clearInviteRef();
      return null;
    }
  } catch {
    /* ignore */
  }

  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${INVITE_COOKIE}=([^;]*)`));
    if (match?.[1]) {
      const decoded = decodeURIComponent(match[1]);
      const normalized = normalizeReferralCode(decoded);
      if (normalized) {
        storeInviteRef(normalized);
        return normalized;
      }
    }
  } catch {
    /* ignore */
  }

  return null;
}

export function clearInviteRef(): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(INVITE_STORAGE_KEY);
    window.localStorage.removeItem(INVITE_TIMESTAMP_KEY);
    document.cookie = `${INVITE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function extractInviteFromSearchParams(search: string): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const invite = params.get("invite");
  if (!invite) return null;
  const normalized = normalizeReferralCode(invite);
  return normalized || null;
}

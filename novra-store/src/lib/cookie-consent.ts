export const COOKIE_CONSENT_STORAGE_KEY = "novra-cookie-consent";
export const COOKIE_CONSENT_COOKIE = "novra-consent";
export const COOKIE_CONSENT_VERSION = 1;

export type CookieConsentCategories = {
  essential: true;
  analytics: boolean;
  affiliate: boolean;
};

export type CookieConsentChoice = {
  version: number;
  decided: true;
  categories: CookieConsentCategories;
  timestamp: number;
};

export type CookieConsentPreset = "all" | "essential" | "custom";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function buildConsentCategories(
  analytics: boolean,
  affiliate: boolean
): CookieConsentCategories {
  return {
    essential: true,
    analytics,
    affiliate,
  };
}

export function buildConsentChoice(
  analytics: boolean,
  affiliate: boolean
): CookieConsentChoice {
  return {
    version: COOKIE_CONSENT_VERSION,
    decided: true,
    categories: buildConsentCategories(analytics, affiliate),
    timestamp: Date.now(),
  };
}

export function parseConsentChoice(raw: string | null): CookieConsentChoice | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentChoice>;
    if (parsed.version !== COOKIE_CONSENT_VERSION || !parsed.decided || !parsed.categories) {
      return null;
    }
    return {
      version: COOKIE_CONSENT_VERSION,
      decided: true,
      categories: {
        essential: true,
        analytics: Boolean(parsed.categories.analytics),
        affiliate: Boolean(parsed.categories.affiliate),
      },
      timestamp: typeof parsed.timestamp === "number" ? parsed.timestamp : Date.now(),
    };
  } catch {
    return null;
  }
}

export function getCookieConsent(): CookieConsentChoice | null {
  if (!isBrowser()) return null;

  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    const parsed = parseConsentChoice(stored);
    if (parsed) return parsed;
  } catch {
    /* ignore */
  }

  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${COOKIE_CONSENT_COOKIE}=([^;]*)`)
    );
    if (match?.[1]) {
      const decoded = decodeURIComponent(match[1]);
      return parseConsentChoice(decoded);
    }
  } catch {
    /* ignore */
  }

  return null;
}

export function hasCookieConsentDecision(): boolean {
  return getCookieConsent() !== null;
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent()?.categories.analytics === true;
}

export function hasAffiliateConsent(): boolean {
  return getCookieConsent()?.categories.affiliate === true;
}

export function saveCookieConsent(choice: CookieConsentChoice): void {
  if (!isBrowser()) return;

  const serialized = JSON.stringify(choice);

  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, serialized);
  } catch {
    /* ignore */
  }

  try {
    const maxAge = 365 * 24 * 60 * 60;
    document.cookie = `${COOKIE_CONSENT_COOKIE}=${encodeURIComponent(serialized)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function applyConsentPreset(preset: CookieConsentPreset, custom?: { analytics: boolean; affiliate: boolean }): CookieConsentChoice {
  if (preset === "all") {
    return buildConsentChoice(true, true);
  }
  if (preset === "essential") {
    return buildConsentChoice(false, false);
  }
  return buildConsentChoice(custom?.analytics ?? false, custom?.affiliate ?? false);
}

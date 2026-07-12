import { apiFetch, getApiHeaders } from "./api-client";
import { parseIsoDate } from "./datetime";
import { dispatchStoreUpdate, STORAGE_KEYS } from "./store";

export type ComingSoonSettings = {
  enabled: boolean;
  headline?: string;
  subtitle?: string;
  countdownDate?: string;
  showNewsletter?: boolean;
};

export type SiteSettings = {
  campaignEndDate: string;
  campaignActive: boolean;
  campaignDiscountText: string;
  whatsappNumber: string;
  freeShippingThreshold: number;
  deliveryCost: number;
  marketingTickerMessages: string[];
  comingSoon: ComingSoonSettings;
  /** Activează opțiunea „Plată cu cardul” (necesită STRIPE_* env vars) */
  cardPaymentEnabled: boolean;
  /** Trimite email confirmare la plasarea comenzii (necesită RESEND_API_KEY) */
  orderEmailsEnabled: boolean;
  /** Procent reducere implicit pentru codurile newsletter (NOVRA10-XXXX) */
  newsletterDiscountPercent: number;
};

export const DEFAULT_COMING_SOON: ComingSoonSettings = {
  enabled: false,
  headline: "Ceva extraordinar se apropie",
  subtitle: "Pregătim ceva special. Fii primul care află când lansăm.",
  countdownDate: "2026-08-11T23:59:59+03:00",
  showNewsletter: true,
};

export const DEFAULT_MARKETING_TICKER_MESSAGES = [
  "Livrare 24-48h în toată România",
  "Garanție 2 ani la toate produsele",
  "Plată securizată · Retur gratuit 14 zile",
  "Cabluri premium 100W Power Delivery",
  "Comandă acum — livrare rapidă",
  "Pachet Cablu + Adaptor de la 159,99 Lei",
];

const DEFAULT_SETTINGS: SiteSettings = {
  campaignEndDate: "2026-08-11T23:59:59+03:00",
  campaignActive: true,
  campaignDiscountText: "1 lună live — reduceri exclusive la produsele NOVRA",
  whatsappNumber: "40743033323",
  freeShippingThreshold: 200,
  deliveryCost: 19.99,
  marketingTickerMessages: DEFAULT_MARKETING_TICKER_MESSAGES,
  comingSoon: DEFAULT_COMING_SOON,
  cardPaymentEnabled: false,
  orderEmailsEnabled: true,
  newsletterDiscountPercent: 10,
};

function mergeComingSoon(partial?: Partial<ComingSoonSettings>): ComingSoonSettings {
  const merged: ComingSoonSettings = {
    ...DEFAULT_COMING_SOON,
    ...partial,
  };

  if (partial && "enabled" in partial) {
    merged.enabled = partial.enabled === true;
  }

  return merged;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function mergeSettings(partial: Partial<SiteSettings>): SiteSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    comingSoon: mergeComingSoon(partial.comingSoon),
    marketingTickerMessages:
      partial.marketingTickerMessages?.length
        ? partial.marketingTickerMessages
        : DEFAULT_SETTINGS.marketingTickerMessages,
  };
}

function cacheSettings(settings: SiteSettings): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export function getSiteSettings(): SiteSettings {
  if (!isBrowser()) return DEFAULT_SETTINGS;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.settings);
    if (!stored) return DEFAULT_SETTINGS;
    return mergeSettings(JSON.parse(stored) as Partial<SiteSettings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function loadSiteSettings(): Promise<SiteSettings> {
  const fromApi = await apiFetch<SiteSettings>("/api/store/settings");
  if (fromApi) {
    cacheSettings(fromApi);
    return fromApi;
  }
  return getSiteSettings();
}

export async function saveSiteSettings(
  updates: Partial<SiteSettings>
): Promise<{ ok: true; settings: SiteSettings } | { ok: false; message: string }> {
  if (!isBrowser()) {
    return { ok: false, message: "Acțiunea nu poate fi efectuată în acest moment." };
  }

  const next = mergeSettings({ ...getSiteSettings(), ...updates });

  try {
    const response = await fetch("/api/store/settings", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify(next),
    });

    if (!response.ok) {
      return { ok: false, message: "Nu s-au putut salva setările pe server." };
    }

    const saved = (await response.json()) as SiteSettings;
    cacheSettings(saved);
    dispatchStoreUpdate({ scope: "settings" });
    return { ok: true, settings: saved };
  } catch {
    return { ok: false, message: "Nu s-au putut salva setările." };
  }
}

export function getCampaignEndDate(): Date {
  return new Date(getSiteSettings().campaignEndDate);
}

export function getWhatsAppNumber(): string {
  return getSiteSettings().whatsappNumber;
}

export function getFreeShippingThreshold(): number {
  return getSiteSettings().freeShippingThreshold;
}

export function getDeliveryCost(): number {
  return getSiteSettings().deliveryCost;
}

export function isCampaignActive(): boolean {
  const settings = getSiteSettings();
  if (!settings.campaignActive) return false;
  return getCampaignEndDate().getTime() > Date.now();
}

export function getMarketingTickerMessages(): string[] {
  return getSiteSettings().marketingTickerMessages;
}

export function getComingSoonSettings(): ComingSoonSettings {
  return mergeComingSoon(getSiteSettings().comingSoon);
}

export function isComingSoonEnabled(): boolean {
  return getComingSoonSettings().enabled;
}

export function getComingSoonCountdownDate(): Date | null {
  const comingSoon = getComingSoonSettings();
  return parseIsoDate(comingSoon.countdownDate ?? getSiteSettings().campaignEndDate);
}

export { DEFAULT_SETTINGS, mergeSettings };

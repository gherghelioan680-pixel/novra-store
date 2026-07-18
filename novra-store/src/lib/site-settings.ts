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

export type LimitedOfferSettings = {
  badgeLabel: string;
  title: string;
  subtitle: string;
  countdownLabel: string;
  ctaText: string;
  ctaHref: string;
};

export const DEFAULT_LIMITED_OFFER: LimitedOfferSettings = {
  badgeLabel: "Ofertă limitată",
  title: "1 lună live",
  subtitle: "reduceri exclusive la produsele NOVRA",
  countdownLabel: "Timp rămas",
  ctaText: "Vezi ofertele",
  ctaHref: "/promotii",
};

export type SiteSettings = {
  campaignEndDate: string;
  campaignActive: boolean;
  campaignDiscountText: string;
  limitedOffer: LimitedOfferSettings;
  whatsappNumber: string;
  freeShippingThreshold: number;
  deliveryCost: number;
  marketingTickerMessages: string[];
  comingSoon: ComingSoonSettings;
  /** Activează opțiunea „Plată cu cardul” (necesită STRIPE_* env vars) */
  cardPaymentEnabled: boolean;
  /** Trimite email confirmare la plasarea comenzii (necesită EMAILS_ENABLED=true) */
  orderEmailsEnabled: boolean;
  /** Procent reducere implicit pentru codurile newsletter (NOVRA10-XXXX) */
  newsletterDiscountPercent: number;
  /** Generează automat cod NOVRA10 la abonare */
  newsletterAutoGenerateCodes: boolean;
  /** Șablon mesaj bun-venit ({code}, {percent}) */
  newsletterWelcomeMessage: string;
  /** URL-uri rețele sociale (lăsați gol pentru a ascunde iconița) */
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
};

export const DEFAULT_NEWSLETTER_WELCOME_MESSAGE =
  "Mulțumim că te-ai abonat la newsletter-ul NOVRA. Codul tău exclusiv: {code} — {percent}% reducere la prima comandă!";

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

function parseLegacyDiscountText(text: string): { title: string; subtitle: string } {
  const parts = text.split(" — ");
  return {
    title: parts[0]?.trim() || text.trim(),
    subtitle: parts.slice(1).join(" — ").trim(),
  };
}

function mergeLimitedOffer(
  partial?: Partial<LimitedOfferSettings>,
  legacyDiscountText?: string
): LimitedOfferSettings {
  const legacy = parseLegacyDiscountText(legacyDiscountText ?? DEFAULT_SETTINGS.campaignDiscountText);
  const merged: LimitedOfferSettings = {
    ...DEFAULT_LIMITED_OFFER,
    title: legacy.title,
    subtitle: legacy.subtitle,
    ...partial,
  };

  if (!merged.title.trim()) merged.title = DEFAULT_LIMITED_OFFER.title;
  if (!merged.ctaHref.startsWith("/")) merged.ctaHref = `/${merged.ctaHref.replace(/^\//, "")}`;

  return merged;
}

const DEFAULT_SETTINGS: SiteSettings = {
  campaignEndDate: "2026-08-11T23:59:59+03:00",
  campaignActive: true,
  campaignDiscountText: "1 lună live — reduceri exclusive la produsele NOVRA",
  limitedOffer: DEFAULT_LIMITED_OFFER,
  whatsappNumber: "40743033323",
  freeShippingThreshold: 200,
  deliveryCost: 19.99,
  marketingTickerMessages: DEFAULT_MARKETING_TICKER_MESSAGES,
  comingSoon: DEFAULT_COMING_SOON,
  cardPaymentEnabled: false,
  orderEmailsEnabled: false,
  newsletterDiscountPercent: 10,
  newsletterAutoGenerateCodes: true,
  newsletterWelcomeMessage: DEFAULT_NEWSLETTER_WELCOME_MESSAGE,
  facebookUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
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
  const merged = {
    ...DEFAULT_SETTINGS,
    ...partial,
    comingSoon: mergeComingSoon(partial.comingSoon),
    marketingTickerMessages:
      partial.marketingTickerMessages?.length
        ? partial.marketingTickerMessages
        : DEFAULT_SETTINGS.marketingTickerMessages,
  };

  merged.limitedOffer = mergeLimitedOffer(
    partial.limitedOffer,
    partial.campaignDiscountText ?? merged.campaignDiscountText
  );

  merged.campaignDiscountText = merged.limitedOffer.subtitle
    ? `${merged.limitedOffer.title} — ${merged.limitedOffer.subtitle}`
    : merged.limitedOffer.title;

  return merged;
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

export function getLimitedOfferSettings(): LimitedOfferSettings {
  return mergeLimitedOffer(getSiteSettings().limitedOffer, getSiteSettings().campaignDiscountText);
}

export { DEFAULT_SETTINGS, mergeSettings, mergeLimitedOffer };

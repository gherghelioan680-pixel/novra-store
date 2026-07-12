export type CampaignTheme = "purple" | "black" | "red" | "pink" | "orange";

export type LandingCampaign = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  heroText: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  active: boolean;
  theme: CampaignTheme;
  ctaText: string;
  ctaLink: string;
  createdAt: string;
  updatedAt: string;
};

export const CAMPAIGN_STORAGE_FILE = "campaigns.json";
export const CAMPAIGN_COOKIE = "novra_campaign";
export const CAMPAIGN_STORAGE_KEY = "novra-campaign-slug";
export const CAMPAIGN_TIMESTAMP_KEY = "novra-campaign-ts";
export const CAMPAIGN_ATTRIBUTION_DAYS = 30;

export const CAMPAIGN_THEME_STYLES: Record<
  CampaignTheme,
  { gradient: string; accent: string; badge: string }
> = {
  purple: {
    gradient: "from-purple-950 via-purple-900 to-violet-950",
    accent: "text-purple-300",
    badge: "from-purple-600 to-violet-600",
  },
  black: {
    gradient: "from-gray-950 via-black to-gray-900",
    accent: "text-gray-300",
    badge: "from-gray-700 to-black",
  },
  red: {
    gradient: "from-red-950 via-red-900 to-orange-950",
    accent: "text-red-300",
    badge: "from-red-600 to-orange-600",
  },
  pink: {
    gradient: "from-pink-950 via-rose-900 to-purple-950",
    accent: "text-pink-300",
    badge: "from-pink-600 to-rose-600",
  },
  orange: {
    gradient: "from-orange-950 via-amber-900 to-red-950",
    accent: "text-orange-300",
    badge: "from-orange-600 to-amber-600",
  },
};

export const DEFAULT_CAMPAIGN_TEMPLATES: Omit<LandingCampaign, "id" | "createdAt" | "updatedAt">[] = [
  {
    slug: "black-friday",
    title: "Black Friday NOVRA",
    subtitle: "Reduceri masive la cabluri premium",
    heroText:
      "Profită de cele mai mari reduceri ale anului la produsele NOVRA. Stoc limitat — nu rata ocazia!",
    discountPercent: 25,
    startDate: "2026-11-24T00:00:00+02:00",
    endDate: "2026-11-30T23:59:59+02:00",
    active: false,
    theme: "black",
    ctaText: "Vezi ofertele",
    ctaLink: "/produse",
  },
  {
    slug: "valentines",
    title: "Valentine's Day",
    subtitle: "Cadoul perfect pentru cei dragi",
    heroText:
      "Surprinde-i cu accesorii premium NOVRA — design elegant, încărcare rapidă, livrare în 24-48h.",
    discountPercent: 15,
    startDate: "2026-02-01T00:00:00+02:00",
    endDate: "2026-02-14T23:59:59+02:00",
    active: false,
    theme: "pink",
    ctaText: "Alege cadoul",
    ctaLink: "/produse",
  },
  {
    slug: "flash-sale",
    title: "Flash Sale",
    subtitle: "Ofertă fulger — 48 de ore",
    heroText:
      "Reduceri exclusive disponibile doar pentru o perioadă scurtă. Comandă acum înainte să se epuizeze stocul!",
    discountPercent: 20,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    active: false,
    theme: "orange",
    ctaText: "Profită acum",
    ctaLink: "/produse",
  },
];

export function normalizeCampaignSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isCampaignCurrentlyActive(campaign: LandingCampaign, now = Date.now()): boolean {
  if (!campaign.active) return false;
  const start = new Date(campaign.startDate).getTime();
  const end = new Date(campaign.endDate).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return now >= start && now <= end;
}

export function getActiveCampaigns(campaigns: LandingCampaign[], now = Date.now()): LandingCampaign[] {
  return campaigns.filter((c) => isCampaignCurrentlyActive(c, now));
}

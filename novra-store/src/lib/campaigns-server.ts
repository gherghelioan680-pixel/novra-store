import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import {
  CAMPAIGN_COOKIE,
  CAMPAIGN_STORAGE_FILE,
  DEFAULT_CAMPAIGN_TEMPLATES,
  getActiveCampaigns,
  isCampaignCurrentlyActive,
  normalizeCampaignSlug,
  type LandingCampaign,
} from "@/lib/campaigns-types";

function nowIso(): string {
  return new Date().toISOString();
}

function buildCampaignId(): string {
  return `camp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function seedTemplates(): LandingCampaign[] {
  const ts = nowIso();
  return DEFAULT_CAMPAIGN_TEMPLATES.map((template) => ({
    ...template,
    id: buildCampaignId(),
    createdAt: ts,
    updatedAt: ts,
  }));
}

export async function readCampaigns(): Promise<LandingCampaign[]> {
  const stored = await readJsonFile<LandingCampaign[]>(CAMPAIGN_STORAGE_FILE, []);
  if (stored.length === 0) {
    const seeded = seedTemplates();
    await writeJsonFile(CAMPAIGN_STORAGE_FILE, seeded);
    return seeded;
  }
  return stored;
}

export async function writeCampaigns(campaigns: LandingCampaign[]): Promise<void> {
  await writeJsonFile(CAMPAIGN_STORAGE_FILE, campaigns);
}

export async function findCampaignBySlug(slug: string): Promise<LandingCampaign | null> {
  const normalized = normalizeCampaignSlug(slug);
  const campaigns = await readCampaigns();
  return campaigns.find((c) => c.slug === normalized) ?? null;
}

export async function getActiveCampaignsServer(): Promise<LandingCampaign[]> {
  const campaigns = await readCampaigns();
  return getActiveCampaigns(campaigns);
}

export async function getPrimaryActiveCampaign(): Promise<LandingCampaign | null> {
  const active = await getActiveCampaignsServer();
  if (!active.length) return null;
  return active.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )[0];
}

export async function upsertCampaign(
  input: Partial<LandingCampaign> & { slug: string }
): Promise<{ ok: true; campaign: LandingCampaign } | { ok: false; message: string }> {
  const slug = normalizeCampaignSlug(input.slug);
  if (!slug) return { ok: false, message: "Slug invalid." };

  const campaigns = await readCampaigns();
  const index = input.id ? campaigns.findIndex((c) => c.id === input.id) : -1;
  const slugConflict = campaigns.findIndex((c) => c.slug === slug && c.id !== input.id);

  if (slugConflict !== -1) {
    return { ok: false, message: "Există deja o campanie cu acest slug." };
  }

  const ts = nowIso();
  const existing = index !== -1 ? campaigns[index] : null;

  const campaign: LandingCampaign = {
    id: existing?.id ?? input.id ?? buildCampaignId(),
    slug,
    title: input.title?.trim() || existing?.title || slug,
    subtitle: input.subtitle?.trim() ?? existing?.subtitle ?? "",
    heroText: input.heroText?.trim() ?? existing?.heroText ?? "",
    discountPercent: Math.min(100, Math.max(0, input.discountPercent ?? existing?.discountPercent ?? 0)),
    startDate: input.startDate ?? existing?.startDate ?? ts,
    endDate: input.endDate ?? existing?.endDate ?? ts,
    active: input.active ?? existing?.active ?? false,
    theme: input.theme ?? existing?.theme ?? "purple",
    ctaText: input.ctaText?.trim() || existing?.ctaText || "Vezi ofertele",
    ctaLink: input.ctaLink?.trim() || existing?.ctaLink || "/produse",
    featuredImage: input.featuredImage?.trim() || existing?.featuredImage || undefined,
    discountCode: input.discountCode?.trim().toUpperCase() || existing?.discountCode || undefined,
    featured: input.featured ?? existing?.featured ?? false,
    linkedProducts: input.linkedProducts ?? existing?.linkedProducts ?? undefined,
    createdAt: existing?.createdAt ?? ts,
    updatedAt: ts,
  };

  if (index !== -1) {
    campaigns[index] = campaign;
  } else {
    campaigns.unshift(campaign);
  }

  await writeCampaigns(campaigns);
  return { ok: true, campaign };
}

export async function deleteCampaign(
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const campaigns = await readCampaigns();
  const filtered = campaigns.filter((c) => c.id !== id);
  if (filtered.length === campaigns.length) {
    return { ok: false, message: "Campania nu a fost găsită." };
  }
  await writeCampaigns(filtered);
  return { ok: true };
}

export function getCampaignDiscountForOrder(
  campaign: LandingCampaign | null,
  subtotal: number
): { percent: number; amount: number } {
  if (!campaign || !isCampaignCurrentlyActive(campaign)) {
    return { percent: 0, amount: 0 };
  }
  const percent = campaign.discountPercent;
  const amount = Math.round(subtotal * (percent / 100) * 100) / 100;
  return { percent, amount };
}

export function getCampaignRefFromRequest(request: { cookies: { get: (name: string) => { value: string } | undefined } }): string | null {
  const raw = request.cookies.get(CAMPAIGN_COOKIE)?.value;
  if (!raw) return null;
  const slug = normalizeCampaignSlug(decodeURIComponent(raw));
  return slug || null;
}

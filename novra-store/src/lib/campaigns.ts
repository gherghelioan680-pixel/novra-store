import { apiFetch, getApiHeaders } from "./api-client";
import { dispatchStoreUpdate } from "./store";
import type { LandingCampaign } from "./campaigns-types";

export async function loadCampaigns(): Promise<LandingCampaign[]> {
  const data = await apiFetch<{ campaigns: LandingCampaign[] }>("/api/store/campaigns");
  return data?.campaigns ?? [];
}

export async function loadActiveCampaigns(): Promise<LandingCampaign[]> {
  const data = await apiFetch<{ campaigns: LandingCampaign[] }>("/api/store/campaigns?active=1");
  return data?.campaigns ?? [];
}

export async function loadCampaignBySlug(slug: string): Promise<LandingCampaign | null> {
  const data = await apiFetch<{ campaign: LandingCampaign | null }>(
    `/api/store/campaigns?slug=${encodeURIComponent(slug)}`
  );
  return data?.campaign ?? null;
}

export async function saveCampaignAdmin(
  campaign: Partial<LandingCampaign> & { slug: string }
): Promise<{ ok: true; campaign: LandingCampaign } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/campaigns", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "upsert", campaign }),
    });
    const data = (await response.json()) as {
      ok?: boolean;
      campaign?: LandingCampaign;
      message?: string;
    };
    if (!response.ok || !data.ok || !data.campaign) {
      return { ok: false, message: data.message ?? "Nu s-a putut salva campania." };
    }
    dispatchStoreUpdate({ scope: "campaigns" });
    return { ok: true, campaign: data.campaign };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function deleteCampaignAdmin(
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/campaigns", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "delete", id }),
    });
    const data = (await response.json()) as { ok?: boolean; message?: string };
    if (!response.ok || !data.ok) {
      return { ok: false, message: data.message ?? "Nu s-a putut șterge campania." };
    }
    dispatchStoreUpdate({ scope: "campaigns" });
    return { ok: true };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

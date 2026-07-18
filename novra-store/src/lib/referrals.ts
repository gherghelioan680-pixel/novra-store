import { apiFetch, getApiHeaders } from "./api-client";
import { dispatchStoreUpdate } from "./store";
import type { FriendReferral, ReferralSettings } from "./referrals-types";
import { buildInviteLink } from "./referrals-types";

export type ReferralUserData = {
  referralCode: string;
  inviteLink: string;
  referrals: FriendReferral[];
  settings: ReferralSettings;
};

export async function loadReferralData(): Promise<ReferralUserData | null> {
  const data = await apiFetch<ReferralUserData>("/api/store/referrals");
  return data;
}

export async function loadReferralsAdmin(): Promise<{
  referrals: FriendReferral[];
  settings: ReferralSettings;
  stats: { total: number; registered: number; converted: number; pendingRewards: number };
} | null> {
  const data = await apiFetch<{
    referrals: FriendReferral[];
    settings: ReferralSettings;
    stats: { total: number; registered: number; converted: number; pendingRewards: number };
  }>("/api/store/referrals?scope=admin");
  return data;
}

export async function saveReferralSettingsAdmin(
  settings: ReferralSettings
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/referrals", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "update-settings", settings }),
    });
    const data = (await response.json()) as { ok?: boolean; message?: string };
    if (!response.ok || !data.ok) {
      return { ok: false, message: data.message ?? "Nu s-au putut salva setările." };
    }
    dispatchStoreUpdate({ scope: "referrals" });
    return { ok: true };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function updateReferralAdmin(
  referralId: string,
  updates: Partial<Pick<FriendReferral, "referrerEmail" | "refereeEmail" | "referrerRewarded" | "refereeRewarded">>
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/referrals", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "update-referral", referralId, ...updates }),
    });
    const data = (await response.json()) as { ok?: boolean; message?: string };
    if (!response.ok || !data.ok) {
      return { ok: false, message: data.message ?? "Actualizare eșuată." };
    }
    dispatchStoreUpdate({ scope: "referrals" });
    return { ok: true };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function deleteReferralAdmin(
  referralId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/referrals", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "delete-referral", referralId }),
    });
    const data = (await response.json()) as { ok?: boolean; message?: string };
    if (!response.ok || !data.ok) {
      return { ok: false, message: data.message ?? "Ștergere eșuată." };
    }
    dispatchStoreUpdate({ scope: "referrals" });
    return { ok: true };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export function getInviteLinkForCode(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://novra.ro";
  return buildInviteLink(code, origin);
}

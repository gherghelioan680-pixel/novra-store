import { apiFetch, getApiHeaders } from "./api-client";
import { dispatchStoreUpdate } from "./store";
import type {
  Affiliate,
  AffiliateApplication,
  AffiliatePayout,
  AffiliateReferral,
  AffiliateRequirements,
  AffiliateStatus,
} from "./affiliates-types";

export type AffiliateDashboardData = {
  affiliate: Affiliate | null;
  application: AffiliateApplication | null;
  referrals: AffiliateReferral[];
  payouts: AffiliatePayout[];
  availableBalance: number;
};

export async function loadAffiliateDashboard(): Promise<AffiliateDashboardData | null> {
  const data = await apiFetch<AffiliateDashboardData>("/api/store/affiliates?scope=own");
  return data;
}

export async function loadAffiliatesAdmin(): Promise<{
  affiliates: Affiliate[];
  applications: AffiliateApplication[];
  referrals: AffiliateReferral[];
  payouts: AffiliatePayout[];
} | null> {
  return apiFetch("/api/store/affiliates?scope=admin");
}

export async function trackAffiliateClick(code: string): Promise<void> {
  try {
    await fetch("/api/store/affiliates/click", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ code }),
    });
  } catch {
    /* ignore */
  }
}

export async function submitAffiliateApplication(input: {
  name: string;
  requirements: Partial<AffiliateRequirements>;
}): Promise<{ ok: true; application: AffiliateApplication } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/affiliates", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "apply", ...input }),
    });
    const data = (await response.json()) as {
      application?: AffiliateApplication;
      message?: string;
      error?: string;
    };
    if (!response.ok) {
      return { ok: false, message: data.message ?? data.error ?? "Cererea nu a putut fi trimisă." };
    }
    dispatchStoreUpdate({ scope: "affiliates" });
    return { ok: true, application: data.application! };
  } catch {
    return { ok: false, message: "Eroare de rețea. Încearcă din nou." };
  }
}

export async function createAffiliateAdmin(input: {
  userEmail: string;
  name: string;
  code?: string;
  status?: AffiliateStatus;
  commissionRate?: number;
  fixedCommission?: number;
  adminNote?: string;
}): Promise<{ ok: true; affiliate: Affiliate } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/affiliates", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "create", ...input }),
    });
    const data = (await response.json()) as { affiliate?: Affiliate; message?: string; error?: string };
    if (!response.ok) {
      return { ok: false, message: data.message ?? data.error ?? "Nu s-a putut crea afiliatul." };
    }
    dispatchStoreUpdate({ scope: "affiliates" });
    return { ok: true, affiliate: data.affiliate! };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function updateAffiliateAdmin(
  affiliateId: string,
  updates: Partial<Pick<Affiliate, "name" | "code" | "status" | "commissionRate" | "fixedCommission" | "adminNote">>
): Promise<{ ok: true; affiliate: Affiliate } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/affiliates", {
      method: "PATCH",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "update", affiliateId, ...updates }),
    });
    const data = (await response.json()) as { affiliate?: Affiliate; message?: string; error?: string };
    if (!response.ok) {
      return { ok: false, message: data.message ?? data.error ?? "Actualizare eșuată." };
    }
    dispatchStoreUpdate({ scope: "affiliates" });
    return { ok: true, affiliate: data.affiliate! };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function reviewApplicationAdmin(input: {
  applicationId: string;
  status: "approved" | "rejected";
  adminNote?: string;
  commissionRate?: number;
  fixedCommission?: number;
  customCode?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/affiliates", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "review-application", ...input }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      return { ok: false, message: data.message ?? data.error ?? "Procesare eșuată." };
    }
    dispatchStoreUpdate({ scope: "affiliates" });
    return { ok: true };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function markReferralPaidAdmin(
  referralId: string,
  options?: { commission?: number; adminNote?: string }
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/affiliates", {
      method: "PATCH",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "mark-paid", referralId, ...options }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      return { ok: false, message: data.message ?? data.error ?? "Marcaj eșuat." };
    }
    dispatchStoreUpdate({ scope: "affiliates" });
    return { ok: true };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function adjustReferralCommissionAdmin(
  referralId: string,
  commission: number,
  adminNote?: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/affiliates", {
      method: "PATCH",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "adjust-commission", referralId, commission, adminNote }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      return { ok: false, message: data.message ?? data.error ?? "Ajustare eșuată." };
    }
    dispatchStoreUpdate({ scope: "affiliates" });
    return { ok: true };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function deleteAffiliateAdmin(
  affiliateId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/affiliates", {
      method: "DELETE",
      headers: getApiHeaders(),
      body: JSON.stringify({ affiliateId }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      return { ok: false, message: data.message ?? data.error ?? "Ștergere eșuată." };
    }
    dispatchStoreUpdate({ scope: "affiliates" });
    return { ok: true };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function submitAffiliatePayout(input: {
  beneficiaryName: string;
  iban?: string;
  cardNumber?: string;
  bankName?: string;
  amount: number;
  confirmed: boolean;
}): Promise<{ ok: true; payout: AffiliatePayout } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/affiliates/payouts", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify(input),
    });
    const data = (await response.json()) as {
      payout?: AffiliatePayout;
      message?: string;
      error?: string;
    };
    if (!response.ok) {
      return { ok: false, message: data.message ?? data.error ?? "Cererea nu a putut fi trimisă." };
    }
    dispatchStoreUpdate({ scope: "affiliates" });
    return { ok: true, payout: data.payout! };
  } catch {
    return { ok: false, message: "Eroare de rețea. Încearcă din nou." };
  }
}

export async function updatePayoutStatusAdmin(
  payoutId: string,
  status: "paid" | "rejected",
  adminNote?: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/affiliates/payouts", {
      method: "PATCH",
      headers: getApiHeaders(),
      body: JSON.stringify({ payoutId, status, adminNote }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      return { ok: false, message: data.message ?? data.error ?? "Actualizare eșuată." };
    }
    dispatchStoreUpdate({ scope: "affiliates" });
    return { ok: true };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export { generateAffiliateCode } from "./affiliates-types";

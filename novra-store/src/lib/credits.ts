import { apiFetch, getApiHeaders } from "./api-client";
import { dispatchStoreUpdate } from "./store";
import type { CreditPurchase, CreditTransaction } from "./credits-types";

export { GIFT_CARD_AMOUNTS, type GiftCardAmount } from "./credits-types";

export type CreditPurchaseClient = CreditPurchase;
export type CreditTransactionClient = CreditTransaction;

export const CREDIT_TRANSACTION_LABELS: Record<CreditTransaction["type"], string> = {
  purchase: "Achiziție Gift Card",
  spend: "Plată comandă",
  admin_adjust: "Ajustare admin",
  signup_bonus: "Bonus înregistrare",
  profile_bonus: "Bonus profil complet",
  revoke: "Revocare credite",
};

export async function loadCreditTransactions(): Promise<CreditTransactionClient[]> {
  const data = await apiFetch<{ transactions: CreditTransactionClient[] }>("/api/store/credits");
  return data?.transactions ?? [];
}

export async function loadCreditPurchases(): Promise<CreditPurchaseClient[]> {
  const data = await apiFetch<{ purchases: CreditPurchaseClient[] }>(
    "/api/store/credits?purchases=1"
  );
  return data?.purchases ?? [];
}

export async function loadAllCreditPurchasesAdmin(): Promise<CreditPurchaseClient[]> {
  const data = await apiFetch<{ purchases: CreditPurchaseClient[] }>(
    "/api/store/credits?all=1"
  );
  return data?.purchases ?? [];
}

export async function createCreditPurchaseCheckout(
  amount: number
): Promise<{ ok: true; url: string; purchaseId: string } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/credits/purchase", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ amount }),
    });
    const data = (await response.json()) as {
      url?: string;
      purchaseId?: string;
      error?: string;
      message?: string;
    };

    if (!response.ok || !data.url) {
      return { ok: false, message: data.error ?? data.message ?? "Nu s-a putut inițializa plata." };
    }

    return { ok: true, url: data.url, purchaseId: data.purchaseId ?? "" };
  } catch {
    return { ok: false, message: "Eroare de rețea. Încearcă din nou." };
  }
}

export async function verifyCreditPurchaseSession(
  sessionId: string
): Promise<{
  ok: boolean;
  credited?: boolean;
  amount?: number;
  alreadyProcessed?: boolean;
  message?: string;
}> {
  try {
    const response = await fetch(
      `/api/store/stripe/verify-credit-session?session_id=${encodeURIComponent(sessionId)}`,
      { cache: "no-store" }
    );
    return (await response.json()) as {
      ok: boolean;
      credited?: boolean;
      amount?: number;
      alreadyProcessed?: boolean;
      message?: string;
    };
  } catch {
    return { ok: false, message: "Verificarea plății a eșuat." };
  }
}

export async function adminManualCreditPurchase(
  purchaseId: string,
  reason?: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    const response = await fetch("/api/store/credits", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "manual_credit", purchaseId, reason }),
    });
    const data = (await response.json()) as { ok?: boolean; message?: string; error?: string };
    if (!response.ok || !data.ok) {
      return { ok: false, message: data.message ?? data.error ?? "Eroare." };
    }
    dispatchStoreUpdate({ scope: "credits" });
    dispatchStoreUpdate({ scope: "users" });
    return { ok: true };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function adminRevokeCreditPurchase(
  purchaseId: string,
  reason?: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    const response = await fetch("/api/store/credits", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "revoke", purchaseId, reason }),
    });
    const data = (await response.json()) as { ok?: boolean; message?: string; error?: string };
    if (!response.ok || !data.ok) {
      return { ok: false, message: data.message ?? data.error ?? "Eroare." };
    }
    dispatchStoreUpdate({ scope: "credits" });
    dispatchStoreUpdate({ scope: "users" });
    return { ok: true };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

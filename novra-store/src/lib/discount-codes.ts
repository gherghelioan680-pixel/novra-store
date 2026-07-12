import { apiFetch, getApiHeaders } from "./api-client";
import { dispatchStoreUpdate, STORAGE_KEYS } from "./store";

export type DiscountCodeType = "percent" | "fixed";
export type DiscountCodeSource = "newsletter" | "admin";

export type DiscountCode = {
  code: string;
  type: DiscountCodeType;
  value: number;
  /** Reducere procentuală/fixă la subtotal produse (implicit: true). */
  applyToProducts?: boolean;
  /** Livrare gratuită când codul este valid (implicit: false). */
  freeShipping?: boolean;
  used: boolean;
  usedBy?: string;
  usedAt?: string;
  email?: string;
  maxUses?: number;
  useCount?: number;
  usedByEmails?: string[];
  expiresAt?: string;
  active: boolean;
  singleUsePerEmail?: boolean;
  source: DiscountCodeSource;
  createdAt: string;
  orderId?: string;
};

export type AppliedDiscount = {
  code: string;
  type: DiscountCodeType;
  value: number;
  applyToProducts?: boolean;
  freeShipping?: boolean;
};

export function discountAppliesToProducts(
  code: Pick<DiscountCode, "applyToProducts">
): boolean {
  return code.applyToProducts !== false;
}

export function discountIncludesFreeShipping(
  code: Pick<DiscountCode, "freeShipping">
): boolean {
  return code.freeShipping === true;
}

export function formatDiscountOptions(
  code: Pick<DiscountCode, "applyToProducts" | "freeShipping">
): string {
  const parts: string[] = [];
  if (discountAppliesToProducts(code)) parts.push("Produse");
  if (discountIncludesFreeShipping(code)) parts.push("Livrare gratuită");
  return parts.length > 0 ? parts.join(" + ") : "—";
}

export const NEWSLETTER_DISCOUNT_PERCENT = 10;
export const NEWSLETTER_DISCOUNT_PREFIX = "NOVRA10";
export const ADMIN_DISCOUNT_PREFIX = "NOVRA";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateDiscountCodeSuffix(length = 6): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return result;
}

export function generateNewsletterDiscountCode(existingCodes: string[] = []): string {
  const existingSet = new Set(existingCodes.map((c) => c.toUpperCase()));
  for (let attempt = 0; attempt < 100; attempt++) {
    const code = `${NEWSLETTER_DISCOUNT_PREFIX}-${generateDiscountCodeSuffix()}`;
    if (!existingSet.has(code)) return code;
  }
  return `${NEWSLETTER_DISCOUNT_PREFIX}-${generateDiscountCodeSuffix(8)}`;
}

export function generateAdminDiscountCode(existingCodes: string[] = []): string {
  const existingSet = new Set(existingCodes.map((c) => c.toUpperCase()));
  for (let attempt = 0; attempt < 100; attempt++) {
    const code = `${ADMIN_DISCOUNT_PREFIX}-${generateDiscountCodeSuffix()}`;
    if (!existingSet.has(code)) return code;
  }
  return `${ADMIN_DISCOUNT_PREFIX}-${generateDiscountCodeSuffix(8)}`;
}

export function formatDiscountValue(type: DiscountCodeType, value: number): string {
  return type === "percent" ? `${value}%` : `${value} RON`;
}

export function formatDiscountSuccessMessage(
  code: string,
  type: DiscountCodeType = "percent",
  value = NEWSLETTER_DISCOUNT_PERCENT
): string {
  return `Codul tău: ${code} — ${formatDiscountValue(type, value)} reducere la prima comandă!`;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function cacheDiscountCodes(codes: DiscountCode[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.discountCodes, JSON.stringify(codes));
  } catch {
    /* ignore */
  }
}

export function getStoredDiscountCodes(): DiscountCode[] {
  if (!isBrowser()) return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.discountCodes);
    if (!stored) return [];
    return JSON.parse(stored) as DiscountCode[];
  } catch {
    return [];
  }
}

export async function loadDiscountCodes(): Promise<DiscountCode[]> {
  const fromApi = await apiFetch<{ codes: DiscountCode[] }>("/api/store/discount-codes");
  if (fromApi?.codes) {
    cacheDiscountCodes(fromApi.codes);
    return fromApi.codes;
  }
  return getStoredDiscountCodes();
}

export async function validateDiscountCode(
  code: string,
  email?: string
): Promise<{ ok: true; discount: AppliedDiscount } | { ok: false; message: string }> {
  if (!isBrowser()) {
    return { ok: false, message: "Validarea nu este disponibilă acum." };
  }

  const trimmed = code.trim().toUpperCase();
  if (!trimmed) {
    return { ok: false, message: "Introdu un cod de reducere." };
  }

  try {
    const response = await fetch("/api/store/discount-codes", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        action: "validate",
        code: trimmed,
        email: email?.trim().toLowerCase(),
      }),
    });

    const data = (await response.json()) as {
      valid?: boolean;
      type?: DiscountCodeType;
      value?: number;
      code?: string;
      applyToProducts?: boolean;
      freeShipping?: boolean;
      message?: string;
    };

    if (!response.ok || !data.valid) {
      return { ok: false, message: data.message ?? "Cod invalid." };
    }

    return {
      ok: true,
      discount: {
        code: data.code ?? trimmed,
        type: data.type ?? "percent",
        value: data.value ?? NEWSLETTER_DISCOUNT_PERCENT,
        applyToProducts: data.applyToProducts,
        freeShipping: data.freeShipping,
      },
    };
  } catch {
    return { ok: false, message: "Nu s-a putut valida codul. Încearcă din nou." };
  }
}

export function calculateDiscountAmount(
  subtotal: number,
  discount: Pick<AppliedDiscount, "type" | "value">
): number {
  if (discount.type === "fixed") {
    return Math.min(subtotal, Math.round(discount.value * 100) / 100);
  }
  return Math.round(subtotal * (discount.value / 100) * 100) / 100;
}

export type CreateDiscountCodeInput = {
  code: string;
  type: DiscountCodeType;
  value: number;
  applyToProducts?: boolean;
  freeShipping?: boolean;
  maxUses?: number;
  expiresAt?: string;
  singleUsePerEmail?: boolean;
  active?: boolean;
};

export async function createDiscountCode(
  input: CreateDiscountCodeInput
): Promise<{ ok: true; code: DiscountCode } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/discount-codes", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "create", ...input }),
    });
    const data = (await response.json()) as { ok?: boolean; code?: DiscountCode; message?: string; error?: string };
    if (!response.ok || !data.ok || !data.code) {
      return { ok: false, message: data.message ?? data.error ?? "Nu s-a putut crea codul." };
    }
    dispatchStoreUpdate({ scope: "discountCodes" });
    return { ok: true, code: data.code };
  } catch {
    return { ok: false, message: "Nu s-a putut crea codul. Încearcă din nou." };
  }
}

export async function deleteDiscountCode(
  code: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/discount-codes", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "delete", code }),
    });
    const data = (await response.json()) as { ok?: boolean; message?: string; error?: string };
    if (!response.ok || !data.ok) {
      return { ok: false, message: data.message ?? data.error ?? "Nu s-a putut șterge codul." };
    }
    dispatchStoreUpdate({ scope: "discountCodes" });
    return { ok: true };
  } catch {
    return { ok: false, message: "Nu s-a putut șterge codul. Încearcă din nou." };
  }
}

import { apiFetch, getApiHeaders } from "./api-client";
import { dispatchStoreUpdate, STORAGE_KEYS } from "./store";

export type DiscountCode = {
  code: string;
  email: string;
  percentOff: number;
  singleUse: boolean;
  used: boolean;
  usedAt?: string;
  orderId?: string;
  createdAt: string;
  source: "newsletter" | "manual";
};

export const NEWSLETTER_DISCOUNT_PERCENT = 10;
export const NEWSLETTER_DISCOUNT_PREFIX = "NOVRA10";

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

export function formatDiscountSuccessMessage(
  code: string,
  percentOff = NEWSLETTER_DISCOUNT_PERCENT
): string {
  return `Codul tău: ${code} — ${percentOff}% reducere la prima comandă!`;
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
  code: string
): Promise<
  | { ok: true; percentOff: number; code: string }
  | { ok: false; message: string }
> {
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
      body: JSON.stringify({ action: "validate", code: trimmed }),
    });

    const data = (await response.json()) as {
      valid?: boolean;
      percentOff?: number;
      code?: string;
      message?: string;
    };

    if (!response.ok || !data.valid) {
      return { ok: false, message: data.message ?? "Cod invalid sau expirat." };
    }

    return { ok: true, percentOff: data.percentOff ?? NEWSLETTER_DISCOUNT_PERCENT, code: data.code ?? trimmed };
  } catch {
    return { ok: false, message: "Nu s-a putut valida codul. Încearcă din nou." };
  }
}

export function calculateDiscountAmount(subtotal: number, percentOff: number): number {
  return Math.round(subtotal * (percentOff / 100) * 100) / 100;
}

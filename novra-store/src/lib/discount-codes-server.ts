import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import {
  generateNewsletterDiscountCode,
  discountAppliesToProducts,
  discountIncludesFreeShipping,
  type CreateDiscountCodeInput,
  type DiscountCode,
  type DiscountCodeType,
} from "@/lib/discount-codes";
import { getServerSiteSettings } from "@/lib/site-settings-server";

const FILE = "discount-codes.json";

type LegacyDiscountCode = Omit<Partial<DiscountCode>, "source"> & {
  code: string;
  percentOff?: number;
  singleUse?: boolean;
  source?: DiscountCode["source"] | "manual";
};

function normalizeDiscountCode(raw: LegacyDiscountCode): DiscountCode {
  const type: DiscountCodeType = raw.type ?? "percent";
  const value = raw.value ?? raw.percentOff ?? 10;
  const useCount = raw.useCount ?? (raw.used ? 1 : 0);
  const source: DiscountCode["source"] =
    raw.source === "manual" ? "admin" : raw.source === "admin" ? "admin" : "newsletter";

  return {
    code: raw.code,
    type,
    value,
    applyToProducts: raw.applyToProducts ?? true,
    freeShipping: raw.freeShipping ?? false,
    used: raw.used ?? (useCount > 0 && (raw.maxUses === 1 || (!raw.maxUses && useCount >= 1))),
    usedBy: raw.usedBy,
    usedAt: raw.usedAt,
    email: raw.email,
    maxUses: raw.maxUses,
    useCount,
    usedByEmails: raw.usedByEmails ?? [],
    expiresAt: raw.expiresAt,
    active: raw.active ?? true,
    singleUsePerEmail: raw.singleUsePerEmail ?? (source === "newsletter"),
    source,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    orderId: raw.orderId,
  };
}

function isCodeExhausted(code: DiscountCode): boolean {
  if (code.maxUses !== undefined && (code.useCount ?? 0) >= code.maxUses) return true;
  if (code.maxUses === undefined && code.used) return true;
  return false;
}

export async function readDiscountCodes(): Promise<DiscountCode[]> {
  const raw = await readJsonFile<LegacyDiscountCode[]>(FILE, []);
  return raw.map(normalizeDiscountCode);
}

export async function writeDiscountCodes(codes: DiscountCode[]): Promise<void> {
  await writeJsonFile(FILE, codes);
}

export async function createNewsletterDiscountCode(email: string): Promise<DiscountCode> {
  const settings = await getServerSiteSettings();
  const percentValue = settings.newsletterDiscountPercent ?? 10;
  const codes = await readDiscountCodes();
  const existingForEmail = codes.find((c) => c.email === email && !isCodeExhausted(c));
  if (existingForEmail) return existingForEmail;

  const code = generateNewsletterDiscountCode(codes.map((c) => c.code));
  const entry: DiscountCode = {
    code,
    email,
    type: "percent",
    value: percentValue,
    applyToProducts: true,
    freeShipping: false,
    singleUsePerEmail: true,
    used: false,
    useCount: 0,
    usedByEmails: [],
    active: true,
    createdAt: new Date().toISOString(),
    source: "newsletter",
  };

  codes.unshift(entry);
  await writeDiscountCodes(codes);
  return entry;
}

export async function createAdminDiscountCode(input: CreateDiscountCodeInput): Promise<DiscountCode> {
  const normalizedCode = input.code.trim().toUpperCase();
  if (!normalizedCode || normalizedCode.length < 4) {
    throw new Error("Cod invalid.");
  }

  const codes = await readDiscountCodes();
  if (codes.some((c) => c.code.toUpperCase() === normalizedCode)) {
    throw new Error("Acest cod există deja.");
  }

  if (input.value <= 0 && discountAppliesToProducts(input)) {
    throw new Error("Valoarea reducerii trebuie să fie mai mare decât 0.");
  }

  if (!discountAppliesToProducts(input) && !discountIncludesFreeShipping(input)) {
    throw new Error("Selectează cel puțin o opțiune: reducere la produse sau livrare gratuită.");
  }

  if (input.type === "percent" && discountAppliesToProducts(input) && input.value > 100) {
    throw new Error("Reducerea procentuală nu poate depăși 100%.");
  }

  const entry: DiscountCode = {
    code: normalizedCode,
    type: input.type,
    value: discountAppliesToProducts(input) ? input.value : 0,
    applyToProducts: discountAppliesToProducts(input),
    freeShipping: discountIncludesFreeShipping(input),
    maxUses: input.maxUses,
    expiresAt: input.expiresAt,
    singleUsePerEmail: input.singleUsePerEmail ?? false,
    active: input.active ?? true,
    used: false,
    useCount: 0,
    usedByEmails: [],
    createdAt: new Date().toISOString(),
    source: "admin",
  };

  codes.unshift(entry);
  await writeDiscountCodes(codes);
  return entry;
}

export async function deleteDiscountCode(code: string): Promise<boolean> {
  const normalized = code.trim().toUpperCase();
  const codes = await readDiscountCodes();
  const next = codes.filter((c) => c.code.toUpperCase() !== normalized);
  if (next.length === codes.length) return false;
  await writeDiscountCodes(next);
  return true;
}

export type UpdateDiscountCodeInput = {
  code: string;
  value?: number;
  type?: DiscountCodeType;
  maxUses?: number | null;
  expiresAt?: string | null;
  active?: boolean;
  email?: string | null;
};

export async function updateDiscountCode(input: UpdateDiscountCodeInput): Promise<DiscountCode | null> {
  const normalized = input.code.trim().toUpperCase();
  const codes = await readDiscountCodes();
  const index = codes.findIndex((c) => c.code.toUpperCase() === normalized);
  if (index === -1) return null;

  const current = codes[index];

  if (input.value !== undefined && input.value <= 0 && discountAppliesToProducts(current)) {
    throw new Error("Valoarea reducerii trebuie să fie mai mare decât 0.");
  }

  if (input.type === "percent" && input.value !== undefined && input.value > 100) {
    throw new Error("Reducerea procentuală nu poate depăși 100%.");
  }

  codes[index] = {
    ...current,
    ...(input.value !== undefined ? { value: input.value } : {}),
    ...(input.type !== undefined ? { type: input.type } : {}),
    ...(input.maxUses !== undefined
      ? { maxUses: input.maxUses === null ? undefined : input.maxUses }
      : {}),
    ...(input.expiresAt !== undefined
      ? { expiresAt: input.expiresAt === null ? undefined : input.expiresAt }
      : {}),
    ...(input.active !== undefined ? { active: input.active } : {}),
    ...(input.email !== undefined
      ? { email: input.email === null ? undefined : input.email.trim().toLowerCase() }
      : {}),
  };

  await writeDiscountCodes(codes);
  return codes[index];
}

export async function createManualNewsletterDiscountCode(
  email: string,
  overrides?: {
    code?: string;
    value?: number;
    maxUses?: number;
    expiresAt?: string;
  }
): Promise<DiscountCode> {
  const settings = await getServerSiteSettings();
  const percentValue = overrides?.value ?? settings.newsletterDiscountPercent ?? 10;
  const codes = await readDiscountCodes();
  const normalizedEmail = email.trim().toLowerCase();

  let code = overrides?.code?.trim().toUpperCase();
  if (code) {
    if (codes.some((c) => c.code.toUpperCase() === code)) {
      throw new Error("Acest cod există deja.");
    }
  } else {
    code = generateNewsletterDiscountCode(codes.map((c) => c.code));
  }

  const entry: DiscountCode = {
    code,
    email: normalizedEmail,
    type: "percent",
    value: percentValue,
    applyToProducts: true,
    freeShipping: false,
    singleUsePerEmail: true,
    used: false,
    useCount: 0,
    usedByEmails: [],
    active: true,
    maxUses: overrides?.maxUses,
    expiresAt: overrides?.expiresAt,
    createdAt: new Date().toISOString(),
    source: "newsletter",
  };

  codes.unshift(entry);
  await writeDiscountCodes(codes);
  return entry;
}

export async function validateDiscountCodeServer(
  code: string,
  email?: string
): Promise<
  | {
      valid: true;
      type: DiscountCodeType;
      value: number;
      code: string;
      applyToProducts: boolean;
      freeShipping: boolean;
    }
  | { valid: false; message: string }
> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, message: "Introdu un cod de reducere." };
  }

  const codes = await readDiscountCodes();
  const match = codes.find((c) => c.code.toUpperCase() === normalized);

  if (!match) {
    return { valid: false, message: "Cod invalid." };
  }

  if (!match.active) {
    return { valid: false, message: "Cod invalid." };
  }

  if (match.expiresAt && new Date(match.expiresAt).getTime() < Date.now()) {
    return { valid: false, message: "Cod expirat." };
  }

  if (isCodeExhausted(match)) {
    return { valid: false, message: "Acest cod a fost deja folosit." };
  }

  const normalizedEmail = email?.trim().toLowerCase();
  if (match.singleUsePerEmail && normalizedEmail) {
    const usedEmails = match.usedByEmails ?? [];
    if (usedEmails.includes(normalizedEmail)) {
      return { valid: false, message: "Acest cod a fost deja folosit pentru acest email." };
    }
  }

  return {
    valid: true,
    type: match.type,
    value: match.value,
    code: match.code,
    applyToProducts: discountAppliesToProducts(match),
    freeShipping: discountIncludesFreeShipping(match),
  };
}

export async function markDiscountCodeUsed(
  code: string,
  orderId: string,
  email?: string
): Promise<void> {
  const normalized = code.trim().toUpperCase();
  const normalizedEmail = email?.trim().toLowerCase();
  const codes = await readDiscountCodes();
  const index = codes.findIndex((c) => c.code.toUpperCase() === normalized);
  if (index === -1) return;

  const current = codes[index];
  const useCount = (current.useCount ?? 0) + 1;
  const usedByEmails = [...(current.usedByEmails ?? [])];
  if (current.singleUsePerEmail && normalizedEmail && !usedByEmails.includes(normalizedEmail)) {
    usedByEmails.push(normalizedEmail);
  }

  const exhausted =
    (current.maxUses !== undefined && useCount >= current.maxUses) ||
    (current.maxUses === undefined && useCount >= 1);

  codes[index] = {
    ...current,
    useCount,
    usedByEmails,
    used: exhausted,
    usedAt: new Date().toISOString(),
    usedBy: normalizedEmail ?? current.usedBy,
    orderId,
  };
  await writeDiscountCodes(codes);
}

export type PublicPromoCode = {
  code: string;
  type: DiscountCodeType;
  value: number;
  freeShipping: boolean;
  expiresAt?: string;
};

export async function getPublicPromoCodesServer(): Promise<PublicPromoCode[]> {
  const codes = await readDiscountCodes();
  const now = Date.now();

  return codes
    .filter((code) => {
      if (!code.active) return false;
      if (code.email) return false;
      if (isCodeExhausted(code)) return false;
      if (code.expiresAt && new Date(code.expiresAt).getTime() < now) return false;
      return true;
    })
    .map((code) => ({
      code: code.code,
      type: code.type,
      value: code.value,
      freeShipping: discountIncludesFreeShipping(code),
      expiresAt: code.expiresAt,
    }))
    .sort((a, b) => b.value - a.value);
}

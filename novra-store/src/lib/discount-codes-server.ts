import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import {
  generateNewsletterDiscountCode,
  type DiscountCode,
} from "@/lib/discount-codes";
import { getServerSiteSettings } from "@/lib/site-settings-server";

const FILE = "discount-codes.json";

export async function readDiscountCodes(): Promise<DiscountCode[]> {
  return readJsonFile<DiscountCode[]>(FILE, []);
}

export async function writeDiscountCodes(codes: DiscountCode[]): Promise<void> {
  await writeJsonFile(FILE, codes);
}

export async function createNewsletterDiscountCode(email: string): Promise<DiscountCode> {
  const settings = await getServerSiteSettings();
  const percentOff = settings.newsletterDiscountPercent ?? 10;
  const codes = await readDiscountCodes();
  const existingForEmail = codes.find((c) => c.email === email && !c.used);
  if (existingForEmail) return existingForEmail;

  const code = generateNewsletterDiscountCode(codes.map((c) => c.code));
  const entry: DiscountCode = {
    code,
    email,
    percentOff,
    singleUse: true,
    used: false,
    createdAt: new Date().toISOString(),
    source: "newsletter",
  };

  codes.unshift(entry);
  await writeDiscountCodes(codes);
  return entry;
}

export async function validateDiscountCodeServer(
  code: string
): Promise<{ valid: true; percentOff: number; code: string } | { valid: false; message: string }> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, message: "Introdu un cod de reducere." };
  }

  const codes = await readDiscountCodes();
  const match = codes.find((c) => c.code.toUpperCase() === normalized);

  if (!match) {
    return { valid: false, message: "Cod invalid sau inexistent." };
  }

  if (match.used) {
    return { valid: false, message: "Acest cod a fost deja folosit." };
  }

  return { valid: true, percentOff: match.percentOff, code: match.code };
}

export async function markDiscountCodeUsed(code: string, orderId: string): Promise<void> {
  const normalized = code.trim().toUpperCase();
  const codes = await readDiscountCodes();
  const index = codes.findIndex((c) => c.code.toUpperCase() === normalized);
  if (index === -1) return;

  codes[index] = {
    ...codes[index],
    used: true,
    usedAt: new Date().toISOString(),
    orderId,
  };
  await writeDiscountCodes(codes);
}

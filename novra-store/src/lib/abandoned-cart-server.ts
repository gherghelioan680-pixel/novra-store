import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { isEmailsEnabled } from "@/lib/emails-enabled";

const ABANDONED_CARTS_FILE = "abandoned-carts.json";

export type AbandonedCartItem = {
  productId: string;
  title: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  imageSrc: string;
};

export type AbandonedCart = {
  email: string;
  items: AbandonedCartItem[];
  totalPrice: number;
  updatedAt: string;
  reminderSentAt?: string;
  completedAt?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function readAbandonedCarts(): Promise<AbandonedCart[]> {
  return readJsonFile<AbandonedCart[]>(ABANDONED_CARTS_FILE, []);
}

export async function writeAbandonedCarts(carts: AbandonedCart[]): Promise<void> {
  await writeJsonFile(ABANDONED_CARTS_FILE, carts);
}

export async function saveAbandonedCartSnapshot(input: {
  email: string;
  items: AbandonedCartItem[];
  totalPrice: number;
}): Promise<void> {
  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@") || input.items.length === 0) return;

  const carts = await readAbandonedCarts();
  const index = carts.findIndex((cart) => cart.email === email);
  const now = new Date().toISOString();

  const snapshot: AbandonedCart = {
    email,
    items: input.items,
    totalPrice: input.totalPrice,
    updatedAt: now,
    reminderSentAt: index >= 0 ? carts[index].reminderSentAt : undefined,
    completedAt: index >= 0 ? carts[index].completedAt : undefined,
  };

  if (index >= 0) {
    carts[index] = snapshot;
  } else {
    carts.unshift(snapshot);
  }

  await writeAbandonedCarts(carts.slice(0, 500));
}

export async function markAbandonedCartCompleted(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized) return;

  const carts = await readAbandonedCarts();
  const index = carts.findIndex((cart) => cart.email === normalized);
  if (index === -1) return;

  carts[index] = {
    ...carts[index],
    completedAt: new Date().toISOString(),
    items: [],
    totalPrice: 0,
  };
  await writeAbandonedCarts(carts);
}

export async function processAbandonedCartReminders(): Promise<{
  checked: number;
  sent: number;
}> {
  const carts = await readAbandonedCarts();
  if (!isEmailsEnabled()) {
    return { checked: carts.length, sent: 0 };
  }
  return { checked: carts.length, sent: 0 };
}

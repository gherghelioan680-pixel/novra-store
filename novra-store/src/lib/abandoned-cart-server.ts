import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { sendAbandonedCartReminderEmail } from "@/lib/email";
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

function getAbandonedCartDelayMs(): number {
  const hours = Number(process.env.ABANDONED_CART_HOURS ?? "2");
  if (!Number.isFinite(hours) || hours <= 0) return 2 * 60 * 60 * 1000;
  return hours * 60 * 60 * 1000;
}

function getAbandonedCartMaxDelayMs(): number {
  const hours = Number(process.env.ABANDONED_CART_MAX_HOURS ?? "24");
  if (!Number.isFinite(hours) || hours <= 0) return 24 * 60 * 60 * 1000;
  return hours * 60 * 60 * 1000;
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
    console.log("[abandoned-cart] EMAILS_ENABLED is not true — skipping reminders");
    return { checked: carts.length, sent: 0 };
  }

  const minDelay = getAbandonedCartDelayMs();
  const maxDelay = getAbandonedCartMaxDelayMs();
  const now = Date.now();
  let sent = 0;

  for (let i = 0; i < carts.length; i++) {
    const cart = carts[i];
    if (cart.completedAt || cart.reminderSentAt || cart.items.length === 0) continue;

    const updatedAt = new Date(cart.updatedAt).getTime();
    const age = now - updatedAt;
    if (age < minDelay || age > maxDelay) continue;

    const ok = await sendAbandonedCartReminderEmail({
      email: cart.email,
      items: cart.items,
      totalPrice: cart.totalPrice,
    });

    if (ok) {
      carts[i] = { ...cart, reminderSentAt: new Date().toISOString() };
      sent += 1;
    }
  }

  if (sent > 0) {
    await writeAbandonedCarts(carts);
  }

  return { checked: carts.length, sent };
}

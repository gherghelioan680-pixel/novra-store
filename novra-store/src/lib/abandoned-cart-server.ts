import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { Resend } from "resend";
import { getStripeCheckoutOrigin } from "@/lib/stripe-server";

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

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? "NOVRA <onboarding@resend.dev>";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatRon(value: number): string {
  return `${value.toFixed(2)} RON`;
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

async function sendAbandonedCartEmail(cart: AbandonedCart): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  const origin = getStripeCheckoutOrigin();
  const checkoutUrl = `${origin}/checkout`;

  const itemsHtml = cart.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;color:#d1d5db;font-size:14px;">${escapeHtml(item.title)} (${escapeHtml(item.variantLabel)}) ×${item.quantity}</td>
          <td style="padding:8px 0;color:#fff;font-size:14px;text-align:right;">${formatRon(item.unitPrice * item.quantity)}</td>
        </tr>`
    )
    .join("");

  const body = `
    <p style="margin:0 0 16px;color:#e5e7eb;font-size:15px;line-height:1.6;">
      Bună!<br>
      Ai lăsat produse în coșul tău NOVRA. Le-am păstrat pentru tine — finalizează comanda când ești gata.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      ${itemsHtml}
      <tr><td colspan="2" style="border-top:1px solid rgba(255,255,255,0.1);padding-top:12px;"></td></tr>
      <tr>
        <td style="padding:8px 0;color:#fff;font-size:16px;font-weight:700;">Total coș</td>
        <td style="padding:8px 0;color:#c4b5fd;font-size:16px;font-weight:700;text-align:right;">${formatRon(cart.totalPrice)}</td>
      </tr>
    </table>
    <p style="margin:0;text-align:center;">
      <a href="${checkoutUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;">Finalizează comanda</a>
    </p>
  `;

  const html = `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="utf-8"><title>Coș abandonat NOVRA</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#12121a;border:1px solid rgba(168,85,247,0.25);border-radius:16px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#6d28d9,#9333ea);padding:24px 28px;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">NOVRA</p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">Ai uitat ceva în coș?</p>
        </td></tr>
        <tr><td style="padding:28px;">${body}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: getFromEmail(),
    to: cart.email,
    subject: "Ai produse în coș — finalizează comanda NOVRA",
    html,
  });

  if (error) {
    console.error("[abandoned-cart] email failed:", cart.email, error);
    return false;
  }

  return true;
}

export async function processAbandonedCartReminders(): Promise<{
  checked: number;
  sent: number;
}> {
  const carts = await readAbandonedCarts();
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

    const ok = await sendAbandonedCartEmail(cart);
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

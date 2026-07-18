import "server-only";

import type { Order, OrderStatus } from "./orders";
import { isEmailsEnabled } from "./emails-enabled";

export function isEmailConfigured(): boolean {
  return isEmailsEnabled();
}

/** Send confirmation email if enabled and not already sent. Returns true when email was sent. */
export async function trySendOrderConfirmationEmail(
  order: Order,
  orderEmailsEnabled: boolean
): Promise<boolean> {
  if (!isEmailsEnabled() || !orderEmailsEnabled) return false;
  if (order.confirmationEmailSent) return false;
  if (!order.userEmail?.trim()) return false;
  return sendOrderConfirmationEmail(order);
}

export async function sendOrderConfirmationEmail(_order: Order): Promise<boolean> {
  if (!isEmailsEnabled()) return false;
  return false;
}

/** Trimite email de status doar când statusul s-a schimbat și nu a fost deja notificat pentru acel status. */
export async function trySendOrderStatusEmail(
  order: Order,
  previousStatus: OrderStatus,
  orderEmailsEnabled: boolean
): Promise<{ sent: boolean; status?: OrderStatus }> {
  if (!isEmailsEnabled() || !orderEmailsEnabled) return { sent: false };
  if (!order.userEmail?.trim()) return { sent: false };
  if (order.status === previousStatus) return { sent: false };

  const sent = await sendOrderStatusEmail(order, order.status);
  return sent ? { sent: true, status: order.status } : { sent: false };
}

export async function sendOrderStatusEmail(
  _order: Order,
  _status: OrderStatus
): Promise<boolean> {
  if (!isEmailsEnabled()) return false;
  return false;
}

export async function sendTrackingEmail(_order: Order, _awb: string): Promise<boolean> {
  if (!isEmailsEnabled()) return false;
  return false;
}

export function formatNewsletterWelcomePreview(
  template: string,
  discountCode: string,
  discountPercent: number
): string {
  return template
    .replace(/\{code\}/g, discountCode)
    .replace(/\{percent\}/g, String(discountPercent));
}

export async function sendNewsletterWelcomeEmail(
  _email: string,
  _discountCode: string,
  _discountPercent: number,
  _welcomeTemplate?: string
): Promise<boolean> {
  if (!isEmailsEnabled()) return false;
  return false;
}

export async function sendNewsletterBroadcastEmail(
  emails: string[],
  _subject?: string,
  _bodyText?: string
): Promise<{ sent: number; failed: number }> {
  if (!isEmailsEnabled()) {
    return { sent: 0, failed: emails.length };
  }
  return { sent: 0, failed: emails.length };
}

export async function sendPasswordResetEmail(_email: string, _resetUrl: string): Promise<boolean> {
  if (!isEmailsEnabled()) return false;
  return false;
}

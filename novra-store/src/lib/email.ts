import "server-only";

import { Resend } from "resend";
import type { Order } from "./orders";
import { ORDER_STATUS_LABELS } from "./orders";
import { buildFanCourierTrackingUrl } from "./tracking";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getFromEmail(): string {
  const from = process.env.RESEND_FROM_EMAIL ?? "NOVRA <onboarding@resend.dev>";
  if (!process.env.RESEND_FROM_EMAIL && process.env.VERCEL === "1") {
    console.warn(
      "[email] RESEND_FROM_EMAIL not set on Vercel — using Resend sandbox address. Set RESEND_FROM_EMAIL to a verified domain for production."
    );
  }
  return from;
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

function buildItemsHtml(order: Order): string {
  return order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;color:#d1d5db;font-size:14px;">${escapeHtml(item.title)} (${escapeHtml(item.variantLabel)}) ×${item.quantity}</td>
          <td style="padding:8px 0;color:#fff;font-size:14px;text-align:right;">${formatRon(item.unitPrice * item.quantity)}</td>
        </tr>`
    )
    .join("");
}

function baseEmailHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#12121a;border:1px solid rgba(168,85,247,0.25);border-radius:16px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#6d28d9,#9333ea);padding:24px 28px;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.02em;">NOVRA</p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">${escapeHtml(title)}</p>
        </td></tr>
        <tr><td style="padding:28px;">${body}</td></tr>
        <tr><td style="padding:0 28px 24px;">
          <p style="margin:0;font-size:12px;color:#6b7280;text-align:center;">© NOVRA — Cabluri &amp; adaptoare premium</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function confirmationIntro(order: Order): string {
  if (order.paymentMethod === "card" && order.paymentStatus === "paid") {
    return "Plata cu cardul a fost confirmată cu succes. Comanda ta este în procesare și te vom ține la curent.";
  }
  return "Mulțumim pentru comanda ta! Am înregistrat-o și te vom contacta pentru livrare. Vei plăti numerar la primirea coletului.";
}

function paymentStatusLabel(order: Order): string {
  if (order.paymentStatus === "paid") return "Plătită";
  if (order.paymentMethod === "ramburs") return "De plătit la livrare (ramburs)";
  return "În așteptare";
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Send confirmation email if enabled and not already sent. Returns true when email was sent. */
export async function trySendOrderConfirmationEmail(
  order: Order,
  orderEmailsEnabled: boolean
): Promise<boolean> {
  if (!orderEmailsEnabled) {
    console.log("[email] Order emails disabled — skipping confirmation for", order.purchaseCode);
    return false;
  }
  if (order.confirmationEmailSent) {
    return false;
  }
  if (!order.userEmail?.trim()) {
    console.warn("[email] Missing customer email — skipping confirmation for", order.purchaseCode);
    return false;
  }
  return sendOrderConfirmationEmail(order);
}

export async function sendOrderConfirmationEmail(order: Order): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.log("[email] RESEND_API_KEY not configured — skipping confirmation for", order.purchaseCode);
    return false;
  }

  const paymentLabel = order.paymentMethod === "card" ? "Plată cu cardul" : "Ramburs (numerar la livrare)";
  const discountRow =
    order.discountAmount && order.discountAmount > 0
      ? `<tr>
          <td style="padding:4px 0;color:#a78bfa;font-size:14px;">Reducere${order.discountCode ? ` (${escapeHtml(order.discountCode)})` : ""}</td>
          <td style="padding:4px 0;color:#a78bfa;font-size:14px;text-align:right;">−${formatRon(order.discountAmount)}</td>
        </tr>`
      : "";

  const deliveryLines = [
    escapeHtml(order.address.address),
    escapeHtml(order.address.city),
    order.address.phone ? `Tel: ${escapeHtml(order.address.phone)}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const body = `
    <p style="margin:0 0 16px;color:#e5e7eb;font-size:15px;line-height:1.6;">
      Bună, <strong style="color:#fff;">${escapeHtml(order.address.name)}</strong>!<br>
      ${confirmationIntro(order)}
    </p>
    <div style="background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:16px;margin-bottom:20px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;">Cod comandă</p>
      <p style="margin:0;font-family:monospace;font-size:20px;font-weight:700;color:#c4b5fd;">${escapeHtml(order.purchaseCode)}</p>
    </div>
    <p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;">Produse comandate</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      ${buildItemsHtml(order)}
      ${discountRow}
      <tr><td colspan="2" style="border-top:1px solid rgba(255,255,255,0.1);padding-top:12px;"></td></tr>
      ${
        order.shipping > 0
          ? `<tr>
              <td style="padding:4px 0;color:#9ca3af;font-size:14px;">Livrare</td>
              <td style="padding:4px 0;color:#fff;font-size:14px;text-align:right;">${formatRon(order.shipping)}</td>
            </tr>`
          : `<tr>
              <td style="padding:4px 0;color:#9ca3af;font-size:14px;">Livrare</td>
              <td style="padding:4px 0;color:#34d399;font-size:14px;text-align:right;">Gratuită</td>
            </tr>`
      }
      <tr>
        <td style="padding:8px 0;color:#fff;font-size:16px;font-weight:700;">Total</td>
        <td style="padding:8px 0;color:#c4b5fd;font-size:16px;font-weight:700;text-align:right;">${formatRon(order.total)}</td>
      </tr>
    </table>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;margin-top:4px;">
      <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;"><strong style="color:#d1d5db;">Plată:</strong> ${paymentLabel} · ${paymentStatusLabel(order)}</p>
      <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;"><strong style="color:#d1d5db;">Status comandă:</strong> ${ORDER_STATUS_LABELS[order.status]}</p>
      <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;"><strong style="color:#d1d5db;">Adresă livrare:</strong> ${deliveryLines}</p>
    </div>
  `;

  try {
    const from = getFromEmail();
    const { error } = await resend.emails.send({
      from,
      to: order.userEmail,
      subject: `Confirmare comandă NOVRA — ${order.purchaseCode}`,
      html: baseEmailHtml("Confirmare comandă", body),
    });

    if (error) {
      console.error("[email] Order confirmation failed:", order.purchaseCode, error);
      return false;
    }
    console.log("[email] Order confirmation sent:", order.purchaseCode, "→", order.userEmail);
    return true;
  } catch (err) {
    console.error("[email] Order confirmation error:", order.purchaseCode, err);
    return false;
  }
}

export async function sendTrackingEmail(order: Order, awb: string): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.log("[email] RESEND_API_KEY not configured — skipping tracking email for", order.purchaseCode);
    return false;
  }

  const trackingUrl = buildFanCourierTrackingUrl(awb);

  const body = `
    <p style="margin:0 0 16px;color:#e5e7eb;font-size:15px;line-height:1.6;">
      Bună, <strong style="color:#fff;">${escapeHtml(order.address.name)}</strong>!<br>
      Comanda ta <strong style="color:#c4b5fd;">${escapeHtml(order.purchaseCode)}</strong> a fost expediată.
    </p>
    <div style="background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:16px;margin-bottom:20px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;">Număr AWB</p>
      <p style="margin:0;font-family:monospace;font-size:20px;font-weight:700;color:#c4b5fd;">${escapeHtml(awb)}</p>
    </div>
    <p style="margin:0 0 20px;color:#9ca3af;font-size:14px;line-height:1.6;">
      Poți urmări coletul folosind linkul de mai jos:
    </p>
    <p style="margin:0;text-align:center;">
      <a href="${trackingUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;">Urmărește coletul</a>
    </p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: order.userEmail,
      subject: `Comanda ${order.purchaseCode} a fost expediată — AWB ${awb}`,
      html: baseEmailHtml("Coletul tău este în drum", body),
    });

    if (error) {
      console.error("[email] Tracking email failed:", order.purchaseCode, error);
      return false;
    }
    console.log("[email] Tracking email sent:", order.purchaseCode, "→", order.userEmail);
    return true;
  } catch (err) {
    console.error("[email] Tracking email error:", order.purchaseCode, err);
    return false;
  }
}

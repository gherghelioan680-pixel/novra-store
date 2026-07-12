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
  return process.env.RESEND_FROM_EMAIL ?? "NOVRA <onboarding@resend.dev>";
}

function formatRon(value: number): string {
  return `${value.toFixed(2)} RON`;
}

function buildItemsHtml(order: Order): string {
  return order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;color:#d1d5db;font-size:14px;">${item.title} (${item.variantLabel}) ×${item.quantity}</td>
          <td style="padding:8px 0;color:#fff;font-size:14px;text-align:right;">${formatRon(item.unitPrice * item.quantity)}</td>
        </tr>`
    )
    .join("");
}

function baseEmailHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#12121a;border:1px solid rgba(168,85,247,0.25);border-radius:16px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#6d28d9,#9333ea);padding:24px 28px;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.02em;">NOVRA</p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">${title}</p>
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

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
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
          <td style="padding:4px 0;color:#a78bfa;font-size:14px;">Reducere${order.discountCode ? ` (${order.discountCode})` : ""}</td>
          <td style="padding:4px 0;color:#a78bfa;font-size:14px;text-align:right;">−${formatRon(order.discountAmount)}</td>
        </tr>`
      : "";

  const body = `
    <p style="margin:0 0 16px;color:#e5e7eb;font-size:15px;line-height:1.6;">
      Bună, <strong style="color:#fff;">${order.address.name}</strong>!<br>
      Mulțumim pentru comanda ta. Am înregistrat-o și te vom contacta pentru livrare.
    </p>
    <div style="background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:16px;margin-bottom:20px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;">Cod comandă</p>
      <p style="margin:0;font-family:monospace;font-size:20px;font-weight:700;color:#c4b5fd;">${order.purchaseCode}</p>
    </div>
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
    <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;"><strong style="color:#d1d5db;">Plată:</strong> ${paymentLabel}</p>
    <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;"><strong style="color:#d1d5db;">Status:</strong> ${ORDER_STATUS_LABELS[order.status]}</p>
    <p style="margin:0;color:#9ca3af;font-size:13px;"><strong style="color:#d1d5db;">Livrare la:</strong> ${order.address.address}, ${order.address.city}</p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: order.userEmail,
      subject: `Confirmare comandă NOVRA — ${order.purchaseCode}`,
      html: baseEmailHtml("Confirmare comandă", body),
    });

    if (error) {
      console.error("[email] Order confirmation failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Order confirmation error:", err);
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
      Bună, <strong style="color:#fff;">${order.address.name}</strong>!<br>
      Comanda ta <strong style="color:#c4b5fd;">${order.purchaseCode}</strong> a fost expediată.
    </p>
    <div style="background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:16px;margin-bottom:20px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;">Număr AWB</p>
      <p style="margin:0;font-family:monospace;font-size:20px;font-weight:700;color:#c4b5fd;">${awb}</p>
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
      console.error("[email] Tracking email failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Tracking email error:", err);
    return false;
  }
}

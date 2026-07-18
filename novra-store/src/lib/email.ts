import "server-only";

import { Resend } from "resend";
import type { Order, OrderStatus } from "./orders";
import { ORDER_STATUS_LABELS } from "./orders";
import { buildFanCourierTrackingUrl } from "./tracking";
import { getStripeCheckoutOrigin } from "./stripe-server";

const NOTIFIABLE_STATUSES: OrderStatus[] = ["processing", "shipped", "delivered", "cancelled"];

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
    ${trackOrderLinkHtml(order.purchaseCode)}
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

function getTrackOrderUrl(purchaseCode: string): string {
  const origin = getStripeCheckoutOrigin();
  return `${origin}/urmareste-comanda?code=${encodeURIComponent(purchaseCode)}`;
}

function trackOrderLinkHtml(purchaseCode: string): string {
  const url = getTrackOrderUrl(purchaseCode);
  return `<p style="margin:20px 0 0;text-align:center;">
    <a href="${url}" style="display:inline-block;background:rgba(255,255,255,0.08);color:#c4b5fd;text-decoration:none;font-weight:600;font-size:13px;padding:10px 20px;border-radius:10px;border:1px solid rgba(168,85,247,0.35);">Urmărește comanda</a>
  </p>`;
}

function statusEmailSubject(status: OrderStatus, purchaseCode: string, awb?: string): string {
  switch (status) {
    case "processing":
      return `Comanda ${purchaseCode} este în procesare`;
    case "shipped":
      return awb
        ? `Comanda ${purchaseCode} a fost expediată — AWB ${awb}`
        : `Comanda ${purchaseCode} a fost expediată`;
    case "delivered":
      return `Comanda ${purchaseCode} a fost livrată`;
    case "cancelled":
      return `Comanda ${purchaseCode} a fost anulată`;
    default:
      return `Actualizare comandă ${purchaseCode}`;
  }
}

function statusEmailTitle(status: OrderStatus): string {
  switch (status) {
    case "processing":
      return "Comanda ta este în procesare";
    case "shipped":
      return "Coletul tău este în drum";
    case "delivered":
      return "Comanda ta a fost livrată";
    case "cancelled":
      return "Comanda ta a fost anulată";
    default:
      return "Actualizare comandă";
  }
}

function buildStatusEmailBody(order: Order, status: OrderStatus): string {
  const awb = order.awbTracking?.trim();
  const trackingUrl = awb ? buildFanCourierTrackingUrl(awb) : "";

  let intro = "";
  switch (status) {
    case "processing":
      intro =
        "Comanda ta este acum <strong style=\"color:#c4b5fd;\">în procesare</strong>. Pregătim produsele și te vom anunța când coletul pleacă spre tine.";
      break;
    case "shipped":
      intro = awb
        ? `Comanda ta <strong style="color:#c4b5fd;">${escapeHtml(order.purchaseCode)}</strong> a fost expediată.`
        : `Comanda ta <strong style="color:#c4b5fd;">${escapeHtml(order.purchaseCode)}</strong> a fost expediată și este în drum spre tine.`;
      break;
    case "delivered":
      intro =
        "Comanda ta a fost <strong style=\"color:#34d399;\">livrată</strong>. Sperăm că te bucuri de produsele NOVRA!";
      break;
    case "cancelled":
      intro =
        "Comanda ta a fost <strong style=\"color:#f87171;\">anulată</strong>. Dacă ai întrebări, contactează-ne la support@novra.ro.";
      break;
    default:
      intro = `Statusul comenzii tale este acum: ${ORDER_STATUS_LABELS[status]}.`;
  }

  const awbBlock = awb && status === "shipped"
    ? `<div style="background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:16px;margin:16px 0;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;">Număr AWB</p>
        <p style="margin:0;font-family:monospace;font-size:20px;font-weight:700;color:#c4b5fd;">${escapeHtml(awb)}</p>
      </div>
      <p style="margin:0 0 16px;text-align:center;">
        <a href="${trackingUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;">Urmărește coletul Fan Courier</a>
      </p>`
    : "";

  return `
    <p style="margin:0 0 16px;color:#e5e7eb;font-size:15px;line-height:1.6;">
      Bună, <strong style="color:#fff;">${escapeHtml(order.address.name)}</strong>!<br>
      ${intro}
    </p>
    <div style="background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:16px;margin-bottom:16px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;">Cod comandă</p>
      <p style="margin:0;font-family:monospace;font-size:20px;font-weight:700;color:#c4b5fd;">${escapeHtml(order.purchaseCode)}</p>
      <p style="margin:8px 0 0;font-size:13px;color:#9ca3af;">Status: ${ORDER_STATUS_LABELS[status]}</p>
    </div>
    ${awbBlock}
    ${trackOrderLinkHtml(order.purchaseCode)}
  `;
}

/** Trimite email de status doar când statusul s-a schimbat și nu a fost deja notificat pentru acel status. */
export async function trySendOrderStatusEmail(
  order: Order,
  previousStatus: OrderStatus,
  orderEmailsEnabled: boolean
): Promise<{ sent: boolean; status?: OrderStatus }> {
  if (!orderEmailsEnabled) return { sent: false };
  if (!order.userEmail?.trim()) return { sent: false };
  if (order.status === previousStatus) return { sent: false };
  if (!NOTIFIABLE_STATUSES.includes(order.status)) return { sent: false };
  if (order.statusEmailsSent?.[order.status]) return { sent: false };

  const sent = await sendOrderStatusEmail(order, order.status);
  return sent ? { sent: true, status: order.status } : { sent: false };
}

export async function sendOrderStatusEmail(order: Order, status: OrderStatus): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.log("[email] RESEND_API_KEY not configured — skipping status email for", order.purchaseCode);
    return false;
  }

  const awb = order.awbTracking?.trim();
  const body = buildStatusEmailBody(order, status);

  try {
    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: order.userEmail,
      subject: statusEmailSubject(status, order.purchaseCode, awb),
      html: baseEmailHtml(statusEmailTitle(status), body),
    });

    if (error) {
      console.error("[email] Status email failed:", order.purchaseCode, status, error);
      return false;
    }

    console.log("[email] Status email sent:", order.purchaseCode, status, "→", order.userEmail);
    return true;
  } catch (err) {
    console.error("[email] Status email error:", order.purchaseCode, status, err);
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
    ${trackOrderLinkHtml(order.purchaseCode)}
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
  email: string,
  discountCode: string,
  discountPercent: number,
  welcomeTemplate?: string
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.log("[email] RESEND_API_KEY not configured — skipping newsletter welcome for", email);
    return false;
  }

  const templateText = welcomeTemplate?.trim()
    ? formatNewsletterWelcomePreview(welcomeTemplate, discountCode, discountPercent)
    : `Mulțumim că te-ai abonat la newsletter-ul NOVRA. Iată codul tău exclusiv pentru prima comandă:`;

  const body = `
    <p style="margin:0 0 16px;color:#e5e7eb;font-size:15px;line-height:1.6;">
      Bună!<br>
      ${escapeHtml(templateText)}
    </p>
    <div style="background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;">Cod reducere</p>
      <p style="margin:0;font-family:monospace;font-size:22px;font-weight:700;color:#c4b5fd;">${escapeHtml(discountCode)}</p>
      <p style="margin:8px 0 0;font-size:13px;color:#a78bfa;">${discountPercent}% reducere la prima comandă</p>
    </div>
    <p style="margin:0 0 20px;color:#9ca3af;font-size:14px;line-height:1.6;">
      Introdu codul la checkout. Valabil o singură dată per email. Lansarea este foarte aproape — fii pregătit!
    </p>
    <p style="margin:0;text-align:center;">
      <a href="${getStripeCheckoutOrigin()}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;">Vizitează NOVRA</a>
    </p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: `Codul tău NOVRA — ${discountPercent}% reducere la prima comandă`,
      html: baseEmailHtml("Bine ai venit la NOVRA", body),
    });

    if (error) {
      console.error("[email] Newsletter welcome failed:", email, error);
      return false;
    }
    console.log("[email] Newsletter welcome sent:", email);
    return true;
  } catch (err) {
    console.error("[email] Newsletter welcome error:", email, err);
    return false;
  }
}

export async function sendNewsletterBroadcastEmail(
  emails: string[],
  subject: string,
  bodyText: string
): Promise<{ sent: number; failed: number }> {
  const resend = getResendClient();
  if (!resend) {
    console.log("[email] RESEND_API_KEY not configured — skipping newsletter broadcast");
    return { sent: 0, failed: emails.length };
  }

  const paragraphs = bodyText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 14px;color:#e5e7eb;font-size:15px;line-height:1.6;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`
    )
    .join("");

  const body = `
    ${paragraphs}
    <p style="margin:20px 0 0;text-align:center;">
      <a href="${getStripeCheckoutOrigin()}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;">Vizitează NOVRA</a>
    </p>
  `;

  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      const { error } = await resend.emails.send({
        from: getFromEmail(),
        to: email,
        subject,
        html: baseEmailHtml(subject, body),
      });
      if (error) {
        console.error("[email] Newsletter broadcast failed:", email, error);
        failed += 1;
      } else {
        sent += 1;
      }
    } catch (err) {
      console.error("[email] Newsletter broadcast error:", email, err);
      failed += 1;
    }
  }

  console.log("[email] Newsletter broadcast complete:", { sent, failed, total: emails.length });
  return { sent, failed };
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.log("[email] RESEND_API_KEY not configured — skipping password reset for", email);
    return false;
  }

  const body = `
    <p style="margin:0 0 16px;color:#e5e7eb;font-size:15px;line-height:1.6;">
      Ai solicitat resetarea parolei contului NOVRA. Apasă butonul de mai jos pentru a alege o parolă nouă.
      Linkul expiră în 60 de minute.
    </p>
    <p style="margin:0 0 20px;text-align:center;">
      <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;">Resetează parola</a>
    </p>
    <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
      Dacă nu ai solicitat resetarea, ignoră acest email.
    </p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: "Resetare parolă NOVRA",
      html: baseEmailHtml("Resetare parolă", body),
    });
    if (error) {
      console.error("[email] Password reset failed:", email, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Password reset error:", email, err);
    return false;
  }
}

import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import type { Order, OrderStatus } from "./orders";
import { ORDER_STATUS_LABELS } from "./orders";
import { buildFanCourierTrackingUrl } from "./tracking";
import { isEmailsEnabled } from "./emails-enabled";
import {
  emailButton,
  emailSecondaryButton,
  escapeHtml,
  formatRon,
  getSiteOrigin,
  highlightBox,
  htmlToPlainText,
  infoPanel,
  paragraph,
  wrapEmailHtml,
} from "./email-templates";

const NOTIFIABLE_STATUSES: OrderStatus[] = ["processing", "shipped", "delivered", "cancelled"];

let transporter: Transporter | null | undefined;

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

function getSmtpPort(): number {
  const port = Number(process.env.SMTP_PORT ?? "587");
  return Number.isFinite(port) && port > 0 ? port : 587;
}

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM?.trim()
  );
}

function getFromAddress(): string | null {
  const from = process.env.SMTP_FROM?.trim();
  return from || null;
}

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  if (!isSmtpConfigured()) {
    transporter = null;
    return transporter;
  }

  const port = getSmtpPort();
  const secure = port === 465;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!.trim(),
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER!.trim(),
      pass: process.env.SMTP_PASS,
    },
    ...(port === 587 ? { requireTLS: true } : {}),
  });

  return transporter;
}

export function isEmailConfigured(): boolean {
  return isSmtpConfigured();
}

export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const recipients = Array.isArray(input.to) ? input.to : [input.to];
  const normalizedRecipients = recipients.map((email) => email.trim()).filter(Boolean);

  if (normalizedRecipients.length === 0) {
    console.warn("[email] sendEmail skipped — no recipients");
    return false;
  }

  if (!isEmailsEnabled()) {
    console.log("[email] EMAILS_ENABLED is not true — skipping:", input.subject, "→", normalizedRecipients.join(", "));
    return false;
  }

  const transport = getTransporter();
  const from = getFromAddress();

  if (!transport || !from) {
    console.warn(
      "[email] SMTP not configured — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM:",
      input.subject
    );
    return false;
  }

  try {
    await transport.sendMail({
      from,
      to: normalizedRecipients.join(", "),
      subject: input.subject,
      html: input.html,
      text: input.text ?? htmlToPlainText(input.html),
    });

    console.log("[email] Sent:", input.subject, "→", normalizedRecipients.join(", "));
    return true;
  } catch (error) {
    console.error("[email] Send failed:", input.subject, "→", normalizedRecipients.join(", "), error);
    return false;
  }
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

function buildItemsHtml(order: Order): string {
  return order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#374151;">${escapeHtml(item.title)} (${escapeHtml(item.variantLabel)}) ×${item.quantity}</td>
          <td style="padding:8px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111111;text-align:right;white-space:nowrap;">${formatRon(item.unitPrice * item.quantity)}</td>
        </tr>`
    )
    .join("");
}

function getTrackOrderUrl(purchaseCode: string): string {
  return `${getSiteOrigin()}/urmareste-comanda?code=${encodeURIComponent(purchaseCode)}`;
}

function trackOrderLinkHtml(purchaseCode: string): string {
  return emailSecondaryButton(getTrackOrderUrl(purchaseCode), "Urmărește comanda");
}

/** Send confirmation email if enabled and not already sent. Returns true when email was sent. */
export async function trySendOrderConfirmationEmail(
  order: Order,
  orderEmailsEnabled: boolean
): Promise<boolean> {
  if (!isEmailsEnabled() || !orderEmailsEnabled) {
    console.log("[email] Order emails disabled — skipping confirmation for", order.purchaseCode);
    return false;
  }
  if (order.confirmationEmailSent) return false;
  if (!order.userEmail?.trim()) {
    console.warn("[email] Missing customer email — skipping confirmation for", order.purchaseCode);
    return false;
  }
  return sendOrderConfirmationEmail(order);
}

export async function sendOrderConfirmationEmail(order: Order): Promise<boolean> {
  const paymentLabel = order.paymentMethod === "card" ? "Plată cu cardul" : "Ramburs (numerar la livrare)";
  const discountRow =
    order.discountAmount && order.discountAmount > 0
      ? `<tr>
          <td style="padding:4px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111111;">Reducere${order.discountCode ? ` (${escapeHtml(order.discountCode)})` : ""}</td>
          <td style="padding:4px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111111;text-align:right;">−${formatRon(order.discountAmount)}</td>
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
    ${paragraph(`Bună, <strong style="color:#111111;">${escapeHtml(order.address.name)}</strong>!<br>${confirmationIntro(order)}`)}
    ${highlightBox("Cod comandă", order.purchaseCode)}
    <p style="margin:0 0 12px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;">Produse comandate</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:16px;">
      ${buildItemsHtml(order)}
      ${discountRow}
      <tr><td colspan="2" style="border-top:1px solid #e5e7eb;padding-top:12px;"></td></tr>
      ${
        order.shipping > 0
          ? `<tr>
              <td style="padding:4px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#6b7280;">Livrare</td>
              <td style="padding:4px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111111;text-align:right;">${formatRon(order.shipping)}</td>
            </tr>`
          : `<tr>
              <td style="padding:4px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#6b7280;">Livrare</td>
              <td style="padding:4px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111111;text-align:right;">Gratuită</td>
            </tr>`
      }
      <tr>
        <td style="padding:8px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;font-weight:700;color:#111111;">Total</td>
        <td style="padding:8px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;font-weight:700;color:#111111;text-align:right;">${formatRon(order.total)}</td>
      </tr>
    </table>
    ${infoPanel(`
      <p style="margin:0 0 8px;"><strong style="color:#111111;">Plată:</strong> ${paymentLabel} · ${paymentStatusLabel(order)}</p>
      <p style="margin:0 0 8px;"><strong style="color:#111111;">Status comandă:</strong> ${ORDER_STATUS_LABELS[order.status]}</p>
      <p style="margin:0;"><strong style="color:#111111;">Adresă livrare:</strong> ${deliveryLines}</p>
    `)}
    ${trackOrderLinkHtml(order.purchaseCode)}
  `;

  return sendEmail({
    to: order.userEmail,
    subject: `Confirmare comandă NOVRA — ${order.purchaseCode}`,
    html: wrapEmailHtml("Confirmare comandă", body, "Comanda ta a fost înregistrată cu succes."),
  });
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
        "Comanda ta este acum <strong style=\"color:#111111;\">în procesare</strong>. Pregătim produsele și te vom anunța când coletul pleacă spre tine.";
      break;
    case "shipped":
      intro = awb
        ? `Comanda ta <strong style="color:#111111;">${escapeHtml(order.purchaseCode)}</strong> a fost expediată.`
        : `Comanda ta <strong style="color:#111111;">${escapeHtml(order.purchaseCode)}</strong> a fost expediată și este în drum spre tine.`;
      break;
    case "delivered":
      intro =
        "Comanda ta a fost <strong style=\"color:#111111;\">livrată</strong>. Sperăm că te bucuri de produsele NOVRA!";
      break;
    case "cancelled":
      intro =
        "Comanda ta a fost <strong style=\"color:#111111;\">anulată</strong>. Dacă ai întrebări, contactează-ne la contact@novra.ro.";
      break;
    default:
      intro = `Statusul comenzii tale este acum: ${ORDER_STATUS_LABELS[status]}.`;
  }

  const awbBlock =
    awb && status === "shipped"
      ? `${highlightBox("Număr AWB", awb)}${emailButton(trackingUrl, "Urmărește coletul Fan Courier")}`
      : "";

  return `
    ${paragraph(`Bună, <strong style="color:#111111;">${escapeHtml(order.address.name)}</strong>!<br>${intro}`)}
    ${highlightBox("Cod comandă", order.purchaseCode, `Status: ${ORDER_STATUS_LABELS[status]}`)}
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
  if (!isEmailsEnabled() || !orderEmailsEnabled) return { sent: false };
  if (!order.userEmail?.trim()) return { sent: false };
  if (order.status === previousStatus) return { sent: false };
  if (!NOTIFIABLE_STATUSES.includes(order.status)) return { sent: false };
  if (order.statusEmailsSent?.[order.status]) return { sent: false };

  const sent = await sendOrderStatusEmail(order, order.status);
  return sent ? { sent: true, status: order.status } : { sent: false };
}

export async function sendOrderStatusEmail(order: Order, status: OrderStatus): Promise<boolean> {
  const awb = order.awbTracking?.trim();
  const body = buildStatusEmailBody(order, status);

  return sendEmail({
    to: order.userEmail,
    subject: statusEmailSubject(status, order.purchaseCode, awb),
    html: wrapEmailHtml(statusEmailTitle(status), body),
  });
}

export async function sendTrackingEmail(order: Order, awb: string): Promise<boolean> {
  const trackingUrl = buildFanCourierTrackingUrl(awb);

  const body = `
    ${paragraph(`Bună, <strong style="color:#111111;">${escapeHtml(order.address.name)}</strong>!<br>Comanda ta <strong style="color:#111111;">${escapeHtml(order.purchaseCode)}</strong> a fost expediată.`)}
    ${highlightBox("Număr AWB", awb)}
    ${paragraph("Poți urmări coletul folosind linkul de mai jos:")}
    ${emailButton(trackingUrl, "Urmărește coletul")}
    ${trackOrderLinkHtml(order.purchaseCode)}
  `;

  return sendEmail({
    to: order.userEmail,
    subject: `Comanda ${order.purchaseCode} a fost expediată — AWB ${awb}`,
    html: wrapEmailHtml("Coletul tău este în drum", body),
  });
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
  const templateText = welcomeTemplate?.trim()
    ? formatNewsletterWelcomePreview(welcomeTemplate, discountCode, discountPercent)
    : "Mulțumim că te-ai abonat la newsletter-ul NOVRA. Iată codul tău exclusiv pentru prima comandă:";

  const body = `
    ${paragraph(`Bună!<br>${escapeHtml(templateText)}`)}
    ${highlightBox("Cod reducere", discountCode, `${discountPercent}% reducere la prima comandă`)}
    ${paragraph("Introdu codul la checkout. Valabil o singură dată per email. Lansarea este foarte aproape — fii pregătit!")}
    ${emailButton(getSiteOrigin(), "Vizitează NOVRA")}
  `;

  return sendEmail({
    to: email,
    subject: `Codul tău NOVRA — ${discountPercent}% reducere la prima comandă`,
    html: wrapEmailHtml("Bine ai venit la NOVRA", body, "Abonare confirmată la newsletter."),
  });
}

export async function sendNewsletterBroadcastEmail(
  emails: string[],
  subject?: string,
  bodyText?: string
): Promise<{ sent: number; failed: number }> {
  if (!isEmailsEnabled()) {
    console.log("[email] EMAILS_ENABLED is not true — skipping newsletter broadcast");
    return { sent: 0, failed: emails.length };
  }

  const safeSubject = subject?.trim() || "Noutăți de la NOVRA";
  const paragraphs = (bodyText ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => paragraph(escapeHtml(p).replace(/\n/g, "<br>")))
    .join("");

  const body = `
    ${paragraphs || paragraph("Salut! Avem noutăți de la NOVRA.")}
    ${emailButton(getSiteOrigin(), "Vizitează NOVRA")}
  `;

  const html = wrapEmailHtml(safeSubject, body);

  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    const ok = await sendEmail({ to: email, subject: safeSubject, html });
    if (ok) sent += 1;
    else failed += 1;
  }

  console.log("[email] Newsletter broadcast complete:", { sent, failed, total: emails.length });
  return { sent, failed };
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
  const body = `
    ${paragraph("Ai solicitat resetarea parolei contului NOVRA. Apasă butonul de mai jos pentru a alege o parolă nouă. Linkul expiră în 60 de minute.")}
    ${emailButton(resetUrl, "Resetează parola")}
    ${paragraph("Dacă nu ai solicitat resetarea, ignoră acest email.")}
  `;

  return sendEmail({
    to: email,
    subject: "Resetare parolă NOVRA",
    html: wrapEmailHtml("Resetare parolă", body),
  });
}

export async function sendAbandonedCartReminderEmail(input: {
  email: string;
  items: Array<{
    title: string;
    variantLabel: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalPrice: number;
}): Promise<boolean> {
  const checkoutUrl = `${getSiteOrigin()}/checkout`;

  const itemsHtml = input.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#374151;">${escapeHtml(item.title)} (${escapeHtml(item.variantLabel)}) ×${item.quantity}</td>
          <td style="padding:8px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111111;text-align:right;white-space:nowrap;">${formatRon(item.unitPrice * item.quantity)}</td>
        </tr>`
    )
    .join("");

  const body = `
    ${paragraph("Bună!<br>Ai lăsat produse în coșul tău NOVRA. Le-am păstrat pentru tine — finalizează comanda când ești gata.")}
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:16px;">
      ${itemsHtml}
      <tr><td colspan="2" style="border-top:1px solid #e5e7eb;padding-top:12px;"></td></tr>
      <tr>
        <td style="padding:8px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;font-weight:700;color:#111111;">Total coș</td>
        <td style="padding:8px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;font-weight:700;color:#111111;text-align:right;">${formatRon(input.totalPrice)}</td>
      </tr>
    </table>
    ${emailButton(checkoutUrl, "Finalizează comanda")}
  `;

  return sendEmail({
    to: input.email,
    subject: "Ai produse în coș — finalizează comanda NOVRA",
    html: wrapEmailHtml("Ai uitat ceva în coș?", body, "Produsele tale te așteaptă în checkout."),
  });
}

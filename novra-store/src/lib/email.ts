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
import { appendEmailLog } from "./email-log-server";
import {
  getAutomationMeta,
  isAutomationEnabled,
  recordAutomationRun,
  type EmailAutomationKey,
} from "./email-automations-server";
import {
  applyTemplatePlaceholders,
  getEmailTemplate,
  renderEmailTemplateHtml,
  resolveTemplateSubject,
  type EmailTemplateId,
} from "./email-templates-server";

const NOTIFIABLE_STATUSES: OrderStatus[] = ["processing", "shipped", "delivered", "cancelled"];

const STATUS_AUTOMATION_KEY: Partial<Record<OrderStatus, EmailAutomationKey>> = {
  processing: "orderProcessing",
  shipped: "orderShipped",
  delivered: "orderDelivered",
  cancelled: "orderCancelled",
};

const STATUS_TEMPLATE_ID: Partial<Record<OrderStatus, EmailTemplateId>> = {
  processing: "order_processing",
  shipped: "order_shipped",
  delivered: "order_delivered",
  cancelled: "order_cancelled",
};

const STATUS_LOG_TYPE: Partial<Record<OrderStatus, string>> = {
  processing: "order_processing",
  shipped: "order_shipped",
  delivered: "order_delivered",
  cancelled: "order_cancelled",
};

let transporter: Transporter | null | undefined;

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  logType?: string;
  automationKey?: EmailAutomationKey;
  templateId?: EmailTemplateId;
};

export type SendEmailResult = {
  ok: boolean;
  messageId?: string;
  error?: string;
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

export function getAdminNotificationEmail(): string {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail) return adminEmail;

  const from = process.env.SMTP_FROM?.trim() ?? "";
  const match = from.match(/<([^>]+)>/);
  if (match?.[1]) return match[1].trim().toLowerCase();

  const smtpUser = process.env.SMTP_USER?.trim().toLowerCase();
  if (smtpUser) return smtpUser;

  return "support@novra.ro";
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
  const result = await sendEmailDetailed(input);
  return result.ok;
}

export async function sendEmailDetailed(input: SendEmailInput): Promise<SendEmailResult> {
  const recipients = Array.isArray(input.to) ? input.to : [input.to];
  const normalizedRecipients = recipients.map((email) => email.trim()).filter(Boolean);

  const logType = input.logType ?? "general";
  const recipientLabel = normalizedRecipients.join(", ");
  const templateLabel = input.templateId ?? "custom";

  console.log(`[EMAIL] Tip email: ${logType}`);
  console.log(`[EMAIL] Destinatar: ${recipientLabel}`);
  console.log(`[EMAIL] Template folosit: ${templateLabel}`);

  if (normalizedRecipients.length === 0) {
    console.warn("[EMAIL ERROR] Niciun destinatar.");
    return { ok: false, error: "Niciun destinatar." };
  }

  if (!isEmailsEnabled()) {
    console.log("[EMAIL ERROR] EMAILS_ENABLED nu este activ.");
    return { ok: false, error: "EMAILS_ENABLED nu este activ." };
  }

  const transport = getTransporter();
  const from = getFromAddress();

  if (!transport || !from) {
    console.warn("[EMAIL ERROR] SMTP neconfigurat — setează SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.");
    return { ok: false, error: "SMTP neconfigurat." };
  }

  console.log("[EMAIL] SMTP conectat");

  try {
    const info = await transport.sendMail({
      from,
      to: recipientLabel,
      subject: input.subject,
      html: input.html,
      text: input.text ?? htmlToPlainText(input.html),
    });

    console.log("[EMAIL] Trimis cu succes");
    void appendEmailLog({
      to: recipientLabel,
      subject: input.subject,
      type: logType,
      status: "sent",
      sentAt: new Date().toISOString(),
      messageId: info.messageId,
    });

    if (input.automationKey) {
      void recordAutomationRun(input.automationKey);
    }

    return { ok: true, messageId: info.messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Eroare necunoscută la trimitere.";
    console.error(`[EMAIL ERROR] ${errorMessage}`);
    void appendEmailLog({
      to: recipientLabel,
      subject: input.subject,
      type: logType,
      status: "failed",
      sentAt: new Date().toISOString(),
      error: errorMessage,
    });
    return { ok: false, error: errorMessage };
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

function paymentMethodLabel(order: Order): string {
  if (order.paymentMethod === "card") return "Plată cu cardul";
  if (order.paymentMethod === "credits") return "NovraCredits";
  return "Ramburs (numerar la livrare)";
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

function orderTemplateVars(order: Order): Record<string, string> {
  return {
    purchaseCode: order.purchaseCode,
    customerName: order.address.name,
    customerEmail: order.userEmail,
    total: order.total.toFixed(2),
    paymentMethod: paymentMethodLabel(order),
    status: ORDER_STATUS_LABELS[order.status],
  };
}

function buildOrderSummaryHtml(order: Order, options?: { includeTrackLink?: boolean }): string {
  const paymentLabel = paymentMethodLabel(order);
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

  const trackLink = options?.includeTrackLink === false ? "" : trackOrderLinkHtml(order.purchaseCode);

  return `
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
    ${trackLink}
  `;
}

async function buildOrderEmailHtml(
  templateId: EmailTemplateId,
  order: Order,
  extraBlocks = ""
): Promise<{ html: string; subject: string }> {
  const template = await getEmailTemplate(templateId);
  const vars = orderTemplateVars(order);
  const intro = applyTemplatePlaceholders(template.content, vars);
  const body = `
    ${paragraph(`Bună, <strong style="color:#111111;">${escapeHtml(order.address.name)}</strong>!<br>${escapeHtml(intro)}`)}
    ${extraBlocks}
    ${buildOrderSummaryHtml(order, { includeTrackLink: true })}
  `;

  return {
    subject: resolveTemplateSubject(template, vars),
    html: wrapEmailHtml(
      applyTemplatePlaceholders(template.title, vars),
      body,
      applyTemplatePlaceholders(template.subtitle || template.previewText, vars)
    ),
  };
}

/** Send confirmation email if enabled and not already sent. Returns true when email was sent. */
export async function trySendOrderConfirmationEmail(
  order: Order,
  orderEmailsEnabled: boolean
): Promise<boolean> {
  const automationOn = await isAutomationEnabled("orderConfirmation");
  if (!isEmailsEnabled() || !orderEmailsEnabled || !automationOn) {
    console.log("[EMAIL] Order confirmation skipped — disabled for", order.purchaseCode);
    return false;
  }
  if (order.confirmationEmailSent) return false;
  if (!order.userEmail?.trim()) {
    console.warn("[EMAIL ERROR] Missing customer email — skipping confirmation for", order.purchaseCode);
    return false;
  }
  return sendOrderConfirmationEmail(order);
}

export async function sendOrderConfirmationEmail(order: Order): Promise<boolean> {
  const template = await getEmailTemplate("order_confirmation");
  const vars = orderTemplateVars(order);
  const intro = `${applyTemplatePlaceholders(template.content, vars)}<br>${confirmationIntro(order)}`;
  const body = `
    ${paragraph(`Bună, <strong style="color:#111111;">${escapeHtml(order.address.name)}</strong>!<br>${intro}`)}
    ${buildOrderSummaryHtml(order, { includeTrackLink: true })}
  `;

  return sendEmail({
    to: order.userEmail,
    subject: resolveTemplateSubject(template, vars),
    html: wrapEmailHtml(
      applyTemplatePlaceholders(template.title, vars),
      body,
      applyTemplatePlaceholders(template.subtitle || template.previewText, vars)
    ),
    logType: "order_confirmation",
    automationKey: "orderConfirmation",
    templateId: "order_confirmation",
  });
}

function buildStatusExtraBlocks(order: Order, status: OrderStatus): string {
  const awb = order.awbTracking?.trim();
  const trackingUrl = awb ? buildFanCourierTrackingUrl(awb) : "";

  if (awb && status === "shipped") {
    return `${highlightBox("Număr AWB", awb)}${emailButton(trackingUrl, "Urmărește coletul Fan Courier")}`;
  }
  return "";
}

/** Trimite email de status doar când statusul s-a schimbat și nu a fost deja notificat pentru acel status. */
export async function trySendOrderStatusEmail(
  order: Order,
  previousStatus: OrderStatus,
  orderEmailsEnabled: boolean
): Promise<{ sent: boolean; status?: OrderStatus; scheduleReview?: boolean }> {
  if (!isEmailsEnabled() || !orderEmailsEnabled) return { sent: false };
  if (!order.userEmail?.trim()) return { sent: false };
  if (order.status === previousStatus) return { sent: false };
  if (!NOTIFIABLE_STATUSES.includes(order.status)) return { sent: false };
  if (order.statusEmailsSent?.[order.status]) return { sent: false };

  const automationKey = STATUS_AUTOMATION_KEY[order.status];
  if (automationKey && !(await isAutomationEnabled(automationKey))) {
    console.log(`[EMAIL] Status email skipped — automation ${automationKey} disabled for`, order.purchaseCode);
    return { sent: false };
  }

  const sent = await sendOrderStatusEmail(order, order.status);
  return sent
    ? { sent: true, status: order.status, scheduleReview: order.status === "delivered" }
    : { sent: false };
}

export async function sendOrderStatusEmail(order: Order, status: OrderStatus): Promise<boolean> {
  const templateId = STATUS_TEMPLATE_ID[status] ?? "order_processing";
  const automationKey = STATUS_AUTOMATION_KEY[status];
  const extraBlocks = buildStatusExtraBlocks(order, status);
  const { html, subject } = await buildOrderEmailHtml(templateId, order, extraBlocks);

  return sendEmail({
    to: order.userEmail,
    subject,
    html,
    logType: STATUS_LOG_TYPE[status] ?? "order_status",
    automationKey,
    templateId,
  });
}

export async function sendTrackingEmail(order: Order, awb: string): Promise<boolean> {
  const trackingUrl = buildFanCourierTrackingUrl(awb);
  const template = await getEmailTemplate("order_shipped");
  const vars = orderTemplateVars(order);

  const body = `
    ${paragraph(`Bună, <strong style="color:#111111;">${escapeHtml(order.address.name)}</strong>!<br>${escapeHtml(applyTemplatePlaceholders(template.content, vars))}`)}
    ${highlightBox("Număr AWB", awb)}
    ${paragraph("Poți urmări coletul folosind linkul de mai jos:")}
    ${emailButton(trackingUrl, "Urmărește coletul")}
    ${trackOrderLinkHtml(order.purchaseCode)}
  `;

  return sendEmail({
    to: order.userEmail,
    subject: resolveTemplateSubject(template, vars),
    html: wrapEmailHtml(
      applyTemplatePlaceholders(template.title, vars),
      body,
      applyTemplatePlaceholders(template.subtitle || template.previewText, vars)
    ),
    logType: "order_shipped",
    automationKey: "orderShipped",
    templateId: "order_shipped",
  });
}

export async function trySendAdminNewOrderEmail(
  order: Order,
  orderEmailsEnabled: boolean
): Promise<boolean> {
  if (!isEmailsEnabled() || !orderEmailsEnabled) return false;
  if (!(await isAutomationEnabled("adminNewOrder"))) {
    console.log("[EMAIL] Admin new order skipped — automation disabled for", order.purchaseCode);
    return false;
  }
  return sendAdminNewOrderEmail(order);
}

export async function sendAdminNewOrderEmail(order: Order): Promise<boolean> {
  const template = await getEmailTemplate("admin_new_order");
  const vars = orderTemplateVars(order);
  const itemsSummary = order.items
    .map((item) => `${item.title} (${item.variantLabel}) ×${item.quantity}`)
    .join(", ");

  const body = `
    ${renderEmailTemplateHtml(template, vars)}
    ${infoPanel(`
      <p style="margin:0 0 8px;"><strong style="color:#111111;">Produse:</strong> ${escapeHtml(itemsSummary)}</p>
      <p style="margin:0 0 8px;"><strong style="color:#111111;">Telefon:</strong> ${escapeHtml(order.address.phone || "—")}</p>
      <p style="margin:0;"><strong style="color:#111111;">Adresă:</strong> ${escapeHtml(order.address.address)}, ${escapeHtml(order.address.city)}</p>
    `)}
  `;

  return sendEmail({
    to: getAdminNotificationEmail(),
    subject: resolveTemplateSubject(template, vars),
    html: body,
    logType: "admin_new_order",
    automationKey: "adminNewOrder",
    templateId: "admin_new_order",
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
  console.log("[EMAIL] Tip email: welcome");
  console.log(`[EMAIL] Destinatar: ${email}`);

  const welcomeOn = await isAutomationEnabled("welcome");
  if (!welcomeOn) {
    console.log("[EMAIL] Welcome automation disabled — skipping for", email);
    return false;
  }

  const template = await getEmailTemplate("welcome");
  const customContent = welcomeTemplate?.trim()
    ? formatNewsletterWelcomePreview(welcomeTemplate, discountCode, discountPercent)
    : applyTemplatePlaceholders(template.content, {
        code: discountCode,
        percent: String(discountPercent),
      });

  const vars = { code: discountCode, percent: String(discountPercent) };
  const body = `
    ${paragraph(`Bună!<br>${escapeHtml(customContent)}`)}
    ${highlightBox("Cod reducere", discountCode, `${discountPercent}% reducere la prima comandă`)}
    ${paragraph("Introdu codul la checkout. Valabil o singură dată per email.")}
    ${emailButton(getSiteOrigin(), template.buttonText || "Vizitează NOVRA")}
  `;

  return sendEmail({
    to: email,
    subject: applyTemplatePlaceholders(template.subject, vars),
    html: wrapEmailHtml(
      applyTemplatePlaceholders(template.title, vars),
      body,
      applyTemplatePlaceholders(template.subtitle || template.previewText, vars)
    ),
    logType: "welcome",
    automationKey: "welcome",
    templateId: "welcome",
  });
}

export async function sendNewsletterBroadcastEmail(
  emails: string[],
  subject?: string,
  bodyText?: string,
  previewText?: string
): Promise<{ sent: number; failed: number }> {
  if (!isEmailsEnabled()) {
    console.log("[EMAIL ERROR] EMAILS_ENABLED nu este activ — skipping newsletter broadcast");
    return { sent: 0, failed: emails.length };
  }

  const newsletterOn = await isAutomationEnabled("newsletter");
  if (!newsletterOn) {
    console.log("[EMAIL] Newsletter automation disabled — skipping broadcast");
    return { sent: 0, failed: emails.length };
  }

  const template = await getEmailTemplate("newsletter");
  const safeSubject = subject?.trim() || template.subject;
  const content = bodyText?.trim() || template.content;
  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => paragraph(escapeHtml(p).replace(/\n/g, "<br>")))
    .join("");

  const body = `
    ${paragraphs || paragraph("Salut! Avem noutăți de la NOVRA.")}
    ${emailButton(template.buttonLink || getSiteOrigin(), template.buttonText || "Vizitează NOVRA")}
  `;

  const html = wrapEmailHtml(safeSubject, body, previewText?.trim() || template.previewText);

  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    const ok = await sendEmail({
      to: email,
      subject: safeSubject,
      html,
      logType: "newsletter",
      automationKey: "newsletter",
      templateId: "newsletter",
    });
    if (ok) sent += 1;
    else failed += 1;
  }

  return { sent, failed };
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
  const resetOn = await isAutomationEnabled("passwordReset");
  if (!resetOn) {
    console.log("[EMAIL] Password reset automation disabled — skipping for", email);
    return false;
  }

  const template = await getEmailTemplate("password_reset");
  const config = {
    ...template,
    buttonLink: resetUrl,
  };
  const html = renderEmailTemplateHtml(config);

  return sendEmail({
    to: email,
    subject: template.subject,
    html,
    logType: "password_reset",
    automationKey: "passwordReset",
    templateId: "password_reset",
  });
}

export async function sendContactFormEmails(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ confirmationSent: boolean; adminSent: boolean }> {
  const vars = {
    name: input.name,
    email: input.email,
    subject: input.subject,
    message: input.message,
  };

  let confirmationSent = false;
  let adminSent = false;

  if (await isAutomationEnabled("contactConfirmation")) {
    const template = await getEmailTemplate("contact_confirmation");
    confirmationSent = await sendEmail({
      to: input.email,
      subject: resolveTemplateSubject(template, vars),
      html: renderEmailTemplateHtml(template, vars),
      logType: "contact_confirmation",
      automationKey: "contactConfirmation",
      templateId: "contact_confirmation",
    });
  } else {
    console.log("[EMAIL] Contact confirmation skipped — automation disabled");
  }

  if (await isAutomationEnabled("contactAdmin")) {
    const template = await getEmailTemplate("contact_admin");
    adminSent = await sendEmail({
      to: getAdminNotificationEmail(),
      subject: resolveTemplateSubject(template, vars),
      html: renderEmailTemplateHtml(template, vars),
      logType: "contact_admin",
      automationKey: "contactAdmin",
      templateId: "contact_admin",
    });
  } else {
    console.log("[EMAIL] Contact admin notification skipped — automation disabled");
  }

  return { confirmationSent, adminSent };
}

export async function sendReviewRequestEmail(order: Order): Promise<boolean> {
  if (!order.userEmail?.trim()) return false;

  const reviewOn = await isAutomationEnabled("reviewRequest");
  if (!reviewOn) {
    console.log("[EMAIL] Review request skipped — automation disabled for", order.purchaseCode);
    return false;
  }

  const template = await getEmailTemplate("review_request");
  const vars = orderTemplateVars(order);

  return sendEmail({
    to: order.userEmail,
    subject: resolveTemplateSubject(template, vars),
    html: renderEmailTemplateHtml(template, vars),
    logType: "review_request",
    automationKey: "reviewRequest",
    templateId: "review_request",
  });
}

export async function scheduleReviewRequestAfterDelivery(order: Order): Promise<string | null> {
  if (order.reviewEmailSent) return null;
  if (!order.userEmail?.trim()) return null;
  if (!(await isAutomationEnabled("reviewRequest"))) return null;

  const meta = await getAutomationMeta("reviewRequest");
  const delayMs = Math.max(0, meta.delayMinutes) * 60 * 1000;

  if (delayMs === 0) {
    const sent = await sendReviewRequestEmail(order);
    return sent ? "sent" : null;
  }

  return new Date(Date.now() + delayMs).toISOString();
}

export async function sendGiftCardEmail(input: {
  email: string;
  amount: number;
  balance: number;
}): Promise<boolean> {
  if (!(await isAutomationEnabled("giftCard"))) {
    console.log("[EMAIL] Gift card email skipped — automation disabled for", input.email);
    return false;
  }

  const template = await getEmailTemplate("gift_card");
  const vars = {
    amount: String(input.amount),
    balance: String(input.balance),
  };

  return sendEmail({
    to: input.email,
    subject: resolveTemplateSubject(template, vars),
    html: renderEmailTemplateHtml(template, vars),
    logType: "gift_card",
    automationKey: "giftCard",
    templateId: "gift_card",
  });
}

export async function sendStoreCreditEmail(input: {
  email: string;
  amount: number;
  balance: number;
  description: string;
}): Promise<boolean> {
  if (!(await isAutomationEnabled("storeCredit"))) {
    console.log("[EMAIL] Store credit email skipped — automation disabled for", input.email);
    return false;
  }

  const template = await getEmailTemplate("store_credit");
  const vars = {
    amount: String(Math.abs(input.amount)),
    balance: String(input.balance),
    description: input.description,
  };

  return sendEmail({
    to: input.email,
    subject: template.subject,
    html: renderEmailTemplateHtml(template, vars),
    logType: "store_credit",
    automationKey: "storeCredit",
    templateId: "store_credit",
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
    logType: "abandoned_cart",
  });
}

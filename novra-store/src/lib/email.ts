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
import {
  type EmailRole,
  getContactNotificationEmail,
  getOrdersNotificationEmail,
  getSupportNotificationEmail,
  resolveFromAddress,
  resolveFromRole,
} from "./email-config";
import type { ReturnRequest } from "./returns-types";

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
  fromRole?: EmailRole;
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

function getFromAddress(role?: EmailRole): string | null {
  return resolveFromAddress(role);
}

/** @deprecated Use getOrdersNotificationEmail / getContactNotificationEmail / getSupportNotificationEmail */
export function getAdminNotificationEmail(): string | null {
  const orders = getOrdersNotificationEmail();
  if (orders) return orders;
  console.warn("[ADMIN] SMTP_ORDERS_EMAIL / ADMIN_EMAIL nu este setat — notificările admin nu pot fi trimise.");
  return null;
}

async function verifySmtpTransport(transport: Transporter): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await transport.verify();
    return { ok: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Verificare SMTP eșuată.";
    transporter = null;
    return { ok: false, error: errorMessage };
  }
}

function logEmailResult(input: {
  template: string;
  recipient: string;
  smtp: string;
  status: "sent" | "failed";
  messageId?: string;
  error?: string;
}): void {
  const parts = [
    `template: ${input.template}`,
    `recipient: ${input.recipient}`,
    `smtp: ${input.smtp}`,
    `status: ${input.status}`,
    `messageId: ${input.messageId ?? "—"}`,
    `error: ${input.error ?? "—"}`,
  ];
  const line = `[EMAIL] ${parts.join(" | ")}`;
  if (input.status === "sent") {
    console.log(line);
  } else {
    console.error(line);
  }
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
  const templateLabel = input.templateId ?? logType ?? "custom";
  const fromRole = resolveFromRole({
    logType,
    templateId: input.templateId,
    fromRole: input.fromRole,
  });
  const from = getFromAddress(fromRole);

  if (normalizedRecipients.length === 0) {
    logEmailResult({
      template: templateLabel,
      recipient: "—",
      smtp: from ?? "—",
      status: "failed",
      error: "Niciun destinatar.",
    });
    return { ok: false, error: "Niciun destinatar." };
  }

  if (!isEmailsEnabled()) {
    logEmailResult({
      template: templateLabel,
      recipient: recipientLabel,
      smtp: from ?? "—",
      status: "failed",
      error: "EMAILS_ENABLED nu este activ.",
    });
    return { ok: false, error: "EMAILS_ENABLED nu este activ." };
  }

  const transport = getTransporter();

  if (!transport || !from) {
    logEmailResult({
      template: templateLabel,
      recipient: recipientLabel,
      smtp: "—",
      status: "failed",
      error: "SMTP neconfigurat.",
    });
    console.warn("[SMTP] Neconfigurat — setează SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.");
    return { ok: false, error: "SMTP neconfigurat." };
  }

  const verifyResult = await verifySmtpTransport(transport);
  if (!verifyResult.ok) {
    logEmailResult({
      template: templateLabel,
      recipient: recipientLabel,
      smtp: from,
      status: "failed",
      error: verifyResult.error,
    });
    void appendEmailLog({
      to: recipientLabel,
      subject: input.subject,
      type: logType,
      status: "failed",
      sentAt: new Date().toISOString(),
      error: verifyResult.error,
    });
    return { ok: false, error: verifyResult.error };
  }

  try {
    const info = await transport.sendMail({
      from,
      to: recipientLabel,
      subject: input.subject,
      html: input.html,
      text: input.text ?? htmlToPlainText(input.html),
    });

    logEmailResult({
      template: templateLabel,
      recipient: recipientLabel,
      smtp: from,
      status: "sent",
      messageId: info.messageId,
    });

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
    transporter = null;
    logEmailResult({
      template: templateLabel,
      recipient: recipientLabel,
      smtp: from,
      status: "failed",
      error: errorMessage,
    });
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

  if (sent && order.status === "cancelled") {
    void trySendAdminOrderCancelledEmail(order, orderEmailsEnabled);
  }

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
  const adminEmail = getOrdersNotificationEmail();

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

  console.log(`[ADMIN] Notificare comandă nouă ${order.purchaseCode} → ${adminEmail}`);

  return sendEmail({
    to: adminEmail,
    subject: resolveTemplateSubject(template, vars),
    html: body,
    logType: "admin_new_order",
    automationKey: "adminNewOrder",
    templateId: "admin_new_order",
    fromRole: "noreply",
  });
}

export async function trySendAdminOrderCancelledEmail(
  order: Order,
  orderEmailsEnabled: boolean
): Promise<boolean> {
  if (!isEmailsEnabled() || !orderEmailsEnabled) return false;
  if (!(await isAutomationEnabled("adminOrderCancelled"))) {
    console.log("[EMAIL] Admin order cancelled skipped — automation disabled for", order.purchaseCode);
    return false;
  }
  return sendAdminOrderCancelledEmail(order);
}

export async function sendAdminOrderCancelledEmail(order: Order): Promise<boolean> {
  const adminEmail = getOrdersNotificationEmail();
  const template = await getEmailTemplate("admin_order_cancelled");
  const vars = orderTemplateVars(order);

  console.log(`[ADMIN] Notificare comandă anulată ${order.purchaseCode} → ${adminEmail}`);

  return sendEmail({
    to: adminEmail,
    subject: resolveTemplateSubject(template, vars),
    html: renderEmailTemplateHtml(template, vars),
    logType: "admin_order_cancelled",
    automationKey: "adminOrderCancelled",
    templateId: "admin_order_cancelled",
    fromRole: "noreply",
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
    console.log(`[CUSTOMER] Confirmare contact → ${input.email}`);
    const template = await getEmailTemplate("contact_confirmation");
    confirmationSent = await sendEmail({
      to: input.email,
      subject: resolveTemplateSubject(template, vars),
      html: renderEmailTemplateHtml(template, vars),
      logType: "contact_confirmation",
      automationKey: "contactConfirmation",
      templateId: "contact_confirmation",
      fromRole: "contact",
    });
  } else {
    console.log("[EMAIL] Contact confirmation skipped — automation disabled");
  }

  if (await isAutomationEnabled("contactAdmin")) {
    const adminEmail = getContactNotificationEmail();
    console.log(`[ADMIN] Notificare contact → ${adminEmail}`);
    const template = await getEmailTemplate("contact_admin");
    adminSent = await sendEmail({
      to: adminEmail,
      subject: resolveTemplateSubject(template, vars),
      html: renderEmailTemplateHtml(template, vars),
      logType: "contact_admin",
      automationKey: "contactAdmin",
      templateId: "contact_admin",
      fromRole: "noreply",
    });
  } else {
    console.log("[EMAIL] Contact admin notification skipped — automation disabled");
  }

  return { confirmationSent, adminSent };
}

export async function sendReviewSubmissionEmails(input: {
  name: string;
  email: string;
  rating: string;
  message: string;
}): Promise<{ confirmationSent: boolean; adminSent: boolean }> {
  const subject = "Recenzie NOVRA";
  const message = `Rating: ${input.rating}\n\n${input.message}`;
  const vars = {
    name: input.name,
    email: input.email,
    subject,
    message,
  };

  console.log(`[EMAIL] Trimitere recenzie de la ${input.name} (${input.email})`);

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
      fromRole: "contact",
    });
  }

  if (await isAutomationEnabled("contactAdmin")) {
    const supportEmail = getSupportNotificationEmail();
    console.log(`[ADMIN] Notificare recenzie → ${supportEmail}`);
    const template = await getEmailTemplate("contact_admin");
    adminSent = await sendEmail({
      to: supportEmail,
      subject: resolveTemplateSubject(template, vars),
      html: renderEmailTemplateHtml(template, vars),
      logType: "contact_admin",
      automationKey: "contactAdmin",
      templateId: "contact_admin",
      fromRole: "noreply",
    });
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
    fromRole: "noreply",
  });
}

export async function sendSubscriptionConfirmationEmail(
  email: string,
  name?: string
): Promise<boolean> {
  if (!(await isAutomationEnabled("subscriptionConfirmation"))) {
    console.log("[EMAIL] Subscription confirmation skipped — automation disabled for", email);
    return false;
  }

  const template = await getEmailTemplate("subscription_confirmation");
  const vars = { name: name?.trim() || "abonat NOVRA", email };

  return sendEmail({
    to: email,
    subject: resolveTemplateSubject(template, vars),
    html: renderEmailTemplateHtml(template, vars),
    logType: "subscription_confirmation",
    automationKey: "subscriptionConfirmation",
    templateId: "subscription_confirmation",
    fromRole: "newsletter",
  });
}

export async function sendAccountConfirmationEmail(input: {
  email: string;
  name: string;
  credits?: number;
}): Promise<boolean> {
  if (!(await isAutomationEnabled("accountConfirmation"))) {
    console.log("[EMAIL] Account confirmation skipped — automation disabled for", input.email);
    return false;
  }

  const template = await getEmailTemplate("account_confirmation");
  const vars = {
    name: input.name,
    email: input.email,
    credits: String(input.credits ?? 50),
  };

  return sendEmail({
    to: input.email,
    subject: resolveTemplateSubject(template, vars),
    html: renderEmailTemplateHtml(template, vars),
    logType: "account_confirmation",
    automationKey: "accountConfirmation",
    templateId: "account_confirmation",
    fromRole: "noreply",
  });
}

export async function sendEmailVerificationEmail(input: {
  email: string;
  name: string;
  verifyUrl: string;
}): Promise<boolean> {
  if (!(await isAutomationEnabled("emailVerification"))) {
    console.log("[EMAIL] Email verification skipped — automation disabled for", input.email);
    return false;
  }

  const template = await getEmailTemplate("email_verification");
  const config = {
    ...template,
    buttonLink: input.verifyUrl,
  };
  const vars = { name: input.name, email: input.email };

  return sendEmail({
    to: input.email,
    subject: resolveTemplateSubject(template, vars),
    html: renderEmailTemplateHtml(config, vars),
    logType: "email_verification",
    automationKey: "emailVerification",
    templateId: "email_verification",
    fromRole: "noreply",
  });
}

export async function sendReturnRequestAdminEmail(returnRequest: ReturnRequest): Promise<boolean> {
  if (!(await isAutomationEnabled("returnRequestAdmin"))) {
    console.log("[EMAIL] Return request admin skipped — automation disabled for", returnRequest.orderCode);
    return false;
  }

  const template = await getEmailTemplate("return_request_admin");
  const vars = {
    orderCode: returnRequest.orderCode,
    name: returnRequest.userName ?? returnRequest.userEmail,
    email: returnRequest.userEmail,
    reason: returnRequest.reason,
    description: returnRequest.description,
  };
  const supportEmail = getSupportNotificationEmail();

  console.log(`[ADMIN] Cerere retur nouă ${returnRequest.orderCode} → ${supportEmail}`);

  return sendEmail({
    to: supportEmail,
    subject: resolveTemplateSubject(template, vars),
    html: renderEmailTemplateHtml(template, vars),
    logType: "return_request_admin",
    automationKey: "returnRequestAdmin",
    templateId: "return_request_admin",
    fromRole: "noreply",
  });
}

export async function sendReturnApprovedEmail(returnRequest: ReturnRequest): Promise<boolean> {
  if (!(await isAutomationEnabled("returnApproved"))) {
    console.log("[EMAIL] Return approved skipped — automation disabled for", returnRequest.orderCode);
    return false;
  }

  const template = await getEmailTemplate("return_approved");
  const adminNote = returnRequest.adminNote?.trim()
    ? returnRequest.adminNote.trim()
    : "Urmează instrucțiunile primite de la echipa NOVRA.";
  const vars = {
    orderCode: returnRequest.orderCode,
    name: returnRequest.userName ?? returnRequest.userEmail,
    email: returnRequest.userEmail,
    adminNote,
  };

  return sendEmail({
    to: returnRequest.userEmail,
    subject: resolveTemplateSubject(template, vars),
    html: renderEmailTemplateHtml(template, vars),
    logType: "return_approved",
    automationKey: "returnApproved",
    templateId: "return_approved",
    fromRole: "noreply",
  });
}

export async function sendRefundEmail(returnRequest: ReturnRequest): Promise<boolean> {
  if (!(await isAutomationEnabled("refund"))) {
    console.log("[EMAIL] Refund email skipped — automation disabled for", returnRequest.orderCode);
    return false;
  }

  const template = await getEmailTemplate("refund");
  const adminNote = returnRequest.adminNote?.trim()
    ? returnRequest.adminNote.trim()
    : "Rambursarea va apărea în contul tău bancar în 3–10 zile lucrătoare.";
  const vars = {
    orderCode: returnRequest.orderCode,
    name: returnRequest.userName ?? returnRequest.userEmail,
    email: returnRequest.userEmail,
    adminNote,
  };

  return sendEmail({
    to: returnRequest.userEmail,
    subject: resolveTemplateSubject(template, vars),
    html: renderEmailTemplateHtml(template, vars),
    logType: "refund",
    automationKey: "refund",
    templateId: "refund",
    fromRole: "noreply",
  });
}

export async function trySendReturnStatusEmails(
  returnRequest: ReturnRequest,
  previousStatus: ReturnRequest["status"]
): Promise<{ approved?: boolean; refund?: boolean; admin?: boolean }> {
  const result: { approved?: boolean; refund?: boolean; admin?: boolean } = {};

  if (returnRequest.status === previousStatus) return result;

  if (returnRequest.status === "approved" && previousStatus !== "approved") {
    result.approved = await sendReturnApprovedEmail(returnRequest);
  }

  if (returnRequest.status === "completed" && previousStatus !== "completed") {
    result.refund = await sendRefundEmail(returnRequest);
  }

  return result;
}

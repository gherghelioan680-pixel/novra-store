import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import { formatOrderDate } from "./date-utils";
import { resolveOrderCustomerEmail, type Order, type OrderStatus } from "./orders";
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
  getEmailTemplate,
  renderEmailFromTemplate,
  getSampleTemplateVariables,
  type RenderEmailTemplateOptions,
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
import { buildSampleOrderForTemplate } from "./email-sample-data";

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

export type SendTemplatedEmailOptions = {
  logType?: string;
  automationKey?: EmailAutomationKey;
  fromRole?: EmailRole;
  appendHtml?: string;
  configOverrides?: RenderEmailTemplateOptions["configOverrides"];
};

/** Central send path — loads template from Email Center DB and renders via renderEmailFromTemplate. */
export async function sendTemplatedEmail(
  templateId: EmailTemplateId,
  to: string | string[],
  variables: Record<string, string | undefined | null>,
  options?: SendTemplatedEmailOptions
): Promise<boolean> {
  const { html, subject } = await renderEmailFromTemplate(templateId, variables, {
    appendHtml: options?.appendHtml,
    configOverrides: options?.configOverrides,
  });

  return sendEmail({
    to,
    subject,
    html,
    logType: options?.logType ?? templateId,
    automationKey: options?.automationKey,
    templateId,
    fromRole: options?.fromRole,
  });
}

const ORDER_EMAIL_TEMPLATES: EmailTemplateId[] = [
  "order_confirmation",
  "order_processing",
  "order_shipped",
  "order_delivered",
  "order_cancelled",
  "review_request",
  "admin_new_order",
  "admin_order_cancelled",
];

/** Preview/test rendering — same engine as production sends, with realistic sample data. */
export async function renderSampleTemplatePreview(
  templateId: EmailTemplateId,
  options?: RenderEmailTemplateOptions & { recipientEmail?: string }
): Promise<{ html: string; subject: string; previewText: string }> {
  if (ORDER_EMAIL_TEMPLATES.includes(templateId)) {
    const order = buildSampleOrderForTemplate(templateId, options?.recipientEmail);
    const awb = templateId === "order_shipped" ? order.awbTracking ?? "FC1234567890" : undefined;
    const paymentIntro = templateId === "order_confirmation" ? confirmationIntro(order) : undefined;
    const { vars, appendHtml } = buildTemplateVariables(templateId, { order, awb, paymentIntro });
    return renderEmailFromTemplate(templateId, vars, {
      appendHtml,
      configOverrides: options?.configOverrides,
    });
  }

  const sampleVars = getSampleTemplateVariables(templateId);
  return renderEmailFromTemplate(templateId, sampleVars, options);
}

export type TemplateVariableContext =
  | { order: Order; awb?: string; paymentIntro?: string }
  | { email: string; name?: string; discountCode?: string; discountPercent?: number }
  | { email: string; resetUrl: string }
  | { email: string; name: string; verifyUrl: string }
  | { email: string; name: string; credits?: number }
  | { name: string; email: string; subject: string; message: string }
  | { name: string; email: string; title?: string; rating: number | string; product?: string; date: string }
  | { email: string; amount: number; balance: number; giftCardCode?: string }
  | { email: string; amount: number; balance: number; description: string }
  | { returnRequest: ReturnRequest }
  | { newsletterSubject?: string; newsletterBody?: string; newsletterPreview?: string };

function resolveOrderCustomerName(order: Order): string {
  return (order.address?.name?.trim() || order.userName?.trim() || "").trim();
}

function buildOrderItemsSummary(order: Order): string {
  if (!order.items?.length) return "—";
  return order.items
    .map((item) => `${item.title} (${item.variantLabel}) ×${item.quantity}`)
    .join(", ");
}

function buildShippingAddressText(order: Order): string {
  return [
    order.address.address,
    order.address.city,
    order.address.county,
    order.address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

function logProductionOrderEmail(type: string, order: Order): void {
  const itemCount = order.items?.length ?? 0;
  const total = Number.isFinite(order.total) ? order.total.toFixed(2) : "0.00";
  console.log(
    `[ORDER EMAIL] type: ${type} purchaseCode: ${order.purchaseCode} items: ${itemCount} total: ${total}`
  );
}

function withVariableAliases(vars: Record<string, string>): Record<string, string> {
  const next = { ...vars };
  if (next.purchaseCode && !next.orderNumber) next.orderNumber = next.purchaseCode;
  if (next.orderNumber && !next.purchaseCode) next.purchaseCode = next.orderNumber;
  if (next.orderCode && !next.purchaseCode) next.purchaseCode = next.orderCode;
  if (next.purchaseCode && !next.orderCode) next.orderCode = next.purchaseCode;
  if (next.orderCode && !next.returnNumber) next.returnNumber = next.orderCode;
  if (next.amount && !next.giftCardAmount) next.giftCardAmount = next.amount;
  if (next.amount && !next.creditAmount) next.creditAmount = next.amount;
  if (next.balance && !next.creditBalance) next.creditBalance = next.balance;
  if (next.reason && !next.returnReason) next.returnReason = next.reason;
  return next;
}

/** Build variable map and optional append blocks per template type. */
export function buildTemplateVariables(
  templateId: EmailTemplateId,
  context: TemplateVariableContext
): { vars: Record<string, string>; appendHtml?: string; configOverrides?: RenderEmailTemplateOptions["configOverrides"] } {
  const site = getSiteOrigin();
  const reviewUrl = `${site}/recenzii`;

  if ("order" in context) {
    const { order, awb, paymentIntro } = context;
    const base = withVariableAliases({
      ...orderTemplateVars(order),
      name: resolveOrderCustomerName(order),
      email: resolveOrderCustomerEmail(order),
      orderDate: formatOrderDate(order.createdAt),
      shippingDate: order.updatedAt ? formatOrderDate(order.updatedAt) : "",
      deliveryDate: order.status === "delivered" && order.updatedAt ? formatOrderDate(order.updatedAt) : "",
      trackingNumber: awb ?? order.awbTracking?.trim() ?? "",
      courier: "Fan Courier",
      reviewUrl,
      paymentIntro: paymentIntro ?? "",
      registerDate: formatOrderDate(order.createdAt),
    });

    let appendHtml = buildOrderSummaryHtml(order, { includeTrackLink: templateId !== "order_shipped" });
    if (awb && templateId === "order_shipped") {
      const trackingUrl = buildFanCourierTrackingUrl(awb);
      appendHtml = `${highlightBox("Număr AWB", awb)}${paragraph("Poți urmări coletul folosind linkul de mai jos:")}${emailButton(trackingUrl, "Urmărește coletul")}${appendHtml}`;
    } else if (order.awbTracking?.trim() && templateId === "order_shipped") {
      appendHtml = buildStatusExtraBlocks(order, "shipped") + appendHtml;
    }

    if (templateId === "admin_new_order") {
      const itemsSummary = order.items
        .map((item) => `${item.title} (${item.variantLabel}) ×${item.quantity}`)
        .join(", ");
      appendHtml = `${appendHtml}${infoPanel(`
        <p style="margin:0 0 8px;"><strong style="color:#111111;">Produse:</strong> ${escapeHtml(itemsSummary)}</p>
        <p style="margin:0 0 8px;"><strong style="color:#111111;">Telefon:</strong> ${escapeHtml(order.address.phone || "—")}</p>
        <p style="margin:0;"><strong style="color:#111111;">Adresă:</strong> ${escapeHtml(order.address.address)}, ${escapeHtml(order.address.city)}</p>
      `)}`;
    }

    return { vars: base, appendHtml };
  }

  if ("returnRequest" in context) {
    const { returnRequest } = context;
    const adminNote =
      returnRequest.adminNote?.trim() ||
      (templateId === "refund"
        ? "Rambursarea va apărea în contul tău bancar în 3–10 zile lucrătoare."
        : "Urmează instrucțiunile primite de la echipa NOVRA.");
    return {
      vars: withVariableAliases({
        orderCode: returnRequest.orderCode,
        orderNumber: returnRequest.orderCode,
        purchaseCode: returnRequest.orderCode,
        returnNumber: returnRequest.orderCode,
        name: returnRequest.userName ?? returnRequest.userEmail,
        email: returnRequest.userEmail,
        reason: returnRequest.reason,
        returnReason: returnRequest.reason,
        message: returnRequest.description,
        description: returnRequest.description,
        adminNote,
        refundAmount: "",
        refundMethod: "",
        refundDate: new Date(returnRequest.updatedAt).toLocaleDateString("ro-RO"),
        date: new Date(returnRequest.updatedAt).toLocaleDateString("ro-RO"),
      }),
    };
  }

  if ("resetUrl" in context && "email" in context && !("verifyUrl" in context)) {
    return {
      vars: withVariableAliases({
        email: context.email,
        resetUrl: context.resetUrl,
        expiresIn: "60 minute",
      }),
    };
  }

  if ("verifyUrl" in context && "name" in context) {
    return {
      vars: withVariableAliases({
        name: context.name,
        email: context.email,
        verificationUrl: context.verifyUrl,
      }),
    };
  }

  if ("discountCode" in context || (templateId === "welcome" && "email" in context)) {
    const ctx = context as { email: string; name?: string; discountCode?: string; discountPercent?: number };
    return {
      vars: withVariableAliases({
        email: ctx.email,
        name: ctx.name?.trim() || "",
        code: ctx.discountCode ?? "",
        percent: ctx.discountPercent != null ? String(ctx.discountPercent) : "",
      }),
    };
  }

  if ("newsletterSubject" in context || templateId === "newsletter") {
    const ctx = context as {
      newsletterSubject?: string;
      newsletterBody?: string;
      newsletterPreview?: string;
    };
    return {
      vars: withVariableAliases({ email: "newsletter@novra.ro", name: "abonat NOVRA" }),
      configOverrides: {
        subject: ctx.newsletterSubject,
        content: ctx.newsletterBody,
        previewText: ctx.newsletterPreview,
      },
    };
  }

  if ("subject" in context && "message" in context && "name" in context) {
    return {
      vars: withVariableAliases({
        name: context.name,
        email: context.email,
        subject: context.subject,
        message: context.message,
        ticketNumber: `TKT-${Date.now().toString(36).toUpperCase()}`,
        date: new Date().toLocaleDateString("ro-RO"),
      }),
    };
  }

  if (
    templateId === "review_approved" &&
    "name" in context &&
    "rating" in context &&
    "date" in context
  ) {
    const ctx = context as {
      name: string;
      email: string;
      title?: string;
      rating: number | string;
      product?: string;
      date: string;
    };
    return {
      vars: withVariableAliases({
        name: ctx.name,
        email: ctx.email,
        title: ctx.title?.trim() || "Recenzie NOVRA",
        rating: String(ctx.rating),
        product: ctx.product?.trim() || "NOVRA",
        date: ctx.date,
        reviewUrl,
      }),
    };
  }

  if ("giftCardCode" in context || (templateId === "gift_card" && "amount" in context)) {
    const ctx = context as { email: string; amount: number; balance: number; giftCardCode?: string };
    return {
      vars: withVariableAliases({
        email: ctx.email,
        amount: String(ctx.amount),
        balance: String(ctx.balance),
        giftCardAmount: String(ctx.amount),
        giftCardCode: ctx.giftCardCode ?? "",
        creditAmount: String(ctx.amount),
        creditBalance: String(ctx.balance),
      }),
    };
  }

  if ("description" in context && "amount" in context) {
    const ctx = context as { email: string; amount: number; balance: number; description: string };
    return {
      vars: withVariableAliases({
        email: ctx.email,
        amount: String(Math.abs(ctx.amount)),
        balance: String(ctx.balance),
        creditAmount: String(Math.abs(ctx.amount)),
        creditBalance: String(ctx.balance),
        description: ctx.description,
      }),
    };
  }

  if ("credits" in context && "name" in context) {
    const ctx = context as { email: string; name: string; credits?: number };
    return {
      vars: withVariableAliases({
        name: ctx.name,
        email: ctx.email,
        credits: String(ctx.credits ?? 50),
        registerDate: new Date().toLocaleDateString("ro-RO"),
        date: new Date().toLocaleDateString("ro-RO"),
      }),
    };
  }

  if ("email" in context && "name" in context && templateId === "subscription_confirmation") {
    const ctx = context as { email: string; name?: string };
    return {
      vars: withVariableAliases({
        email: ctx.email,
        name: ctx.name?.trim() || "abonat NOVRA",
      }),
    };
  }

  return { vars: withVariableAliases({}) };
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
  if (!order.items?.length) {
    return `<tr>
          <td colspan="2" style="padding:8px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#6b7280;">Nu există produse înregistrate pentru această comandă.</td>
        </tr>`;
  }

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
    orderNumber: order.purchaseCode,
    orderCode: order.purchaseCode,
    customerName: resolveOrderCustomerName(order),
    customerEmail: resolveOrderCustomerEmail(order),
    total: order.total.toFixed(2),
    paymentMethod: paymentMethodLabel(order),
    status: ORDER_STATUS_LABELS[order.status],
    shippingAddress: buildShippingAddressText(order),
    phone: order.address.phone?.trim() || "",
    itemsCount: String(order.items?.length ?? 0),
    itemsSummary: buildOrderItemsSummary(order),
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

function logOrderConfirmationAttempt(input: {
  recipient: string;
  subject: string;
  template: string;
  smtp: string;
  success: boolean;
  messageId?: string;
  error?: string;
}): void {
  console.log(`[EMAIL] Recipient: ${input.recipient}`);
  console.log(`[EMAIL] Subject: ${input.subject}`);
  console.log(`[EMAIL] Template: ${input.template}`);
  console.log(`[EMAIL] SMTP: ${input.smtp}`);
  console.log(`[EMAIL] Success: ${input.success ? "true" : "false"}`);
  console.log(`[EMAIL] MessageId: ${input.messageId ?? "—"}`);
  if (input.error) {
    console.error(`[EMAIL] Error: ${input.error}`);
  }
}

/** Send confirmation email if enabled and not already sent. Returns true when email was sent. */
export async function trySendOrderConfirmationEmail(
  order: Order,
  orderEmailsEnabled: boolean
): Promise<boolean> {
  const recipient = resolveOrderCustomerEmail(order);

  if (!isEmailsEnabled()) {
    console.log(
      `[EMAIL] Order confirmation skipped — EMAILS_ENABLED=false for ${order.purchaseCode} (recipient: ${recipient || "—"})`
    );
    return false;
  }

  if (!orderEmailsEnabled) {
    console.log(
      `[EMAIL] Order confirmation skipped — orderEmailsEnabled=false for ${order.purchaseCode} (recipient: ${recipient || "—"})`
    );
    return false;
  }

  if (order.confirmationEmailSent) {
    console.log(`[EMAIL] Order confirmation skipped — already sent for ${order.purchaseCode}`);
    return false;
  }

  if (!recipient) {
    console.error(
      `[EMAIL] Error: Missing customer email — userEmail=${order.userEmail || "—"}, address.email=${order.address?.email || "—"} — skipping confirmation for ${order.purchaseCode}`
    );
    return false;
  }

  if (recipient !== order.userEmail) {
    console.log(
      `[EMAIL] Using resolved customer email ${recipient} (order.userEmail=${order.userEmail || "—"}) for ${order.purchaseCode}`
    );
  }

  return sendOrderConfirmationEmail(order, recipient);
}

export async function sendOrderConfirmationEmail(
  order: Order,
  recipientEmail?: string
): Promise<boolean> {
  const recipient = (recipientEmail ?? resolveOrderCustomerEmail(order)).trim().toLowerCase();
  logProductionOrderEmail("order_confirmation", order);
  const { vars, appendHtml } = buildTemplateVariables("order_confirmation", {
    order,
    paymentIntro: confirmationIntro(order),
  });
  const fromRole = resolveFromRole({
    logType: "order_confirmation",
    templateId: "order_confirmation",
  });
  const smtpFrom = getFromAddress(fromRole) ?? "—";
  const rendered = await renderEmailFromTemplate("order_confirmation", vars, { appendHtml });

  const result = await sendEmailDetailed({
    to: recipient,
    subject: rendered.subject,
    html: rendered.html,
    logType: "order_confirmation",
    automationKey: "orderConfirmation",
    templateId: "order_confirmation",
    fromRole,
  });

  logOrderConfirmationAttempt({
    recipient,
    subject: rendered.subject,
    template: "order_confirmation",
    smtp: smtpFrom,
    success: result.ok,
    messageId: result.messageId,
    error: result.error,
  });

  return result.ok;
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
  if (!resolveOrderCustomerEmail(order)) return { sent: false };
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
  const recipient = resolveOrderCustomerEmail(order);
  if (!recipient) {
    console.error(`[ORDER EMAIL] Missing recipient for ${templateId} — ${order.purchaseCode}`);
    return false;
  }

  logProductionOrderEmail(templateId, order);
  const orderForTemplate = order.status === status ? order : { ...order, status };
  const { vars, appendHtml } = buildTemplateVariables(templateId, { order: orderForTemplate });

  return sendTemplatedEmail(templateId, recipient, vars, {
    appendHtml,
    logType: STATUS_LOG_TYPE[status] ?? "order_status",
    automationKey,
  });
}

export async function sendTrackingEmail(order: Order, awb: string): Promise<boolean> {
  const recipient = resolveOrderCustomerEmail(order);
  if (!recipient) {
    console.error(`[ORDER EMAIL] Missing recipient for order_shipped — ${order.purchaseCode}`);
    return false;
  }

  logProductionOrderEmail("order_shipped", order);
  const { vars, appendHtml } = buildTemplateVariables("order_shipped", { order, awb });

  return sendTemplatedEmail("order_shipped", recipient, vars, {
    appendHtml,
    logType: "order_shipped",
    automationKey: "orderShipped",
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
  logProductionOrderEmail("admin_new_order", order);
  const { vars, appendHtml } = buildTemplateVariables("admin_new_order", { order });

  console.log(`[ADMIN] Notificare comandă nouă ${order.purchaseCode} → ${adminEmail}`);

  return sendTemplatedEmail("admin_new_order", adminEmail, vars, {
    appendHtml,
    logType: "admin_new_order",
    automationKey: "adminNewOrder",
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
  logProductionOrderEmail("admin_order_cancelled", order);
  const { vars, appendHtml } = buildTemplateVariables("admin_order_cancelled", { order });

  console.log(`[ADMIN] Notificare comandă anulată ${order.purchaseCode} → ${adminEmail}`);

  return sendTemplatedEmail("admin_order_cancelled", adminEmail, vars, {
    appendHtml,
    logType: "admin_order_cancelled",
    automationKey: "adminOrderCancelled",
    fromRole: "noreply",
  });
}

export async function sendNewsletterWelcomeEmail(
  email: string,
  discountCode: string,
  discountPercent: number,
  name?: string
): Promise<boolean> {
  console.log("[EMAIL] Tip email: welcome");
  console.log(`[EMAIL] Destinatar: ${email}`);

  const welcomeOn = await isAutomationEnabled("welcome");
  if (!welcomeOn) {
    console.log("[EMAIL] Welcome automation disabled — skipping for", email);
    return false;
  }

  const { vars } = buildTemplateVariables("welcome", {
    email,
    name,
    discountCode,
    discountPercent,
  });

  console.log(
    `[EMAIL] Welcome template vars: code=${vars.code}, percent=${vars.percent}, name=${vars.name || "—"}, email=${vars.email}`
  );

  return sendTemplatedEmail("welcome", email, vars, {
    logType: "welcome",
    automationKey: "welcome",
    fromRole: "newsletter",
  });
}

const BROADCAST_BATCH_SIZE = 50;

export async function sendNewsletterBroadcastEmail(
  emails: string[],
  subject?: string,
  bodyText?: string,
  previewText?: string,
  options?: { bypassAutomationGate?: boolean }
): Promise<{ sent: number; failed: number; total: number }> {
  const normalized = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  const total = normalized.length;

  if (total === 0) {
    console.log("[BROADCAST] No recipients — skipping newsletter broadcast");
    return { sent: 0, failed: 0, total: 0 };
  }

  console.log(
    `[BROADCAST] Starting newsletter broadcast: total=${total}, bypassAutomation=${Boolean(options?.bypassAutomationGate)}`
  );

  if (!isEmailsEnabled()) {
    console.log("[BROADCAST] EMAILS_ENABLED nu este activ — skipping newsletter broadcast");
    return { sent: 0, failed: total, total };
  }

  if (!options?.bypassAutomationGate) {
    const newsletterOn = await isAutomationEnabled("newsletter");
    if (!newsletterOn) {
      console.log("[BROADCAST] Newsletter automation disabled — skipping newsletter broadcast");
      return { sent: 0, failed: total, total };
    }
  }

  const template = await getEmailTemplate("newsletter");
  const { vars, configOverrides } = buildTemplateVariables("newsletter", {
    newsletterSubject: subject?.trim() || template.subject,
    newsletterBody: bodyText?.trim() || template.content,
    newsletterPreview: previewText?.trim() || template.previewText,
  });

  const rendered = await renderEmailFromTemplate("newsletter", vars, { configOverrides });

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < normalized.length; i += 1) {
    const email = normalized[i];
    const ok = await sendEmail({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      logType: "newsletter",
      automationKey: "newsletter",
      templateId: "newsletter",
    });
    if (ok) sent += 1;
    else failed += 1;

    const processed = i + 1;
    if (processed % BROADCAST_BATCH_SIZE === 0 || processed === total) {
      console.log(`[BROADCAST] Batch progress: processed=${processed}/${total}, sent=${sent}, failed=${failed}`);
    }

    if (processed % BROADCAST_BATCH_SIZE === 0 && processed < total) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log(`[BROADCAST] Complete: total=${total}, sent=${sent}, failed=${failed}`);
  return { sent, failed, total };
}

export type TemplateBroadcastRecipient = {
  email: string;
  name?: string;
};

export type TemplateBroadcastOptions = {
  templateId: EmailTemplateId;
  recipients: TemplateBroadcastRecipient[];
  subjectOverride?: string;
  contentOverride?: string;
  previewTextOverride?: string;
  titleOverride?: string;
  subtitleOverride?: string;
  buttonTextOverride?: string;
  buttonLinkOverride?: string;
  /** Admin manual broadcasts bypass the newsletter automation toggle. */
  bypassAutomationGate?: boolean;
};

/** Send a saved Email Center template to newsletter subscribers with optional overrides. */
export async function sendTemplateBroadcastEmail(
  options: TemplateBroadcastOptions
): Promise<{ sent: number; failed: number; total: number }> {
  const recipients = options.recipients
    .map((r) => ({
      email: r.email.trim().toLowerCase(),
      name: r.name?.trim(),
    }))
    .filter((r) => r.email);

  const total = recipients.length;

  if (total === 0) {
    console.log("[BROADCAST] No recipients — skipping template broadcast");
    return { sent: 0, failed: 0, total: 0 };
  }

  console.log(
    `[BROADCAST] Starting template broadcast: template=${options.templateId}, total=${total}, bypassAutomation=${Boolean(options.bypassAutomationGate)}`
  );

  if (!isEmailsEnabled()) {
    console.log("[BROADCAST] EMAILS_ENABLED nu este activ — skipping template broadcast");
    return { sent: 0, failed: total, total };
  }

  if (!options.bypassAutomationGate) {
    const newsletterOn = await isAutomationEnabled("newsletter");
    if (!newsletterOn) {
      console.log("[BROADCAST] Newsletter automation disabled — skipping template broadcast");
      return { sent: 0, failed: total, total };
    }
  }

  const configOverrides: RenderEmailTemplateOptions["configOverrides"] = {};
  if (options.subjectOverride?.trim()) configOverrides.subject = options.subjectOverride.trim();
  if (options.contentOverride?.trim()) configOverrides.content = options.contentOverride.trim();
  if (options.previewTextOverride?.trim()) configOverrides.previewText = options.previewTextOverride.trim();
  if (options.titleOverride?.trim()) configOverrides.title = options.titleOverride.trim();
  if (options.subtitleOverride?.trim()) configOverrides.subtitle = options.subtitleOverride.trim();
  if (options.buttonTextOverride?.trim()) configOverrides.buttonText = options.buttonTextOverride.trim();
  if (options.buttonLinkOverride?.trim()) configOverrides.buttonLink = options.buttonLinkOverride.trim();

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += 1) {
    const { email, name } = recipients[i];
    const subscriberName = name || email.split("@")[0] || "abonat NOVRA";
    const vars = withVariableAliases({ email, name: subscriberName });

    const rendered = await renderEmailFromTemplate(options.templateId, vars, { configOverrides });

    const ok = await sendEmail({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      logType: "template_broadcast",
      automationKey: "newsletter",
      templateId: options.templateId,
      fromRole: "newsletter",
    });

    if (ok) sent += 1;
    else failed += 1;

    const processed = i + 1;
    if (processed % BROADCAST_BATCH_SIZE === 0 || processed === total) {
      console.log(`[BROADCAST] Batch progress: processed=${processed}/${total}, sent=${sent}, failed=${failed}`);
    }

    if (processed % BROADCAST_BATCH_SIZE === 0 && processed < total) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log(`[BROADCAST] Complete: total=${total}, sent=${sent}, failed=${failed}`);
  return { sent, failed, total };
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
  const resetOn = await isAutomationEnabled("passwordReset");
  if (!resetOn) {
    console.log("[EMAIL] Password reset automation disabled — skipping for", email);
    return false;
  }

  const { vars } = buildTemplateVariables("password_reset", { email, resetUrl });

  return sendTemplatedEmail("password_reset", email, vars, {
    logType: "password_reset",
    automationKey: "passwordReset",
  });
}

export async function sendContactFormEmails(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ confirmationSent: boolean; adminSent: boolean }> {
  let confirmationSent = false;
  let adminSent = false;

  if (await isAutomationEnabled("contactConfirmation")) {
    console.log(`[CUSTOMER] Confirmare contact → ${input.email}`);
    const { vars } = buildTemplateVariables("contact_confirmation", input);
    confirmationSent = await sendTemplatedEmail("contact_confirmation", input.email, vars, {
      logType: "contact_confirmation",
      automationKey: "contactConfirmation",
      fromRole: "contact",
    });
  } else {
    console.log("[EMAIL] Contact confirmation skipped — automation disabled");
  }

  if (await isAutomationEnabled("contactAdmin")) {
    const adminEmail = getContactNotificationEmail();
    console.log(`[ADMIN] Notificare contact → ${adminEmail}`);
    const { vars } = buildTemplateVariables("contact_admin", input);
    adminSent = await sendTemplatedEmail("contact_admin", adminEmail, vars, {
      logType: "contact_admin",
      automationKey: "contactAdmin",
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
  const contactInput = { name: input.name, email: input.email, subject, message };

  console.log(`[REVIEWS] sending notification emails for ${input.name} (${input.email})`);

  let confirmationSent = false;
  let adminSent = false;

  try {
    if (await isAutomationEnabled("contactConfirmation")) {
      const { vars } = buildTemplateVariables("contact_confirmation", contactInput);
      confirmationSent = await sendTemplatedEmail("contact_confirmation", input.email, vars, {
        logType: "contact_confirmation",
        automationKey: "contactConfirmation",
        fromRole: "contact",
      });
    }
  } catch (error) {
    console.error("[REVIEWS] confirmation email failed:", error);
  }

  try {
    if (await isAutomationEnabled("contactAdmin")) {
      const supportEmail = getSupportNotificationEmail();
      console.log(`[REVIEWS] admin notification → ${supportEmail}`);
      const { vars } = buildTemplateVariables("contact_admin", contactInput);
      adminSent = await sendTemplatedEmail("contact_admin", supportEmail, vars, {
        logType: "contact_admin",
        automationKey: "contactAdmin",
        fromRole: "noreply",
      });
    }
  } catch (error) {
    console.error("[REVIEWS] admin notification email failed:", error);
  }

  return { confirmationSent, adminSent };
}

export async function sendReviewRequestEmail(order: Order): Promise<boolean> {
  const recipient = resolveOrderCustomerEmail(order);
  if (!recipient) return false;

  const reviewOn = await isAutomationEnabled("reviewRequest");
  if (!reviewOn) {
    console.log("[EMAIL] Review request skipped — automation disabled for", order.purchaseCode);
    return false;
  }

  logProductionOrderEmail("review_request", order);
  const { vars, appendHtml } = buildTemplateVariables("review_request", { order });

  return sendTemplatedEmail("review_request", recipient, vars, {
    appendHtml,
    logType: "review_request",
    automationKey: "reviewRequest",
  });
}

export async function sendReviewApprovedEmail(review: {
  name: string;
  email?: string;
  title?: string;
  rating: number;
  product?: string;
  date: string;
}): Promise<boolean> {
  const recipient = review.email?.trim().toLowerCase();
  if (!recipient) {
    console.log("[EMAIL] Review approved skipped — no client email for", review.name);
    return false;
  }

  if (!(await isAutomationEnabled("reviewApproved"))) {
    console.log("[EMAIL] Review approved skipped — automation disabled for", recipient);
    return false;
  }

  console.log(`[EMAIL] Review approved → ${recipient} (review by ${review.name})`);
  const { vars } = buildTemplateVariables("review_approved", {
    name: review.name,
    email: recipient,
    title: review.title,
    rating: review.rating,
    product: review.product,
    date: review.date,
  });

  return sendTemplatedEmail("review_approved", recipient, vars, {
    logType: "review_approved",
    automationKey: "reviewApproved",
    fromRole: "noreply",
  });
}

export async function scheduleReviewRequestAfterDelivery(order: Order): Promise<string | null> {
  if (order.reviewEmailSent) return null;
  if (!resolveOrderCustomerEmail(order)) return null;
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

  const { vars } = buildTemplateVariables("gift_card", input);

  return sendTemplatedEmail("gift_card", input.email, vars, {
    logType: "gift_card",
    automationKey: "giftCard",
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

  const { vars } = buildTemplateVariables("store_credit", input);

  return sendTemplatedEmail("store_credit", input.email, vars, {
    logType: "store_credit",
    automationKey: "storeCredit",
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

  const { vars } = buildTemplateVariables("subscription_confirmation", { email, name });

  return sendTemplatedEmail("subscription_confirmation", email, vars, {
    logType: "subscription_confirmation",
    automationKey: "subscriptionConfirmation",
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

  const { vars } = buildTemplateVariables("account_confirmation", input);

  return sendTemplatedEmail("account_confirmation", input.email, vars, {
    logType: "account_confirmation",
    automationKey: "accountConfirmation",
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

  const { vars } = buildTemplateVariables("email_verification", input);

  return sendTemplatedEmail("email_verification", input.email, vars, {
    logType: "email_verification",
    automationKey: "emailVerification",
    fromRole: "noreply",
  });
}

export async function sendReturnRequestAdminEmail(returnRequest: ReturnRequest): Promise<boolean> {
  if (!(await isAutomationEnabled("returnRequestAdmin"))) {
    console.log("[EMAIL] Return request admin skipped — automation disabled for", returnRequest.orderCode);
    return false;
  }

  const { vars } = buildTemplateVariables("return_request_admin", { returnRequest });
  const supportEmail = getSupportNotificationEmail();

  console.log(`[ADMIN] Cerere retur nouă ${returnRequest.orderCode} → ${supportEmail}`);

  return sendTemplatedEmail("return_request_admin", supportEmail, vars, {
    logType: "return_request_admin",
    automationKey: "returnRequestAdmin",
    fromRole: "noreply",
  });
}

export async function sendReturnApprovedEmail(returnRequest: ReturnRequest): Promise<boolean> {
  if (!(await isAutomationEnabled("returnApproved"))) {
    console.log("[EMAIL] Return approved skipped — automation disabled for", returnRequest.orderCode);
    return false;
  }

  const { vars } = buildTemplateVariables("return_approved", { returnRequest });

  return sendTemplatedEmail("return_approved", returnRequest.userEmail, vars, {
    logType: "return_approved",
    automationKey: "returnApproved",
    fromRole: "noreply",
  });
}

export async function sendRefundEmail(returnRequest: ReturnRequest): Promise<boolean> {
  if (!(await isAutomationEnabled("refund"))) {
    console.log("[EMAIL] Refund email skipped — automation disabled for", returnRequest.orderCode);
    return false;
  }

  const { vars } = buildTemplateVariables("refund", { returnRequest });

  return sendTemplatedEmail("refund", returnRequest.userEmail, vars, {
    logType: "refund",
    automationKey: "refund",
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

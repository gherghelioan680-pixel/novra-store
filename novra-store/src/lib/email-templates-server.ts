import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import {
  emailButton,
  escapeHtml,
  getLogoUrl,
  getSiteOrigin,
  paragraph,
  wrapEmailHtml,
} from "@/lib/email-templates";
import { buildSampleOrder } from "@/lib/email-sample-data";
import { ORDER_STATUS_LABELS } from "@/lib/orders";

export type EmailTemplateId =
  | "welcome"
  | "newsletter"
  | "subscription_confirmation"
  | "order_confirmation"
  | "order_processing"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "password_reset"
  | "contact"
  | "contact_confirmation"
  | "contact_admin"
  | "admin_new_order"
  | "admin_order_cancelled"
  | "return_approved"
  | "refund"
  | "return_request_admin"
  | "account_confirmation"
  | "email_verification"
  | "gift_card"
  | "store_credit"
  | "review_request";

export type EmailTemplateColors = {
  primary: string;
  background: string;
  accent: string;
};

export type EmailTemplateConfig = {
  id: EmailTemplateId;
  name: string;
  subject: string;
  previewText: string;
  title: string;
  subtitle: string;
  content: string;
  buttonText: string;
  buttonLink: string;
  footer: string;
  colors: EmailTemplateColors;
  logoUrl: string;
  updatedAt: string;
};

const FILE = "email-templates.json";

export const TEMPLATE_NAMES: Record<EmailTemplateId, string> = {
  welcome: "Bun venit",
  newsletter: "Newsletter",
  subscription_confirmation: "Confirmare abonare newsletter",
  order_confirmation: "Confirmare comandă",
  order_processing: "Comandă în procesare",
  order_shipped: "Comandă expediată",
  order_delivered: "Comandă livrată",
  order_cancelled: "Comandă anulată",
  password_reset: "Resetare parolă",
  contact: "Contact",
  contact_confirmation: "Confirmare contact (client)",
  contact_admin: "Notificare contact (admin)",
  admin_new_order: "Comandă nouă (admin)",
  admin_order_cancelled: "Comandă anulată (admin)",
  return_approved: "Retur aprobat",
  refund: "Rambursare procesată",
  return_request_admin: "Cerere retur nouă (admin)",
  account_confirmation: "Confirmare cont",
  email_verification: "Verificare email",
  gift_card: "Gift Card",
  store_credit: "NovraCredits",
  review_request: "Cerere recenzie",
};

const DEFAULT_COLORS: EmailTemplateColors = {
  primary: "#111111",
  background: "#ffffff",
  accent: "#6b7280",
};

function defaultTemplate(id: EmailTemplateId): EmailTemplateConfig {
  const site = getSiteOrigin();
  const defaults: Record<EmailTemplateId, Omit<EmailTemplateConfig, "id" | "updatedAt">> = {
    welcome: {
      name: TEMPLATE_NAMES.welcome,
      subject: "Codul tău NOVRA — {percent}% reducere la prima comandă",
      previewText: "Codul tău exclusiv te așteaptă",
      title: "Bine ai venit la NOVRA",
      subtitle: "Abonare confirmată la newsletter.",
      content:
        "Mulțumim că te-ai abonat la newsletter-ul NOVRA. Codul tău exclusiv: {code} — {percent}% reducere la prima comandă!",
      buttonText: "Vizitează NOVRA",
      buttonLink: site,
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    newsletter: {
      name: TEMPLATE_NAMES.newsletter,
      subject: "Noutăți de la NOVRA",
      previewText: "Ultimele noutăți de la NOVRA",
      title: "Noutăți de la NOVRA",
      subtitle: "Rămâi la curent cu produsele noastre.",
      content: "Salut! Avem noutăți de la NOVRA — cabluri și adaptoare premium pentru setup-ul tău.",
      buttonText: "Vizitează NOVRA",
      buttonLink: site,
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    subscription_confirmation: {
      name: TEMPLATE_NAMES.subscription_confirmation,
      subject: "Abonare newsletter confirmată — NOVRA",
      previewText: "Te-ai abonat cu succes la newsletter-ul NOVRA",
      title: "Abonare confirmată",
      subtitle: "Mulțumim că te-ai abonat la newsletter-ul NOVRA.",
      content:
        "Bună, {name}! Abonarea ta la newsletter-ul NOVRA a fost confirmată. Vei primi noutăți despre produse, promoții și lansări.",
      buttonText: "Vizitează NOVRA",
      buttonLink: site,
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    order_confirmation: {
      name: TEMPLATE_NAMES.order_confirmation,
      subject: "Confirmare comandă NOVRA — {purchaseCode}",
      previewText: "Comanda ta a fost înregistrată",
      title: "Confirmare comandă",
      subtitle: "Comanda ta a fost înregistrată cu succes.",
      content:
        "Bună, {name}! Mulțumim pentru comanda ta! Am înregistrat-o și te vom contacta pentru livrare. {paymentIntro}",
      buttonText: "Urmărește comanda",
      buttonLink: `${site}/urmareste-comanda?code={purchaseCode}`,
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    order_processing: {
      name: TEMPLATE_NAMES.order_processing,
      subject: "Comanda {purchaseCode} este în procesare",
      previewText: "Pregătim comanda ta",
      title: "Comanda ta este în procesare",
      subtitle: "Pregătim produsele pentru expediere.",
      content:
        "Comanda ta {purchaseCode} este acum în procesare. Pregătim produsele și te vom anunța când coletul pleacă spre tine.",
      buttonText: "Urmărește comanda",
      buttonLink: `${site}/urmareste-comanda?code={purchaseCode}`,
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    order_shipped: {
      name: TEMPLATE_NAMES.order_shipped,
      subject: "Comanda {purchaseCode} a fost expediată",
      previewText: "Coletul tău este în drum",
      title: "Coletul tău este în drum",
      subtitle: "Comanda ta a fost expediată.",
      content: "Comanda ta {purchaseCode} a fost expediată și este în drum spre tine. Poți urmări coletul online.",
      buttonText: "Urmărește coletul",
      buttonLink: `${site}/urmareste-comanda?code={purchaseCode}`,
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    order_delivered: {
      name: TEMPLATE_NAMES.order_delivered,
      subject: "Comanda {purchaseCode} a fost livrată",
      previewText: "Comanda ta a ajuns la destinație",
      title: "Comanda ta a fost livrată",
      subtitle: "Sperăm că te bucuri de produsele NOVRA!",
      content:
        "Comanda ta {purchaseCode} a fost livrată. Sperăm că te bucuri de produsele NOVRA!",
      buttonText: "Lasă o recenzie",
      buttonLink: `${site}/recenzii`,
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    order_cancelled: {
      name: TEMPLATE_NAMES.order_cancelled,
      subject: "Comanda {purchaseCode} a fost anulată",
      previewText: "Comanda a fost anulată",
      title: "Comanda ta a fost anulată",
      subtitle: "Dacă ai întrebări, contactează-ne.",
      content:
        "Comanda ta {purchaseCode} a fost anulată. Dacă ai întrebări sau crezi că este o eroare, contactează-ne la contact@novra.ro.",
      buttonText: "Contactează-ne",
      buttonLink: "mailto:contact@novra.ro",
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    password_reset: {
      name: TEMPLATE_NAMES.password_reset,
      subject: "Resetare parolă NOVRA",
      previewText: "Link securizat pentru resetare parolă",
      title: "Resetare parolă",
      subtitle: "Linkul expiră în 60 de minute.",
      content:
        "Ai solicitat resetarea parolei contului NOVRA. Apasă butonul de mai jos pentru a alege o parolă nouă.",
      buttonText: "Resetează parola",
      buttonLink: "{resetUrl}",
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    contact: {
      name: TEMPLATE_NAMES.contact,
      subject: "Mesaj de la NOVRA",
      previewText: "Răspuns la mesajul tău",
      title: "Mesaj contact NOVRA",
      subtitle: "Mesaj de la echipa NOVRA.",
      content: "Mulțumim pentru mesaj! Echipa NOVRA îți va răspunde cât mai curând posibil.",
      buttonText: "Vizitează NOVRA",
      buttonLink: site,
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    contact_confirmation: {
      name: TEMPLATE_NAMES.contact_confirmation,
      subject: "Am primit mesajul tău — NOVRA",
      previewText: "Confirmare primire mesaj contact",
      title: "Mesajul tău a fost primit",
      subtitle: "Echipa NOVRA îți va răspunde curând.",
      content:
        "Mulțumim, {name}! Am primit mesajul tău cu subiectul „{subject}”. Echipa NOVRA îți va răspunde cât mai curând posibil.",
      buttonText: "Vizitează NOVRA",
      buttonLink: site,
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    contact_admin: {
      name: TEMPLATE_NAMES.contact_admin,
      subject: "Mesaj contact nou — {subject}",
      previewText: "Formular contact NOVRA",
      title: "Mesaj contact nou",
      subtitle: "Formular /contact",
      content:
        "Mesaj nou de la {name} ({email}).\n\nSubiect: {subject}\n\n{message}",
      buttonText: "Deschide admin",
      buttonLink: `${site}/admin`,
      footer: "© NOVRA — Notificare automată",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    admin_new_order: {
      name: TEMPLATE_NAMES.admin_new_order,
      subject: "Comandă nouă NOVRA — {purchaseCode}",
      previewText: "Notificare comandă nouă",
      title: "Comandă nouă",
      subtitle: "Plasată pe novra.ro",
      content:
        "Comandă nouă {purchaseCode} de la {customerName} ({customerEmail}). Total: {total} RON. Plată: {paymentMethod}.",
      buttonText: "Vezi comanda în admin",
      buttonLink: `${site}/admin/comenzi`,
      footer: "© NOVRA — Notificare automată",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    admin_order_cancelled: {
      name: TEMPLATE_NAMES.admin_order_cancelled,
      subject: "Comandă anulată — {purchaseCode}",
      previewText: "Notificare anulare comandă",
      title: "Comandă anulată",
      subtitle: "Status actualizat în admin",
      content:
        "Comanda {purchaseCode} de la {customerName} ({customerEmail}) a fost anulată. Total: {total} RON.",
      buttonText: "Vezi comanda în admin",
      buttonLink: `${site}/admin/comenzi`,
      footer: "© NOVRA — Notificare automată",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    return_approved: {
      name: TEMPLATE_NAMES.return_approved,
      subject: "Retur aprobat — comanda {orderCode}",
      previewText: "Cererea ta de retur a fost aprobată",
      title: "Retur aprobat",
      subtitle: "Comanda {orderCode}",
      content:
        "Bună, {name}! Cererea ta de retur pentru comanda {orderCode} a fost aprobată. {adminNote}",
      buttonText: "Contactează suportul",
      buttonLink: "mailto:support@novra.ro",
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    refund: {
      name: TEMPLATE_NAMES.refund,
      subject: "Rambursare procesată — comanda {orderCode}",
      previewText: "Rambursarea ta a fost procesată",
      title: "Rambursare procesată",
      subtitle: "Comanda {orderCode}",
      content:
        "Bună, {name}! Rambursarea pentru comanda {orderCode} a fost procesată. {adminNote}",
      buttonText: "Vezi comenzile mele",
      buttonLink: `${site}/contul-meu?section=my-orders`,
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    return_request_admin: {
      name: TEMPLATE_NAMES.return_request_admin,
      subject: "Cerere retur nouă — {orderCode}",
      previewText: "Cerere retur de la client",
      title: "Cerere retur nouă",
      subtitle: "Comanda {orderCode}",
      content:
        "Cerere retur de la {name} ({email}) pentru comanda {orderCode}.\n\nMotiv: {reason}\n\n{description}",
      buttonText: "Deschide returnări",
      buttonLink: `${site}/admin/returnari`,
      footer: "© NOVRA — Notificare automată",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    account_confirmation: {
      name: TEMPLATE_NAMES.account_confirmation,
      subject: "Cont NOVRA creat cu succes",
      previewText: "Bine ai venit în contul tău NOVRA",
      title: "Cont creat cu succes",
      subtitle: "Bine ai venit la NOVRA!",
      content:
        "Bună, {name}! Contul tău NOVRA a fost creat cu succes. Ai primit {credits} NovraCredits cadou la înregistrare.",
      buttonText: "Accesează contul",
      buttonLink: `${site}/contul-meu`,
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    email_verification: {
      name: TEMPLATE_NAMES.email_verification,
      subject: "Verifică adresa de email — NOVRA",
      previewText: "Confirmă adresa de email a contului tău",
      title: "Verifică emailul",
      subtitle: "Linkul expiră în 24 de ore.",
      content:
        "Bună, {name}! Te rugăm să confirmi adresa de email apăsând butonul de mai jos pentru a-ți securiza contul NOVRA.",
      buttonText: "Verifică emailul",
      buttonLink: "{verificationUrl}",
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    gift_card: {
      name: TEMPLATE_NAMES.gift_card,
      subject: "Gift Card NOVRA — {amount} NovraCredits",
      previewText: "Creditele tale au fost încărcate",
      title: "Gift Card activat",
      subtitle: "NovraCredits disponibile în cont.",
      content:
        "Plata Gift Card-ului de {amount} Lei a fost confirmată. Ai primit {amount} NovraCredits în contul tău NOVRA.",
      buttonText: "Vezi creditele",
      buttonLink: `${site}/contul-meu?section=my-novra-credits`,
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    store_credit: {
      name: TEMPLATE_NAMES.store_credit,
      subject: "NovraCredits actualizate — NOVRA",
      previewText: "Sold credite actualizat",
      title: "NovraCredits actualizate",
      subtitle: "Soldul contului tău a fost modificat.",
      content:
        "Soldul tău de NovraCredits a fost actualizat. {description} Sold curent: {balance} NovraCredits.",
      buttonText: "Vezi creditele",
      buttonLink: `${site}/contul-meu?section=my-novra-credits`,
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    review_request: {
      name: TEMPLATE_NAMES.review_request,
      subject: "Cum ți se par produsele NOVRA?",
      previewText: "Lasă-ne o recenzie",
      title: "Ne-ar plăcea feedback-ul tău",
      subtitle: "Comanda {purchaseCode} a fost livrată.",
      content:
        "Sperăm că te bucuri de produsele din comanda {purchaseCode}. Ne-ar ajuta mult dacă ne lași o recenzie — durează doar un minut!",
      buttonText: "Lasă o recenzie",
      buttonLink: `${site}/recenzii`,
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
  };

  const base = defaults[id];
  return {
    id,
    ...base,
    updatedAt: new Date().toISOString(),
  };
}

export function isEmailTemplateId(value: string): value is EmailTemplateId {
  return value in TEMPLATE_NAMES;
}

export async function getEmailTemplate(id: EmailTemplateId): Promise<EmailTemplateConfig> {
  const stored = await readJsonFile<Partial<Record<EmailTemplateId, EmailTemplateConfig>>>(FILE, {});
  const saved = stored[id];
  if (saved) {
    return {
      ...defaultTemplate(id),
      ...saved,
      id,
      colors: { ...DEFAULT_COLORS, ...saved.colors },
    };
  }
  return defaultTemplate(id);
}

const ADMIN_TEMPLATE_IDS: EmailTemplateId[] = [
  "contact_admin",
  "admin_new_order",
  "admin_order_cancelled",
  "return_request_admin",
];

export async function getAllEmailTemplates(): Promise<EmailTemplateConfig[]> {
  const ids = Object.keys(TEMPLATE_NAMES) as EmailTemplateId[];
  return Promise.all(
    ids
      .filter((id) => id !== "order_cancelled" && !ADMIN_TEMPLATE_IDS.includes(id))
      .map((id) => getEmailTemplate(id))
  );
}

export async function saveEmailTemplate(
  id: EmailTemplateId,
  updates: Partial<Omit<EmailTemplateConfig, "id">>
): Promise<EmailTemplateConfig> {
  const current = await getEmailTemplate(id);
  const next: EmailTemplateConfig = {
    ...current,
    ...updates,
    id,
    colors: { ...current.colors, ...updates.colors },
    updatedAt: new Date().toISOString(),
  };

  const stored = await readJsonFile<Partial<Record<EmailTemplateId, EmailTemplateConfig>>>(FILE, {});
  stored[id] = next;
  await writeJsonFile(FILE, stored);
  return next;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Normalize variable map — missing/undefined/null values become empty strings. */
export function normalizeTemplateVariables(
  vars: Record<string, string | undefined | null>
): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, rawValue] of Object.entries(vars)) {
    normalized[key] = rawValue == null ? "" : String(rawValue);
  }
  return normalized;
}

/** Replace `{key}` / `{{key}}` placeholders in any template field before send or HTML assembly. */
export function replaceTemplateVariables(
  text: string,
  vars: Record<string, string | undefined | null>
): string {
  const normalized = normalizeTemplateVariables(vars);
  let result = text;
  for (const [key, value] of Object.entries(normalized)) {
    const escapedKey = escapeRegExp(key);
    result = result.replace(new RegExp(`\\{${escapedKey}\\}`, "g"), value);
    result = result.replace(new RegExp(`\\{\\{${escapedKey}\\}\\}`, "g"), value);
  }
  result = result.replace(/\{\{[a-zA-Z0-9_.]+\}\}/g, "");
  result = result.replace(/\{[a-zA-Z0-9_.]+\}/g, "");
  return result;
}

function resolveTemplateLogoUrl(logoUrl: string | undefined): string | null {
  const trimmed = logoUrl?.trim();
  if (trimmed) return trimmed;
  const siteLogo = getLogoUrl()?.trim();
  return siteLogo || null;
}

export function applyTemplatePlaceholders(text: string, vars: Record<string, string>): string {
  return replaceTemplateVariables(text, vars);
}

export type RenderEmailTemplateOptions = {
  appendHtml?: string;
  configOverrides?: Partial<EmailTemplateConfig>;
};

export function renderEmailTemplateHtml(
  config: EmailTemplateConfig,
  vars?: Record<string, string | undefined | null>,
  options?: RenderEmailTemplateOptions
): string {
  const mergedConfig = options?.configOverrides
    ? { ...config, ...options.configOverrides, colors: { ...config.colors, ...options.configOverrides.colors } }
    : config;
  const subjectVars = normalizeTemplateVariables(vars ?? {});
  const resolved = {
    ...mergedConfig,
    subject: replaceTemplateVariables(mergedConfig.subject, subjectVars),
    title: replaceTemplateVariables(mergedConfig.title, subjectVars),
    subtitle: replaceTemplateVariables(mergedConfig.subtitle, subjectVars),
    content: replaceTemplateVariables(mergedConfig.content, subjectVars),
    buttonText: replaceTemplateVariables(mergedConfig.buttonText, subjectVars),
    buttonLink: replaceTemplateVariables(mergedConfig.buttonLink, subjectVars),
    previewText: replaceTemplateVariables(mergedConfig.previewText, subjectVars),
    footer: replaceTemplateVariables(mergedConfig.footer, subjectVars),
  };

  const contentHtml = resolved.content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => paragraph(escapeHtml(block).replace(/\n/g, "<br>")))
    .join("");

  const buttonBlock =
    resolved.buttonText.trim() && resolved.buttonLink.trim()
      ? emailButton(resolved.buttonLink.trim(), resolved.buttonText.trim())
      : "";

  const body = `
    ${contentHtml || (resolved.content.trim() ? paragraph(escapeHtml(resolved.content)) : "")}
    ${options?.appendHtml ?? ""}
    ${buttonBlock}
    ${resolved.footer.trim() ? `<p style="margin:24px 0 0;font-family:system-ui,sans-serif;font-size:12px;color:${escapeHtml(resolved.colors.accent)};text-align:center;">${escapeHtml(resolved.footer)}</p>` : ""}
  `;

  return wrapEmailHtml(resolved.title, body, resolved.subtitle || resolved.previewText, {
    logoUrl: resolveTemplateLogoUrl(mergedConfig.logoUrl),
    primaryColor: resolved.colors.primary,
    backgroundColor: resolved.colors.background,
  });
}

export function resolveTemplateSubject(
  config: EmailTemplateConfig,
  vars?: Record<string, string | undefined | null>
): string {
  return replaceTemplateVariables(config.subject, vars ?? {});
}

export function resolveTemplatePreviewText(
  config: EmailTemplateConfig,
  vars?: Record<string, string | undefined | null>
): string {
  return replaceTemplateVariables(config.previewText, vars ?? {});
}

/** Sample variables for admin preview / test sends. */
export function getSampleTemplateVariables(templateId: EmailTemplateId): Record<string, string> {
  const site = getSiteOrigin();
  const now = new Date().toLocaleDateString("ro-RO");
  const sampleOrder = buildSampleOrder();
  const base: Record<string, string> = {
    name: sampleOrder.address.name,
    email: sampleOrder.userEmail,
    code: "NOVRA10",
    percent: "10",
    verificationUrl: `${site}/contul-meu?verify=test`,
    resetUrl: `${site}/resetare-parola?token=test`,
    orderNumber: sampleOrder.purchaseCode,
    purchaseCode: sampleOrder.purchaseCode,
    orderCode: sampleOrder.purchaseCode,
    orderDate: now,
    shippingDate: now,
    deliveryDate: now,
    trackingNumber: "FC1234567890",
    courier: "Fan Courier",
    total: sampleOrder.total.toFixed(2),
    status: ORDER_STATUS_LABELS[sampleOrder.status],
    returnNumber: "NV-190726-ABC123",
    returnReason: "Produs defect — cablu cu conector slăbit",
    refundAmount: sampleOrder.total.toFixed(2),
    refundMethod: "Card bancar",
    refundDate: now,
    giftCardCode: "NOVRA-GIFT-250",
    giftCardAmount: "250",
    creditAmount: "50",
    creditBalance: "150",
    expiryDate: now,
    reviewUrl: `${site}/recenzii`,
    subject: "Întrebare despre compatibilitate cablu USB-C",
    message: "Bună ziua, aș dori să știu dacă cablul USB-C 100W este compatibil cu MacBook Pro M3.",
    ticketNumber: "TKT-190726-A1B2",
    date: now,
    reason: "Produs defect — cablu cu conector slăbit",
    registerDate: now,
    expiresIn: "60 minute",
    customerName: sampleOrder.address.name,
    customerEmail: sampleOrder.userEmail,
    paymentMethod: "Ramburs (numerar la livrare)",
    paymentIntro:
      "Mulțumim pentru comanda ta! Am înregistrat-o și te vom contacta pentru livrare. Vei plăti numerar la primirea coletului.",
    credits: "50",
    amount: "250",
    balance: "150",
    description: "Bonus fidelitate — prima comandă",
    adminNote: "Retur aprobat. Trimite coletul la adresa indicată în următoarele 14 zile.",
  };

  if (templateId === "gift_card") {
    base.amount = "100";
    base.balance = "150";
    base.giftCardAmount = "100";
  }
  if (templateId === "store_credit") {
    base.amount = "50";
    base.balance = "150";
    base.creditAmount = "50";
    base.creditBalance = "150";
  }

  return base;
}

export async function renderEmailFromTemplate(
  templateId: EmailTemplateId,
  vars?: Record<string, string | undefined | null>,
  options?: RenderEmailTemplateOptions
): Promise<{ html: string; subject: string; previewText: string }> {
  const template = await getEmailTemplate(templateId);
  const normalizedVars = normalizeTemplateVariables(vars ?? {});
  const config = options?.configOverrides
    ? { ...template, ...options.configOverrides, colors: { ...template.colors, ...options.configOverrides.colors } }
    : template;

  return {
    subject: resolveTemplateSubject(config, normalizedVars),
    previewText: resolveTemplatePreviewText(config, normalizedVars),
    html: renderEmailTemplateHtml(template, normalizedVars, options),
  };
}

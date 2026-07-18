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
        "Mulțumim pentru comanda ta! Am înregistrat-o și te vom contacta pentru livrare.",
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
      buttonLink: `${site}/resetare-parola?token=example`,
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
      buttonLink: `${site}/contul-meu?verify=example`,
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

/** Replace `{key}` / `{{key}}` placeholders in any template field before send or HTML assembly. */
export function replaceTemplateVariables(
  text: string,
  vars: Record<string, string | undefined>
): string {
  let result = text;
  for (const [key, rawValue] of Object.entries(vars)) {
    const value = rawValue ?? "";
    const escapedKey = escapeRegExp(key);
    result = result.replace(new RegExp(`\\{${escapedKey}\\}`, "g"), value);
    result = result.replace(new RegExp(`\\{\\{${escapedKey}\\}\\}`, "g"), value);
  }
  result = result.replace(/\{\{[a-zA-Z0-9_.]+\}\}/g, "");
  result = result.replace(/\{[a-zA-Z0-9_.]+\}/g, "");
  return result;
}

export function applyTemplatePlaceholders(text: string, vars: Record<string, string>): string {
  return replaceTemplateVariables(text, vars);
}

export function renderEmailTemplateHtml(
  config: EmailTemplateConfig,
  vars?: Record<string, string>
): string {
  const subjectVars = vars ?? {};
  const resolved = {
    ...config,
    subject: replaceTemplateVariables(config.subject, subjectVars),
    title: replaceTemplateVariables(config.title, subjectVars),
    subtitle: replaceTemplateVariables(config.subtitle, subjectVars),
    content: replaceTemplateVariables(config.content, subjectVars),
    buttonText: replaceTemplateVariables(config.buttonText, subjectVars),
    buttonLink: replaceTemplateVariables(config.buttonLink, subjectVars),
    previewText: replaceTemplateVariables(config.previewText, subjectVars),
    footer: replaceTemplateVariables(config.footer, subjectVars),
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
    ${contentHtml || paragraph(escapeHtml(resolved.content))}
    ${buttonBlock}
    ${resolved.footer.trim() ? `<p style="margin:24px 0 0;font-family:system-ui,sans-serif;font-size:12px;color:${escapeHtml(resolved.colors.accent)};text-align:center;">${escapeHtml(resolved.footer)}</p>` : ""}
  `;

  return wrapEmailHtml(resolved.title, body, resolved.subtitle || resolved.previewText);
}

export function resolveTemplateSubject(config: EmailTemplateConfig, vars?: Record<string, string>): string {
  return replaceTemplateVariables(config.subject, vars ?? {});
}

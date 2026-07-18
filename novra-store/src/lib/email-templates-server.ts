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
  | "order_confirmation"
  | "order_shipped"
  | "password_reset"
  | "contact"
  | "order_cancelled";

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
  order_confirmation: "Confirmare comandă",
  order_shipped: "Comandă expediată",
  password_reset: "Resetare parolă",
  contact: "Contact",
  order_cancelled: "Comandă anulată",
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
      subject: "Bine ai venit la NOVRA",
      previewText: "Codul tău exclusiv te așteaptă",
      title: "Bine ai venit la NOVRA",
      subtitle: "Abonare confirmată la newsletter.",
      content:
        "Mulțumim că te-ai abonat la newsletter-ul NOVRA. Folosește codul de reducere la prima comandă.",
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
    order_confirmation: {
      name: TEMPLATE_NAMES.order_confirmation,
      subject: "Confirmare comandă NOVRA",
      previewText: "Comanda ta a fost înregistrată",
      title: "Confirmare comandă",
      subtitle: "Comanda ta a fost înregistrată cu succes.",
      content:
        "Mulțumim pentru comanda ta! Am înregistrat-o și te vom contacta pentru livrare.",
      buttonText: "Urmărește comanda",
      buttonLink: `${site}/urmareste-comanda`,
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    order_shipped: {
      name: TEMPLATE_NAMES.order_shipped,
      subject: "Comanda ta a fost expediată",
      previewText: "Coletul tău este în drum",
      title: "Coletul tău este în drum",
      subtitle: "Comanda ta a fost expediată.",
      content: "Comanda ta a fost expediată și este în drum spre tine. Poți urmări coletul online.",
      buttonText: "Urmărește coletul",
      buttonLink: `${site}/urmareste-comanda`,
      footer: "© NOVRA — Cabluri & adaptoare premium",
      colors: DEFAULT_COLORS,
      logoUrl: getLogoUrl(),
    },
    order_cancelled: {
      name: TEMPLATE_NAMES.order_cancelled,
      subject: "Comanda ta a fost anulată",
      previewText: "Comanda a fost anulată",
      title: "Comanda ta a fost anulată",
      subtitle: "Dacă ai întrebări, contactează-ne.",
      content:
        "Comanda ta a fost anulată. Dacă ai întrebări sau crezi că este o eroare, contactează-ne la contact@novra.ro.",
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

export async function getAllEmailTemplates(): Promise<EmailTemplateConfig[]> {
  const ids = Object.keys(TEMPLATE_NAMES) as EmailTemplateId[];
  return Promise.all(ids.filter((id) => id !== "order_cancelled").map((id) => getEmailTemplate(id)));
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

export function renderEmailTemplateHtml(config: EmailTemplateConfig): string {
  const contentHtml = config.content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => paragraph(escapeHtml(block).replace(/\n/g, "<br>")))
    .join("");

  const buttonBlock =
    config.buttonText.trim() && config.buttonLink.trim()
      ? emailButton(config.buttonLink.trim(), config.buttonText.trim())
      : "";

  const body = `
    ${contentHtml || paragraph(escapeHtml(config.content))}
    ${buttonBlock}
    ${config.footer.trim() ? `<p style="margin:24px 0 0;font-family:system-ui,sans-serif;font-size:12px;color:${escapeHtml(config.colors.accent)};text-align:center;">${escapeHtml(config.footer)}</p>` : ""}
  `;

  return wrapEmailHtml(config.title, body, config.subtitle || config.previewText);
}

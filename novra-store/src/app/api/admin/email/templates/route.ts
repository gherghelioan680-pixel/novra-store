import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import {
  sendNewsletterWelcomeEmail,
  sendNewsletterBroadcastEmail,
  sendPasswordResetEmail,
} from "@/lib/email";
import { getServerSiteSettings } from "@/lib/site-settings-server";
import { generateNewsletterDiscountCode } from "@/lib/discount-codes";
import { getSiteOrigin, paragraph, wrapEmailHtml } from "@/lib/email-templates";

export const runtime = "nodejs";

export type EmailTemplateId =
  | "welcome"
  | "newsletter"
  | "order_confirmation"
  | "order_shipped"
  | "password_reset"
  | "contact";

const TEMPLATE_LABELS: Record<EmailTemplateId, string> = {
  welcome: "Bun venit",
  newsletter: "Newsletter",
  order_confirmation: "Confirmare comandă",
  order_shipped: "Comandă expediată",
  password_reset: "Resetare parolă",
  contact: "Contact",
};

function isTemplateId(value: string): value is EmailTemplateId {
  return value in TEMPLATE_LABELS;
}

function buildPreviewHtml(templateId: EmailTemplateId): string {
  switch (templateId) {
    case "welcome":
      return wrapEmailHtml(
        "Bine ai venit la NOVRA",
        `${paragraph("Mulțumim că te-ai abonat la newsletter-ul NOVRA.")}${paragraph("Cod reducere exemplu: <strong>NOVRA10-DEMO</strong>")}`,
        "Previzualizare șablon bun venit."
      );
    case "newsletter":
      return wrapEmailHtml(
        "Noutăți de la NOVRA",
        paragraph("Salut! Aceasta este o previzualizare a unui email newsletter NOVRA."),
        "Previzualizare newsletter."
      );
    case "order_confirmation":
      return wrapEmailHtml(
        "Confirmare comandă",
        paragraph("Previzualizare email confirmare comandă — conținut generat din datele comenzii."),
        "Comanda ta a fost înregistrată cu succes."
      );
    case "order_shipped":
      return wrapEmailHtml(
        "Coletul tău este în drum",
        paragraph("Previzualizare email expediere — AWB și link tracking Fan Courier."),
        "Comanda ta a fost expediată."
      );
    case "password_reset":
      return wrapEmailHtml(
        "Resetare parolă",
        paragraph("Previzualizare email resetare parolă cu link securizat."),
        "Link expiră în 60 de minute."
      );
    case "contact":
      return wrapEmailHtml(
        "Mesaj contact NOVRA",
        paragraph("Previzualizare răspuns contact — funcționalitate în dezvoltare."),
        "Mesaj de la echipa NOVRA."
      );
    default:
      return wrapEmailHtml("NOVRA", paragraph("Previzualizare indisponibilă."));
  }
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  const templateId = request.nextUrl.searchParams.get("template");
  if (!templateId || !isTemplateId(templateId)) {
    return Response.json({ error: "Template invalid." }, { status: 400 });
  }

  return Response.json({
    templateId,
    label: TEMPLATE_LABELS[templateId],
    html: buildPreviewHtml(templateId),
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = (await request.json()) as {
      action?: string;
      template?: string;
      to?: string;
    };

    const action = body?.action ?? "preview";
    const templateId = typeof body?.template === "string" ? body.template : "";

    if (!isTemplateId(templateId)) {
      return Response.json({ ok: false, message: "Template invalid." }, { status: 400 });
    }

    if (action === "preview") {
      return Response.json({
        ok: true,
        templateId,
        label: TEMPLATE_LABELS[templateId],
        html: buildPreviewHtml(templateId),
      });
    }

    if (action === "send_test") {
      const to = typeof body?.to === "string" ? body.to.trim() : "";
      if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return Response.json({ ok: false, message: "Introdu o adresă de email validă." }, { status: 400 });
      }

      if (templateId === "order_confirmation" || templateId === "order_shipped" || templateId === "contact") {
        return Response.json({
          ok: false,
          message: "Trimiterea de test pentru acest șablon este în dezvoltare.",
          inDevelopment: true,
        });
      }

      const settings = await getServerSiteSettings();
      let sent = false;

      if (templateId === "welcome") {
        sent = await sendNewsletterWelcomeEmail(
          to,
          generateNewsletterDiscountCode(),
          settings.newsletterDiscountPercent ?? 10,
          settings.newsletterWelcomeMessage
        );
      } else if (templateId === "newsletter") {
        const result = await sendNewsletterBroadcastEmail(
          [to],
          "Test newsletter NOVRA",
          "Acesta este un email de test trimis din Email Center."
        );
        sent = result.sent > 0;
      } else if (templateId === "password_reset") {
        sent = await sendPasswordResetEmail(to, `${getSiteOrigin()}/resetare-parola?token=test`);
      }

      if (!sent) {
        return Response.json({
          ok: false,
          message: "Emailul de test nu a putut fi trimis. Verifică SMTP și EMAILS_ENABLED.",
        });
      }

      return Response.json({ ok: true, message: `Email de test trimis către ${to}.` });
    }

    return Response.json({ ok: false, message: "Acțiune necunoscută." }, { status: 400 });
  } catch {
    return Response.json({ ok: false, message: "Cerere invalidă." }, { status: 400 });
  }
}

export { TEMPLATE_LABELS };

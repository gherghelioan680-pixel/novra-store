import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import {
  getEmailTemplate,
  saveEmailTemplate,
  renderEmailTemplateHtml,
  isEmailTemplateId,
  TEMPLATE_NAMES,
  type EmailTemplateConfig,
  type EmailTemplateId,
} from "@/lib/email-templates-server";
import {
  sendEmail,
  sendNewsletterWelcomeEmail,
  sendNewsletterBroadcastEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendTrackingEmail,
} from "@/lib/email";
import { getServerSiteSettings } from "@/lib/site-settings-server";
import { generateNewsletterDiscountCode } from "@/lib/discount-codes";
import { getSiteOrigin } from "@/lib/email-templates";
import type { Order } from "@/lib/orders";

export const runtime = "nodejs";

export { TEMPLATE_NAMES as TEMPLATE_LABELS };
export type { EmailTemplateId };

function buildSampleOrder(): Order {
  const now = new Date().toISOString();
  return {
    id: "sample-order",
    purchaseCode: "NOVRA-DEMO",
    userId: "guest-demo",
    userEmail: "client@example.com",
    userName: "Client Demo",
    isGuest: true,
    items: [
      {
        productId: "demo",
        title: "Cablu USB-C Premium",
        variantLabel: "2m",
        quantity: 1,
        unitPrice: 49.99,
      },
    ],
    address: {
      name: "Client Demo",
      email: "client@example.com",
      phone: "0700000000",
      address: "Str. Exemplu 1",
      city: "București",
      county: "București",
      notes: "",
    },
    total: 49.99,
    shipping: 0,
    status: "processing",
    paymentMethod: "ramburs",
    paymentStatus: "pending",
    createdAt: now,
    updatedAt: now,
    confirmationEmailSent: false,
  };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  const templateId = request.nextUrl.searchParams.get("template");
  const listAll = request.nextUrl.searchParams.get("all") === "1";

  if (listAll) {
    const ids = Object.keys(TEMPLATE_NAMES) as EmailTemplateId[];
    const templates = await Promise.all(
      ids.filter((id) => id !== "order_cancelled").map((id) => getEmailTemplate(id))
    );
    return Response.json({ templates });
  }

  if (!templateId || !isEmailTemplateId(templateId)) {
    return Response.json({ error: "Template invalid." }, { status: 400 });
  }

  const config = await getEmailTemplate(templateId);
  return Response.json({
    templateId,
    label: TEMPLATE_NAMES[templateId],
    config,
    html: renderEmailTemplateHtml(config),
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = (await request.json()) as {
      action?: string;
      template?: string;
      to?: string;
      config?: Partial<EmailTemplateConfig>;
    };

    const action = body?.action ?? "preview";
    const templateId = typeof body?.template === "string" ? body.template : "";

    if (!isEmailTemplateId(templateId)) {
      return Response.json({ ok: false, message: "Template invalid." }, { status: 400 });
    }

    if (action === "save") {
      const saved = await saveEmailTemplate(templateId, body.config ?? {});
      return Response.json({
        ok: true,
        message: "Șablon salvat.",
        config: saved,
        html: renderEmailTemplateHtml(saved),
      });
    }

    const config =
      action === "preview_live" && body.config
        ? { ...(await getEmailTemplate(templateId)), ...body.config, id: templateId }
        : await getEmailTemplate(templateId);

    if (action === "preview" || action === "preview_live") {
      return Response.json({
        ok: true,
        templateId,
        label: TEMPLATE_NAMES[templateId],
        config,
        html: renderEmailTemplateHtml(config as EmailTemplateConfig),
      });
    }

    if (action === "send_test") {
      const to = typeof body?.to === "string" ? body.to.trim() : "";
      if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return Response.json({ ok: false, message: "Introdu o adresă de email validă." }, { status: 400 });
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
        const tpl = await getEmailTemplate("newsletter");
        const result = await sendNewsletterBroadcastEmail(
          [to],
          tpl.subject,
          tpl.content,
          tpl.previewText
        );
        sent = result.sent > 0;
      } else if (templateId === "password_reset") {
        sent = await sendPasswordResetEmail(to, `${getSiteOrigin()}/resetare-parola?token=test`);
      } else if (templateId === "order_confirmation") {
        const sample = buildSampleOrder();
        sample.userEmail = to;
        sample.address.email = to;
        sent = await sendOrderConfirmationEmail(sample);
      } else if (templateId === "order_shipped") {
        const sample = buildSampleOrder();
        sample.userEmail = to;
        sample.address.email = to;
        sample.status = "shipped";
        sample.awbTracking = "DEMO123456";
        sent = await sendTrackingEmail(sample, "DEMO123456");
      } else if (templateId === "contact") {
        const tpl = await getEmailTemplate("contact");
        sent = await sendEmail({
          to,
          subject: tpl.subject,
          html: renderEmailTemplateHtml(tpl),
          logType: "contact",
        });
      } else if (templateId === "order_cancelled") {
        const sample = buildSampleOrder();
        sample.userEmail = to;
        sample.address.email = to;
        sample.status = "cancelled";
        sent = await sendOrderStatusEmail(sample, "cancelled");
      } else {
        const tpl = await getEmailTemplate(templateId);
        sent = await sendEmail({
          to,
          subject: tpl.subject,
          html: renderEmailTemplateHtml(tpl),
          logType: templateId,
        });
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

import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import {
  getEmailTemplate,
  saveEmailTemplate,
  renderEmailTemplateHtml,
  renderEmailFromTemplate,
  getSampleTemplateVariables,
  isEmailTemplateId,
  TEMPLATE_NAMES,
  type EmailTemplateConfig,
  type EmailTemplateId,
} from "@/lib/email-templates-server";
import {
  sendTemplatedEmail,
  buildTemplateVariables,
  sendNewsletterWelcomeEmail,
  sendNewsletterBroadcastEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendTrackingEmail,
  sendContactFormEmails,
  sendReviewRequestEmail,
  sendGiftCardEmail,
  sendStoreCreditEmail,
  sendAdminNewOrderEmail,
  sendAdminOrderCancelledEmail,
  sendSubscriptionConfirmationEmail,
  sendAccountConfirmationEmail,
  sendEmailVerificationEmail,
  sendReturnApprovedEmail,
  sendRefundEmail,
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
      ids
        .filter((id) => !["order_cancelled", "contact_admin", "admin_new_order", "admin_order_cancelled", "return_request_admin"].includes(id))
        .map((id) => getEmailTemplate(id))
    );
    return Response.json({ templates });
  }

  if (!templateId || !isEmailTemplateId(templateId)) {
    return Response.json({ error: "Template invalid." }, { status: 400 });
  }

  const config = await getEmailTemplate(templateId);
  const sampleVars = getSampleTemplateVariables(templateId);
  const preview = await renderEmailFromTemplate(templateId, sampleVars);
  return Response.json({
    templateId,
    label: TEMPLATE_NAMES[templateId],
    config,
    html: preview.html,
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
      const sampleVars = getSampleTemplateVariables(templateId);
      const preview = await renderEmailFromTemplate(templateId, sampleVars);
      return Response.json({
        ok: true,
        message: "Șablon salvat.",
        config: saved,
        html: preview.html,
      });
    }

    const config =
      action === "preview_live" && body.config
        ? { ...(await getEmailTemplate(templateId)), ...body.config, id: templateId }
        : await getEmailTemplate(templateId);

    if (action === "preview" || action === "preview_live") {
      const sampleVars = getSampleTemplateVariables(templateId);
      const preview = await renderEmailFromTemplate(templateId, sampleVars, {
        configOverrides: action === "preview_live" ? body.config : undefined,
      });
      return Response.json({
        ok: true,
        templateId,
        label: TEMPLATE_NAMES[templateId],
        config,
        html: preview.html,
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
          "Client Demo"
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
      } else if (templateId === "order_processing") {
        const sample = buildSampleOrder();
        sample.userEmail = to;
        sample.address.email = to;
        sample.status = "processing";
        sent = await sendOrderStatusEmail(sample, "processing");
      } else if (templateId === "order_delivered") {
        const sample = buildSampleOrder();
        sample.userEmail = to;
        sample.address.email = to;
        sample.status = "delivered";
        sent = await sendOrderStatusEmail(sample, "delivered");
      } else if (templateId === "review_request") {
        const sample = buildSampleOrder();
        sample.userEmail = to;
        sample.address.email = to;
        sample.status = "delivered";
        sent = await sendReviewRequestEmail(sample);
      } else if (templateId === "gift_card") {
        sent = await sendGiftCardEmail({ email: to, amount: 100, balance: 150 });
      } else if (templateId === "store_credit") {
        sent = await sendStoreCreditEmail({
          email: to,
          amount: 50,
          balance: 150,
          description: "Ajustare admin: test Email Center",
        });
      } else if (templateId === "contact_confirmation") {
        const result = await sendContactFormEmails({
          name: "Client Demo",
          email: to,
          subject: "Test contact",
          message: "Mesaj de test din Email Center.",
        });
        sent = result.confirmationSent;
      } else if (templateId === "admin_new_order") {
        const sample = buildSampleOrder();
        sent = await sendAdminNewOrderEmail(sample);
      } else if (templateId === "admin_order_cancelled") {
        const sample = buildSampleOrder();
        sample.status = "cancelled";
        sent = await sendAdminOrderCancelledEmail(sample);
      } else if (templateId === "subscription_confirmation") {
        sent = await sendSubscriptionConfirmationEmail(to, "Client Demo");
      } else if (templateId === "account_confirmation") {
        sent = await sendAccountConfirmationEmail({ email: to, name: "Client Demo", credits: 50 });
      } else if (templateId === "email_verification") {
        sent = await sendEmailVerificationEmail({
          email: to,
          name: "Client Demo",
          verifyUrl: `${getSiteOrigin()}/contul-meu?verify=test`,
        });
      } else if (templateId === "return_approved") {
        sent = await sendReturnApprovedEmail({
          id: "ret-demo",
          orderCode: "NOVRA-DEMO",
          userEmail: to,
          userName: "Client Demo",
          reason: "Produs defect",
          description: "Demo retur",
          status: "approved",
          adminNote: "Retur aprobat — trimite coletul la adresa indicată.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else if (templateId === "refund") {
        sent = await sendRefundEmail({
          id: "ret-demo",
          orderCode: "NOVRA-DEMO",
          userEmail: to,
          userName: "Client Demo",
          reason: "Produs defect",
          description: "Demo retur",
          status: "completed",
          adminNote: "Rambursarea a fost procesată.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else if (templateId === "contact") {
        const { vars } = buildTemplateVariables("contact", {
          name: "Client Demo",
          email: to,
          subject: "Test contact",
          message: "Mesaj de test din Email Center.",
        });
        sent = await sendTemplatedEmail("contact", to, vars, { logType: "contact" });
      } else if (templateId === "order_cancelled") {
        const sample = buildSampleOrder();
        sample.userEmail = to;
        sample.address.email = to;
        sample.status = "cancelled";
        sent = await sendOrderStatusEmail(sample, "cancelled");
      } else {
        const sampleVars = getSampleTemplateVariables(templateId);
        sent = await sendTemplatedEmail(templateId, to, sampleVars, { logType: templateId });
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

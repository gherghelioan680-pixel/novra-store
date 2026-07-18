import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import { sendEmail } from "@/lib/email";
import { paragraph, wrapEmailHtml } from "@/lib/email-templates";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = (await request.json()) as { to?: string };
    const to = typeof body?.to === "string" ? body.to.trim() : "";

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return Response.json({ ok: false, message: "Introdu o adresă de email validă." }, { status: 400 });
    }

    const html = wrapEmailHtml(
      "Test SMTP NOVRA",
      `${paragraph("Acesta este un email de test trimis din panoul admin NOVRA Email Center.")}${paragraph(`Trimis la: <strong>${to}</strong>`)}`,
      "Conexiune SMTP funcțională."
    );

    const sent = await sendEmail({
      to,
      subject: "Test SMTP — NOVRA Email Center",
      html,
      logType: "smtp_test",
    });

    if (!sent) {
      return Response.json({
        ok: false,
        message: "Emailul nu a putut fi trimis. Verifică EMAILS_ENABLED=true și variabilele SMTP.",
      });
    }

    return Response.json({ ok: true, message: `Email de test trimis către ${to}.` });
  } catch {
    return Response.json({ ok: false, message: "Cerere invalidă." }, { status: 400 });
  }
}

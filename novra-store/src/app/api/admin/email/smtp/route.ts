import type { NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import { isEmailConfigured, isSmtpConfigured, sendEmailDetailed } from "@/lib/email";
import { isEmailsEnabled } from "@/lib/emails-enabled";
import { getSmtpTestState, recordSmtpTest, getRequiredSmtpEnvVars } from "@/lib/smtp-test-server";
import { paragraph, wrapEmailHtml } from "@/lib/email-templates";

export const runtime = "nodejs";

function getSmtpPort(): number {
  const port = Number(process.env.SMTP_PORT ?? "587");
  return Number.isFinite(port) && port > 0 ? port : 587;
}

async function checkSmtpConnection(): Promise<"connected" | "error" | "not_configured"> {
  if (!isSmtpConfigured()) return "not_configured";

  const port = getSmtpPort();
  const secure = port === 465;

  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST!.trim(),
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER!.trim(),
        pass: process.env.SMTP_PASS,
      },
      ...(port === 587 ? { requireTLS: true } : {}),
    });
    await transport.verify();
    return "connected";
  } catch {
    return "error";
  }
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  const [connectionStatus, testState] = await Promise.all([
    checkSmtpConnection(),
    getSmtpTestState(),
  ]);

  return Response.json({
    host: process.env.SMTP_HOST?.trim() || "—",
    port: getSmtpPort(),
    email: process.env.SMTP_USER?.trim() || process.env.SMTP_FROM?.trim() || "—",
    from: process.env.SMTP_FROM?.trim() || "—",
    configured: isEmailConfigured(),
    emailsEnabled: isEmailsEnabled(),
    connectionStatus,
    lastTest: testState.lastTest,
    lastError: testState.lastError,
    lastEmailSent: testState.lastEmailSent,
    configCheck: testState.configCheck,
    requiredEnvVars: getRequiredSmtpEnvVars(),
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = (await request.json()) as { action?: string; to?: string };
    const action = body?.action ?? "verify";

    if (action === "verify") {
      const port = getSmtpPort();
      const secure = port === 465;

      if (!isSmtpConfigured()) {
        await recordSmtpTest({
          ok: false,
          message: "SMTP neconfigurat.",
          error: "Lipsesc variabilele SMTP_HOST, SMTP_USER, SMTP_PASS sau SMTP_FROM.",
        });
        return Response.json({
          ok: false,
          message: "SMTP neconfigurat. Completează variabilele de mediu.",
        });
      }

      try {
        const transport = nodemailer.createTransport({
          host: process.env.SMTP_HOST!.trim(),
          port,
          secure,
          auth: {
            user: process.env.SMTP_USER!.trim(),
            pass: process.env.SMTP_PASS,
          },
          ...(port === 587 ? { requireTLS: true } : {}),
        });
        await transport.verify();
        await recordSmtpTest({ ok: true, message: "Conexiune SMTP reușită." });
        return Response.json({ ok: true, message: "Conexiune SMTP reușită." });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Eroare la verificare SMTP.";
        await recordSmtpTest({
          ok: false,
          message: "Conexiune SMTP eșuată.",
          error: errorMessage,
        });
        return Response.json({ ok: false, message: errorMessage });
      }
    }

    if (action === "send_test") {
      const to = typeof body?.to === "string" ? body.to.trim() : "";
      if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return Response.json({ ok: false, message: "Introdu o adresă de email validă." }, { status: 400 });
      }

      const html = wrapEmailHtml(
        "Test SMTP NOVRA",
        `${paragraph("Acesta este un email de test trimis din panoul admin NOVRA Email Center.")}${paragraph(`Trimis la: <strong>${to}</strong>`)}`,
        "Conexiune SMTP funcțională."
      );

      const result = await sendEmailDetailed({
        to,
        subject: "Test SMTP — NOVRA Email Center",
        html,
        logType: "smtp_test",
      });

      if (!result.ok) {
        await recordSmtpTest({
          ok: false,
          message: "Trimitere test eșuată.",
          error: result.error ?? "Eroare necunoscută.",
        });
        return Response.json({
          ok: false,
          message: result.error ?? "Emailul nu a putut fi trimis. Verifică EMAILS_ENABLED=true și variabilele SMTP.",
        });
      }

      await recordSmtpTest({ ok: true, message: `Email de test trimis către ${to}.` });
      return Response.json({ ok: true, message: `Email de test trimis către ${to}.` });
    }

    return Response.json({ ok: false, message: "Acțiune necunoscută." }, { status: 400 });
  } catch {
    return Response.json({ ok: false, message: "Cerere invalidă." }, { status: 400 });
  }
}

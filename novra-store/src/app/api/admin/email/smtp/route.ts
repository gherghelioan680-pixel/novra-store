import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import { isEmailConfigured, isSmtpConfigured } from "@/lib/email";
import { isEmailsEnabled } from "@/lib/emails-enabled";
import nodemailer from "nodemailer";

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

  const connectionStatus = await checkSmtpConnection();

  return Response.json({
    host: process.env.SMTP_HOST?.trim() || "—",
    port: getSmtpPort(),
    email: process.env.SMTP_USER?.trim() || process.env.SMTP_FROM?.trim() || "—",
    from: process.env.SMTP_FROM?.trim() || "—",
    configured: isEmailConfigured(),
    emailsEnabled: isEmailsEnabled(),
    connectionStatus,
  });
}

import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import { isEmailTemplateId, type EmailTemplateId } from "@/lib/email-templates-server";
import { sendTemplateBroadcastEmail } from "@/lib/email";
import { isEmailsEnabled } from "@/lib/emails-enabled";
import { loadNewsletterSubscriberDirectory } from "@/lib/newsletter-subscribers-server";

export const runtime = "nodejs";
export const maxDuration = 300;

function parseRecipientEmails(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((v) => String(v).trim().toLowerCase()).filter(Boolean))];
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const templateId = typeof body?.templateId === "string" ? body.templateId : "";

    if (!isEmailTemplateId(templateId)) {
      return Response.json({ error: "Șablon invalid." }, { status: 400 });
    }

    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const previewText = typeof body?.previewText === "string" ? body.previewText.trim() : undefined;
    const title = typeof body?.title === "string" ? body.title.trim() : undefined;
    const subtitle = typeof body?.subtitle === "string" ? body.subtitle.trim() : undefined;
    const buttonText = typeof body?.buttonText === "string" ? body.buttonText.trim() : undefined;
    const buttonLink = typeof body?.buttonLink === "string" ? body.buttonLink.trim() : undefined;

    if (!subject || !content) {
      return Response.json({ error: "Subiectul și conținutul sunt obligatorii." }, { status: 400 });
    }

    if (!isEmailsEnabled()) {
      return Response.json(
        { error: "Trimiterea de emailuri este dezactivată. Verifică EMAILS_ENABLED." },
        { status: 503 }
      );
    }

    const sendToAll = body?.sendToAll !== false;
    const directory = await loadNewsletterSubscriberDirectory();

    let recipientEmails: string[];
    if (sendToAll) {
      recipientEmails = [...directory.keys()];
      console.log(`[BROADCAST] sendToAll=true — loaded ${recipientEmails.length} subscribers from storage`);
    } else {
      recipientEmails = parseRecipientEmails(body?.recipients);
      console.log(`[BROADCAST] sendToAll=false — using ${recipientEmails.length} selected recipients`);
    }

    if (recipientEmails.length === 0) {
      return Response.json({ error: "Nu există destinatari pentru trimitere." }, { status: 400 });
    }

    const recipients = recipientEmails.map((email) => ({
      email,
      name: directory.get(email),
    }));

    const result = await sendTemplateBroadcastEmail({
      templateId: templateId as EmailTemplateId,
      recipients,
      subjectOverride: subject,
      contentOverride: content,
      previewTextOverride: previewText,
      titleOverride: title,
      subtitleOverride: subtitle,
      buttonTextOverride: buttonText,
      buttonLinkOverride: buttonLink,
      bypassAutomationGate: true,
    });

    return Response.json({
      ok: true,
      sent: result.sent,
      failed: result.failed,
      total: result.total,
      sentCount: result.sent,
      failedCount: result.failed,
      totalRecipients: result.total,
      templateId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cerere invalidă.";
    return Response.json({ error: message }, { status: 400 });
  }
}

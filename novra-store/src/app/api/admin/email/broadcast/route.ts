import type { NextRequest } from "next/server";
import { readJsonFile } from "@/lib/server-data";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import { isEmailTemplateId, type EmailTemplateId } from "@/lib/email-templates-server";
import { sendTemplateBroadcastEmail } from "@/lib/email";
import { isEmailsEnabled } from "@/lib/emails-enabled";

export const runtime = "nodejs";

const SUBSCRIBERS_FILE = "newsletter.json";

type StoredSubscriber = {
  email: string;
  name?: string;
};

function parseRecipientEmails(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((v) => String(v).trim().toLowerCase()).filter(Boolean))];
}

async function loadSubscriberDirectory(): Promise<Map<string, string | undefined>> {
  const subscribers = await readJsonFile<StoredSubscriber[]>(SUBSCRIBERS_FILE, []);
  const directory = new Map<string, string | undefined>();
  for (const sub of subscribers) {
    const email = sub.email.trim().toLowerCase();
    if (!email) continue;
    directory.set(email, sub.name?.trim() || undefined);
  }
  return directory;
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
    const directory = await loadSubscriberDirectory();

    let recipientEmails: string[];
    if (sendToAll) {
      recipientEmails = [...directory.keys()];
    } else {
      recipientEmails = parseRecipientEmails(body?.recipients);
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
    });

    return Response.json({
      ok: true,
      sentCount: result.sent,
      failedCount: result.failed,
      totalRecipients: recipientEmails.length,
      templateId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cerere invalidă.";
    return Response.json({ error: message }, { status: 400 });
  }
}

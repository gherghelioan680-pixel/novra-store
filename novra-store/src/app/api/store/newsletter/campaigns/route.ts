import type { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import type { NewsletterCampaign } from "@/lib/newsletter";
import { sendNewsletterBroadcastEmail } from "@/lib/email";
import { isEmailsEnabled } from "@/lib/emails-enabled";
import { campaignStatusLabel } from "@/lib/email-campaigns-server";

import { loadNewsletterRecipientEmails } from "@/lib/newsletter-subscribers-server";

export const runtime = "nodejs";
export const maxDuration = 300;

const FILE = "newsletter-campaigns.json";

function generateId(): string {
  return `camp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readCampaigns(): Promise<NewsletterCampaign[]> {
  return readJsonFile<NewsletterCampaign[]>(FILE, []);
}

function parseRecipients(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return [...new Set(value.map((v) => String(v).trim().toLowerCase()).filter(Boolean))];
}

async function resolveRecipientEmails(campaign: NewsletterCampaign): Promise<string[]> {
  if (campaign.sendToAll !== false) {
    return loadNewsletterRecipientEmails();
  }
  return campaign.recipients ?? [];
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();
  const campaigns = await readCampaigns();
  return Response.json({ campaigns });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const action = typeof body?.action === "string" ? body.action : "create";
    const campaigns = await readCampaigns();

    if (action === "create") {
      const title = typeof body?.title === "string" ? body.title.trim() : "";
      const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
      const content = typeof body?.body === "string" ? body.body.trim() : "";

      if (!title || !subject || !content) {
        return Response.json({ error: "Titlu, subiect și conținut sunt obligatorii." }, { status: 400 });
      }

      const scheduledAt =
        typeof body?.scheduledAt === "string" && body.scheduledAt.trim()
          ? body.scheduledAt.trim()
          : undefined;

      const campaign: NewsletterCampaign = {
        id: generateId(),
        title,
        subject,
        body: content,
        previewText: typeof body?.previewText === "string" ? body.previewText.trim() : undefined,
        templateId: typeof body?.templateId === "string" ? body.templateId : undefined,
        recipients: parseRecipients(body?.recipients),
        sendToAll: body?.sendToAll !== false,
        scheduledAt,
        status: scheduledAt ? "scheduled" : "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      campaigns.unshift(campaign);
      await writeJsonFile(FILE, campaigns);
      return Response.json({ ok: true, campaign, statusLabel: campaignStatusLabel(campaign.status) });
    }

    if (action === "update") {
      const id = typeof body?.id === "string" ? body.id : "";
      const index = campaigns.findIndex((c) => c.id === id);
      if (index === -1) {
        return Response.json({ error: "Campania nu a fost găsită." }, { status: 404 });
      }

      if (campaigns[index].status === "sent" || campaigns[index].status === "sending") {
        return Response.json({ error: "Campaniile trimise nu pot fi editate." }, { status: 400 });
      }

      const current = campaigns[index];
      const scheduledAt =
        body?.scheduledAt === null
          ? undefined
          : typeof body?.scheduledAt === "string" && body.scheduledAt.trim()
            ? body.scheduledAt.trim()
            : current.scheduledAt;

      const updated: NewsletterCampaign = {
        ...current,
        title: typeof body?.title === "string" ? body.title.trim() || current.title : current.title,
        subject:
          typeof body?.subject === "string" ? body.subject.trim() || current.subject : current.subject,
        body: typeof body?.body === "string" ? body.body.trim() || current.body : current.body,
        previewText:
          typeof body?.previewText === "string" ? body.previewText.trim() : current.previewText,
        templateId: typeof body?.templateId === "string" ? body.templateId : current.templateId,
        recipients: body?.recipients !== undefined ? parseRecipients(body.recipients) : current.recipients,
        sendToAll: typeof body?.sendToAll === "boolean" ? body.sendToAll : current.sendToAll,
        scheduledAt,
        status:
          body?.saveAsDraft === true
            ? "draft"
            : scheduledAt
              ? "scheduled"
              : current.status === "scheduled" && !scheduledAt
                ? "draft"
                : current.status,
        updatedAt: new Date().toISOString(),
      };

      campaigns[index] = updated;
      await writeJsonFile(FILE, campaigns);
      return Response.json({ ok: true, campaign: updated, statusLabel: campaignStatusLabel(updated.status) });
    }

    if (action === "schedule") {
      const id = typeof body?.id === "string" ? body.id : "";
      const scheduledAt = typeof body?.scheduledAt === "string" ? body.scheduledAt.trim() : "";
      const index = campaigns.findIndex((c) => c.id === id);
      if (index === -1) {
        return Response.json({ error: "Campania nu a fost găsită." }, { status: 404 });
      }
      if (!scheduledAt) {
        return Response.json({ error: "Data programării este obligatorie." }, { status: 400 });
      }

      campaigns[index] = {
        ...campaigns[index],
        scheduledAt,
        status: "scheduled",
        updatedAt: new Date().toISOString(),
      };
      await writeJsonFile(FILE, campaigns);
      return Response.json({ ok: true, campaign: campaigns[index] });
    }

    if (action === "delete") {
      const id = typeof body?.id === "string" ? body.id : "";
      const next = campaigns.filter((c) => c.id !== id);
      if (next.length === campaigns.length) {
        return Response.json({ error: "Campania nu a fost găsită." }, { status: 404 });
      }
      await writeJsonFile(FILE, next);
      return Response.json({ ok: true });
    }

    if (action === "send") {
      const id = typeof body?.id === "string" ? body.id : "";
      const index = campaigns.findIndex((c) => c.id === id);
      if (index === -1) {
        return Response.json({ error: "Campania nu a fost găsită." }, { status: 404 });
      }

      const campaign = campaigns[index];
      if (campaign.status === "sent" || campaign.status === "sending") {
        return Response.json({ error: "Campania a fost deja trimisă." }, { status: 400 });
      }

      const emails = await resolveRecipientEmails(campaign);

      if (emails.length === 0) {
        return Response.json({ error: "Nu există destinatari pentru trimitere." }, { status: 400 });
      }

      if (!isEmailsEnabled()) {
        return Response.json(
          { error: "Trimiterea de emailuri este dezactivată. Campaniile nu pot fi trimise." },
          { status: 503 }
        );
      }

      campaigns[index] = { ...campaign, status: "sending", updatedAt: new Date().toISOString() };
      await writeJsonFile(FILE, campaigns);

      const result = await sendNewsletterBroadcastEmail(
        emails,
        campaign.subject,
        campaign.body,
        campaign.previewText,
        { bypassAutomationGate: true }
      );

      campaigns[index] = {
        ...campaign,
        status: result.failed === emails.length ? "failed" : "sent",
        sentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sentCount: result.sent,
        failedCount: result.failed,
        errorMessage: result.failed > 0 ? `${result.failed} emailuri eșuate` : undefined,
      };
      await writeJsonFile(FILE, campaigns);

      return Response.json({
        ok: true,
        sentCount: result.sent,
        failedCount: result.failed,
        campaign: campaigns[index],
      });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}

import type { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import type { NewsletterCampaign } from "@/lib/newsletter";
import { sendNewsletterBroadcastEmail } from "@/lib/email";

export const runtime = "nodejs";

const FILE = "newsletter-campaigns.json";
const SUBSCRIBERS_FILE = "newsletter.json";

function generateId(): string {
  return `camp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readCampaigns(): Promise<NewsletterCampaign[]> {
  return readJsonFile<NewsletterCampaign[]>(FILE, []);
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

      const campaign: NewsletterCampaign = {
        id: generateId(),
        title,
        subject,
        body: content,
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      campaigns.unshift(campaign);
      await writeJsonFile(FILE, campaigns);
      return Response.json({ ok: true, campaign });
    }

    if (action === "update") {
      const id = typeof body?.id === "string" ? body.id : "";
      const index = campaigns.findIndex((c) => c.id === id);
      if (index === -1) {
        return Response.json({ error: "Campania nu a fost găsită." }, { status: 404 });
      }

      if (campaigns[index].status === "sent") {
        return Response.json({ error: "Campaniile trimise nu pot fi editate." }, { status: 400 });
      }

      const current = campaigns[index];
      const updated: NewsletterCampaign = {
        ...current,
        title: typeof body?.title === "string" ? body.title.trim() || current.title : current.title,
        subject:
          typeof body?.subject === "string" ? body.subject.trim() || current.subject : current.subject,
        body: typeof body?.body === "string" ? body.body.trim() || current.body : current.body,
        updatedAt: new Date().toISOString(),
      };

      campaigns[index] = updated;
      await writeJsonFile(FILE, campaigns);
      return Response.json({ ok: true, campaign: updated });
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
      if (campaign.status === "sent") {
        return Response.json({ error: "Campania a fost deja trimisă." }, { status: 400 });
      }

      const subscribers = await readJsonFile<{ email: string }[]>(SUBSCRIBERS_FILE, []);
      const emails = [...new Set(subscribers.map((s) => s.email.trim().toLowerCase()).filter(Boolean))];

      if (emails.length === 0) {
        return Response.json({ error: "Nu există abonați pentru trimitere." }, { status: 400 });
      }

      const result = await sendNewsletterBroadcastEmail(emails, campaign.subject, campaign.body);

      campaigns[index] = {
        ...campaign,
        status: "sent",
        sentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sentCount: result.sent,
        failedCount: result.failed,
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

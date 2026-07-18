import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import type { NewsletterCampaign } from "@/lib/newsletter";
import { sendNewsletterBroadcastEmail } from "@/lib/email";
import { isEmailsEnabled } from "@/lib/emails-enabled";

const FILE = "newsletter-campaigns.json";
const SUBSCRIBERS_FILE = "newsletter.json";

async function readCampaigns(): Promise<NewsletterCampaign[]> {
  return readJsonFile<NewsletterCampaign[]>(FILE, []);
}

async function resolveRecipientEmails(campaign: NewsletterCampaign): Promise<string[]> {
  if (campaign.sendToAll !== false) {
    const subscribers = await readJsonFile<{ email: string }[]>(SUBSCRIBERS_FILE, []);
    return [...new Set(subscribers.map((s) => s.email.trim().toLowerCase()).filter(Boolean))];
  }
  return campaign.recipients ?? [];
}

export function campaignStatusLabel(status: NewsletterCampaign["status"]): string {
  switch (status) {
    case "draft":
      return "Ciornă";
    case "scheduled":
      return "Programată";
    case "sending":
      return "În desfășurare";
    case "sent":
      return "Finalizată";
    case "failed":
      return "Eșuată";
    default:
      return status;
  }
}

export async function processDueCampaigns(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const campaigns = await readCampaigns();
  const now = new Date().toISOString();
  let processed = 0;
  let totalSent = 0;
  let totalFailed = 0;

  for (let index = 0; index < campaigns.length; index += 1) {
    const campaign = campaigns[index];
    if (campaign.status !== "scheduled") continue;
    if (!campaign.scheduledAt || campaign.scheduledAt > now) continue;

    processed += 1;
    campaigns[index] = { ...campaign, status: "sending", updatedAt: now };

    const emails = await resolveRecipientEmails(campaign);
    if (emails.length === 0) {
      campaigns[index] = {
        ...campaigns[index],
        status: "failed",
        errorMessage: "Nu există destinatari.",
        updatedAt: new Date().toISOString(),
      };
      continue;
    }

    if (!isEmailsEnabled()) {
      campaigns[index] = {
        ...campaigns[index],
        status: "failed",
        errorMessage: "EMAILS_ENABLED nu este activ.",
        updatedAt: new Date().toISOString(),
      };
      continue;
    }

    const result = await sendNewsletterBroadcastEmail(
      emails,
      campaign.subject,
      campaign.body,
      campaign.previewText
    );

    totalSent += result.sent;
    totalFailed += result.failed;

    campaigns[index] = {
      ...campaigns[index],
      status: result.failed === emails.length ? "failed" : "sent",
      sentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sentCount: result.sent,
      failedCount: result.failed,
      errorMessage: result.failed > 0 ? `${result.failed} emailuri eșuate` : undefined,
    };
  }

  if (processed > 0) {
    await writeJsonFile(FILE, campaigns);
  }

  return { processed, sent: totalSent, failed: totalFailed };
}

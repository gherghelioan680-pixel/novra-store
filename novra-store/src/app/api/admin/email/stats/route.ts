import type { NextRequest } from "next/server";
import { readJsonFile } from "@/lib/server-data";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import {
  getEmailLogStats,
  getEmailLogs,
  getEmailChartData,
  getEmailLogsFiltered,
  type EmailLogStatus,
} from "@/lib/email-log-server";
import type { NewsletterCampaign } from "@/lib/newsletter";
import type { NewsletterSubscriber } from "@/lib/newsletter";

export const runtime = "nodejs";

const SUBSCRIBERS_FILE = "newsletter.json";
const CAMPAIGNS_FILE = "newsletter-campaigns.json";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  const [subscribers, campaigns, stats, logs, chartData] = await Promise.all([
    readJsonFile<NewsletterSubscriber[]>(SUBSCRIBERS_FILE, []),
    readJsonFile<NewsletterCampaign[]>(CAMPAIGNS_FILE, []),
    getEmailLogStats(),
    getEmailLogs(10),
    getEmailChartData(30),
  ]);

  const lastCampaign =
    campaigns.find((campaign) => campaign.status === "sent") ??
    campaigns.find((campaign) => campaign.status === "scheduled") ??
    campaigns[0] ??
    null;

  return Response.json({
    subscriberCount: subscribers.length,
    stats,
    lastCampaign,
    recentLogs: logs,
    chartData,
  });
}

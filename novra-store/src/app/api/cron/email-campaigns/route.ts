import type { NextRequest } from "next/server";
import { processDueCampaigns } from "@/lib/email-campaigns-server";
import { processDueReviewRequests } from "@/lib/review-email-server";

export const runtime = "nodejs";

function isAuthorizedCron(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return process.env.NODE_ENV !== "production";

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return Response.json({ error: "Neautorizat." }, { status: 401 });
  }

  const result = await processDueCampaigns();
  const reviews = await processDueReviewRequests();
  return Response.json({ ok: true, ...result, reviews });
}

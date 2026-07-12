import type { NextRequest } from "next/server";
import { processAbandonedCartReminders } from "@/lib/abandoned-cart-server";

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

  const result = await processAbandonedCartReminders();
  return Response.json({ ok: true, ...result });
}

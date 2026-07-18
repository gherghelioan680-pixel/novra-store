import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import { getEmailLogs } from "@/lib/email-log-server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 50;
  const logs = await getEmailLogs(Number.isFinite(limit) ? limit : 50);

  return Response.json({ logs });
}

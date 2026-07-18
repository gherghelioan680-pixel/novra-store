import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import { getEmailLogsFiltered, type EmailLogStatus } from "@/lib/email-log-server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;
  const limitParam = params.get("limit");
  const limit = limitParam ? Number(limitParam) : 100;
  const type = params.get("type") ?? undefined;
  const statusParam = params.get("status");
  const status =
    statusParam === "sent" || statusParam === "failed" ? (statusParam as EmailLogStatus) : undefined;
  const search = params.get("search") ?? undefined;
  const dateFrom = params.get("dateFrom") ?? undefined;
  const dateTo = params.get("dateTo") ?? undefined;

  const logs = await getEmailLogsFiltered({
    limit: Number.isFinite(limit) ? limit : 100,
    type: type && type !== "all" ? type : undefined,
    status,
    search,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(`${dateTo}T23:59:59.999`).toISOString() : undefined,
  });

  return Response.json({ logs });
}

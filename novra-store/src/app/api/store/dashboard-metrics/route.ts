import type { NextRequest } from "next/server";
import { getDashboardMetrics } from "@/lib/dashboard-metrics-server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  const metrics = await getDashboardMetrics();
  return Response.json(metrics);
}

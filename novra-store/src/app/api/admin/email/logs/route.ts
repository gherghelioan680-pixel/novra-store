import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import {
  deleteAllEmailLogs,
  deleteEmailLog,
  deleteEmailLogs,
  getEmailLogsFiltered,
  updateEmailLog,
  type EmailLogStatus,
} from "@/lib/email-log-server";

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

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    if (!id) {
      return Response.json({ ok: false, message: "ID lipsă." }, { status: 400 });
    }

    const updated = await updateEmailLog(id, {
      to: typeof body?.to === "string" ? body.to : undefined,
      subject: typeof body?.subject === "string" ? body.subject : undefined,
      type: typeof body?.type === "string" ? body.type : undefined,
      status: body?.status === "sent" || body?.status === "failed" ? body.status : undefined,
      error: typeof body?.error === "string" ? body.error : undefined,
    });

    if (!updated) {
      return Response.json({ ok: false, message: "Intrare negăsită." }, { status: 404 });
    }

    return Response.json({ ok: true, log: updated });
  } catch {
    return Response.json({ ok: false, message: "Cerere invalidă." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();

    if (body?.deleteAll === true) {
      const deletedCount = await deleteAllEmailLogs();
      return Response.json({ ok: true, deletedCount, logs: [] });
    }

    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((value: unknown): value is string => typeof value === "string")
      : [];

    if (ids.length > 0) {
      const deletedCount = await deleteEmailLogs(ids);
      if (deletedCount === 0) {
        return Response.json({ ok: false, message: "Nicio intrare găsită." }, { status: 404 });
      }
      const logs = await getEmailLogsFiltered({ limit: 100 });
      return Response.json({ ok: true, deletedCount, logs });
    }

    const id = typeof body?.id === "string" ? body.id.trim() : "";
    if (!id) {
      return Response.json({ ok: false, message: "ID lipsă." }, { status: 400 });
    }

    const deleted = await deleteEmailLog(id);
    if (!deleted) {
      return Response.json({ ok: false, message: "Intrare negăsită." }, { status: 404 });
    }

    return Response.json({ ok: true, deletedCount: 1 });
  } catch {
    return Response.json({ ok: false, message: "Cerere invalidă." }, { status: 400 });
  }
}

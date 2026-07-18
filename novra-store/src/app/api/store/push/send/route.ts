import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import {
  readPushNotifications,
  readPushSubscriptions,
  sendPushToAll,
  updatePushNotification,
  deletePushNotification,
} from "@/lib/push-server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  const scope = request.nextUrl.searchParams.get("scope");
  if (scope !== "admin") return unauthorizedResponse();

  const [subscriptions, notifications] = await Promise.all([
    readPushSubscriptions(),
    readPushNotifications(),
  ]);

  return Response.json({
    subscriptions: subscriptions.length,
    notifications,
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title : "";
    const message = typeof body?.body === "string" ? body.body : "";
    const link = typeof body?.link === "string" ? body.link : "/";
    const scheduledAt = typeof body?.scheduledAt === "string" ? body.scheduledAt : undefined;

    const result = await sendPushToAll({ title, body: message, link, scheduledAt });
    if (!result.ok) {
      return Response.json({ ok: false, message: result.message }, { status: 400 });
    }

    return Response.json({
      ok: true,
      successCount: result.successCount,
      failureCount: result.failureCount,
      notification: result.notification,
    });
  } catch {
    return Response.json({ ok: false, message: "Cerere invalidă." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) {
      return Response.json({ ok: false, message: "ID lipsă." }, { status: 400 });
    }

    const result = await updatePushNotification(id, {
      title: typeof body?.title === "string" ? body.title : undefined,
      body: typeof body?.body === "string" ? body.body : undefined,
      link: typeof body?.link === "string" ? body.link : undefined,
      scheduledAt: typeof body?.scheduledAt === "string" ? body.scheduledAt : undefined,
    });

    if (!result.ok) {
      return Response.json({ ok: false, message: result.message }, { status: 400 });
    }

    return Response.json({ ok: true, notification: result.notification });
  } catch {
    return Response.json({ ok: false, message: "Cerere invalidă." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) {
      return Response.json({ ok: false, message: "ID lipsă." }, { status: 400 });
    }

    const result = await deletePushNotification(id);
    if (!result.ok) {
      return Response.json({ ok: false, message: result.message }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, message: "Cerere invalidă." }, { status: 400 });
  }
}

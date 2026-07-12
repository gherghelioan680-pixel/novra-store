import type { NextRequest } from "next/server";
import {
  getVapidPublicKey,
  readPushSubscriptions,
  upsertPushSubscription,
} from "@/lib/push-server";

export const runtime = "nodejs";

export async function GET() {
  const publicKey = getVapidPublicKey();
  return Response.json({
    supported: Boolean(publicKey),
    publicKey,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subscription = body?.subscription as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };

    if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return Response.json({ ok: false, message: "Abonament invalid." }, { status: 400 });
    }

    await upsertPushSubscription({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, message: "Nu s-a putut salva abonamentul." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const endpoint = body?.endpoint as string | undefined;
    if (!endpoint) {
      return Response.json({ ok: false, message: "Endpoint lipsă." }, { status: 400 });
    }
    const { removePushSubscription } = await import("@/lib/push-server");
    await removePushSubscription(endpoint);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, message: "Eroare." }, { status: 400 });
  }
}

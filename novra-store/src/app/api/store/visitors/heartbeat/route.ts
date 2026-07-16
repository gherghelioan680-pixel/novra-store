import type { NextRequest } from "next/server";
import { recordVisitorHeartbeat } from "@/lib/visitors-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { sessionId?: string };
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";

    if (!sessionId.trim()) {
      return Response.json({ error: "sessionId required" }, { status: 400 });
    }

    await recordVisitorHeartbeat(sessionId);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

import type { NextRequest } from "next/server";
import { recordAffiliateClick } from "@/lib/affiliates-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code : "";
    if (!code.trim()) {
      return Response.json({ ok: false, message: "Cod lipsă." }, { status: 400 });
    }

    const result = await recordAffiliateClick(code);
    if (!result.ok) {
      return Response.json({ ok: false, message: result.message }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Cerere invalidă." }, { status: 400 });
  }
}

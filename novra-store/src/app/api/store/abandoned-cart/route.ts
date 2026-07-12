import type { NextRequest } from "next/server";
import { saveAbandonedCartSnapshot } from "@/lib/abandoned-cart-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email : "";
    const items = Array.isArray(body?.items) ? body.items : [];
    const totalPrice = typeof body?.totalPrice === "number" ? body.totalPrice : 0;

    if (!email.trim() || items.length === 0) {
      return Response.json({ ok: false, skipped: true });
    }

    await saveAbandonedCartSnapshot({
      email,
      items,
      totalPrice,
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Cerere invalidă." }, { status: 400 });
  }
}

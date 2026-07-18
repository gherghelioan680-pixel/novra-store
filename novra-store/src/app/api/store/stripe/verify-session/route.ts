import type { NextRequest } from "next/server";
import { getStripeClient } from "@/lib/stripe-server";
import { fulfillOrderFromStripeSession } from "@/lib/stripe-fulfillment";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return Response.json({ error: "Lipsește session_id." }, { status: 400 });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return Response.json({ error: "Stripe nu este configurat." }, { status: 503 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const purchaseCode = session.metadata?.purchaseCode;

    if (session.payment_status !== "paid") {
      return Response.json({
        ok: false,
        paid: false,
        message: "Plata nu a fost finalizată.",
      });
    }

    const result = await fulfillOrderFromStripeSession(session);
    if (!result.ok) {
      return Response.json({
        ok: false,
        paid: true,
        message: result.message ?? "Comanda nu a putut fi confirmată.",
      });
    }

    return Response.json({
      ok: true,
      paid: true,
      purchaseCode: result.order?.purchaseCode ?? purchaseCode,
      order: result.order ?? null,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (err) {
    console.error("[stripe] verify-session error:", err);
    return Response.json({ error: "Verificarea plății a eșuat." }, { status: 500 });
  }
}

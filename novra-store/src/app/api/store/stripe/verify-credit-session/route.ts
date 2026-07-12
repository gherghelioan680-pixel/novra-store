import type { NextRequest } from "next/server";
import { getStripeClient } from "@/lib/stripe-server";
import { fulfillCreditPurchase } from "@/lib/credits-server";

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
    const purchaseType = session.metadata?.type;

    if (purchaseType !== "credit_purchase") {
      return Response.json({
        ok: false,
        credited: false,
        message: "Sesiune invalidă pentru achiziție credite.",
      });
    }

    const purchaseId = session.metadata?.purchaseId;
    if (!purchaseId) {
      return Response.json({
        ok: false,
        credited: false,
        message: "Achiziția nu a fost găsită.",
      });
    }

    if (session.payment_status !== "paid") {
      return Response.json({
        ok: false,
        credited: false,
        paid: false,
        message: "Plata nu a fost finalizată.",
      });
    }

    const result = await fulfillCreditPurchase(purchaseId, sessionId);
    if (!result.ok) {
      return Response.json({
        ok: false,
        credited: false,
        message: result.message,
      });
    }

    return Response.json({
      ok: true,
      credited: true,
      paid: true,
      amount: result.purchase.amount,
      alreadyProcessed: result.alreadyCredited,
      purchase: result.purchase,
    });
  } catch (err) {
    console.error("[stripe] verify-credit-session error:", err);
    return Response.json({ error: "Verificarea plății a eșuat." }, { status: 500 });
  }
}

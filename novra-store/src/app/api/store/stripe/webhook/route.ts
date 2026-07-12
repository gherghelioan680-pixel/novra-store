import type { NextRequest } from "next/server";
import { getStripeClient } from "@/lib/stripe-server";
import {
  fulfillCreditPurchaseFromStripeSession,
  fulfillOrderFromStripeSession,
} from "@/lib/stripe-fulfillment";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe) {
    return Response.json({ error: "Stripe nu este configurat." }, { status: 503 });
  }

  if (!webhookSecret) {
    return Response.json({ error: "STRIPE_WEBHOOK_SECRET lipsește." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Lipsește semnătura Stripe." }, { status: 400 });
  }

  let event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe] webhook signature error:", err);
    return Response.json({ error: "Semnătură webhook invalidă." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return Response.json({ received: true, ignored: event.type });
  }

  const session = event.data.object;

  try {
    if (session.metadata?.type === "credit_purchase") {
      const result = await fulfillCreditPurchaseFromStripeSession(session);
      if (!result.ok) {
        console.error("[stripe] webhook credit fulfillment failed:", result.message);
        return Response.json({ error: result.message }, { status: 500 });
      }
      return Response.json({
        received: true,
        type: "credit_purchase",
        alreadyProcessed: result.alreadyProcessed,
      });
    }

    const result = await fulfillOrderFromStripeSession(session);
    if (!result.ok) {
      console.error("[stripe] webhook order fulfillment failed:", result.message);
      return Response.json({ error: result.message }, { status: 500 });
    }

    return Response.json({
      received: true,
      type: "order",
      purchaseCode: result.order?.purchaseCode,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (err) {
    console.error("[stripe] webhook handler error:", err);
    return Response.json({ error: "Procesarea webhook a eșuat." }, { status: 500 });
  }
}

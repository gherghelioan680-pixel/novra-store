import type { NextRequest } from "next/server";
import { getSessionFromRequest, unauthorizedResponse } from "@/lib/server-auth";
import { getServerSiteSettings } from "@/lib/site-settings-server";
import {
  createCreditPurchase,
  isValidGiftCardAmount,
  updateCreditPurchaseSession,
} from "@/lib/credits-server";
import {
  getStripeCheckoutOrigin,
  getStripeClient,
  ronToStripeAmount,
} from "@/lib/stripe-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session?.email || !session.userId) {
    return unauthorizedResponse();
  }

  try {
    const settings = await getServerSiteSettings();
    if (!settings.cardPaymentEnabled) {
      return Response.json({ error: "Plata cu cardul este dezactivată." }, { status: 400 });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return Response.json(
        { error: "Stripe nu este configurat." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const amount = Number(body?.amount);

    if (!isValidGiftCardAmount(amount)) {
      return Response.json(
        { error: "Sumă invalidă. Alege 50, 100, 200 sau 500 Lei." },
        { status: 400 }
      );
    }

    const purchase = await createCreditPurchase({
      userId: session.userId,
      userEmail: session.email,
      amount,
    });

    const origin = getStripeCheckoutOrigin(request.headers.get("origin"));
    const unitAmount = ronToStripeAmount(amount);

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "ron",
            product_data: {
              name: `Gift Card NOVRA — ${amount} NovraCredits`,
              description: `${amount} Lei credit pentru cumpărături pe novra.ro`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      customer_email: session.email,
      metadata: {
        type: "credit_purchase",
        purchaseId: purchase.id,
        userId: session.userId,
        userEmail: session.email,
        amount: String(amount),
      },
      success_url: `${origin}/contul-meu/credite-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/contul-meu?section=gift-cards&cancelled=1`,
      locale: "ro",
    });

    if (!stripeSession.url) {
      return Response.json({ error: "Nu s-a putut crea sesiunea Stripe." }, { status: 500 });
    }

    await updateCreditPurchaseSession(purchase.id, stripeSession.id);

    return Response.json({
      url: stripeSession.url,
      sessionId: stripeSession.id,
      purchaseId: purchase.id,
    });
  } catch (err) {
    console.error("[credits] purchase error:", err);
    return Response.json({ error: "Eroare la inițializarea plății." }, { status: 500 });
  }
}

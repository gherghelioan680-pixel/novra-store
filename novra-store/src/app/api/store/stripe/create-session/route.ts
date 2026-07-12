import type { NextRequest } from "next/server";
import { getStripeClient } from "@/lib/stripe-server";
import { getServerSiteSettings } from "@/lib/site-settings-server";
import { normalizeOrder, type Order } from "@/lib/orders";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const settings = await getServerSiteSettings();
    if (!settings.cardPaymentEnabled) {
      return Response.json({ error: "Plata cu cardul este dezactivată." }, { status: 400 });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return Response.json(
        { error: "Stripe nu este configurat. Adaugă STRIPE_SECRET_KEY și NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const order = normalizeOrder(body?.order as Partial<Order>);
    const origin = request.headers.get("origin") ?? request.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "ron",
            product_data: {
              name: `Comandă NOVRA ${order.purchaseCode}`,
              description: order.items
                .map((item) => `${item.title} ×${item.quantity}`)
                .join(", ")
                .slice(0, 500),
            },
            unit_amount: Math.round(order.total * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: order.userEmail,
      metadata: {
        orderId: order.id,
        purchaseCode: order.purchaseCode,
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?cancelled=1`,
      locale: "ro",
    });

    if (!session.url) {
      return Response.json({ error: "Nu s-a putut crea sesiunea Stripe." }, { status: 500 });
    }

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[stripe] create-session error:", err);
    return Response.json({ error: "Eroare la inițializarea plății." }, { status: 500 });
  }
}

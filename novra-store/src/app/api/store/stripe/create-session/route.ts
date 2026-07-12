import type { NextRequest } from "next/server";
import { readJsonFile } from "@/lib/server-data";
import {
  getStripeCheckoutOrigin,
  getStripeClient,
  ronToStripeAmount,
} from "@/lib/stripe-server";
import { getServerSiteSettings } from "@/lib/site-settings-server";
import { normalizeOrder, type Order } from "@/lib/orders";

export const runtime = "nodejs";

const ORDERS_FILE = "orders.json";
const MIN_RON_AMOUNT = 2;

async function findOrder(orderId: string): Promise<Order | null> {
  const raw = await readJsonFile<Partial<Order>[]>(ORDERS_FILE, []);
  const orders = raw.map(normalizeOrder);
  return orders.find((order) => order.id === orderId) ?? null;
}

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
    const orderId = typeof body?.orderId === "string" ? body.orderId : body?.order?.id;

    if (!orderId) {
      return Response.json({ error: "Lipsește identificatorul comenzii." }, { status: 400 });
    }

    const order = await findOrder(orderId);
    if (!order) {
      return Response.json(
        { error: "Comanda nu a fost găsită. Reîncearcă plasarea comenzii." },
        { status: 404 }
      );
    }

    if (order.paymentMethod !== "card") {
      return Response.json({ error: "Comanda nu este setată pentru plată cu cardul." }, { status: 400 });
    }

    if (order.paymentStatus === "paid") {
      return Response.json({ error: "Comanda este deja plătită." }, { status: 400 });
    }

    if (order.total < MIN_RON_AMOUNT) {
      return Response.json(
        { error: `Suma minimă pentru plată cu cardul este ${MIN_RON_AMOUNT} RON.` },
        { status: 400 }
      );
    }

    const origin = getStripeCheckoutOrigin(request.headers.get("origin"));
    const unitAmount = ronToStripeAmount(order.total);

    if (unitAmount < MIN_RON_AMOUNT * 100) {
      return Response.json(
        { error: `Suma minimă pentru plată cu cardul este ${MIN_RON_AMOUNT} RON.` },
        { status: 400 }
      );
    }

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
            unit_amount: unitAmount,
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
    const message =
      err instanceof Error && err.message.includes("currency")
        ? "Moneda RON nu este activă în contul Stripe."
        : "Eroare la inițializarea plății.";
    return Response.json({ error: message }, { status: 500 });
  }
}

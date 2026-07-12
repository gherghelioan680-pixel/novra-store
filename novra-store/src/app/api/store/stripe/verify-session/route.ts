import type { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { getStripeClient } from "@/lib/stripe-server";
import { normalizeOrder, type Order } from "@/lib/orders";
import { trySendOrderConfirmationEmail } from "@/lib/email";
import { markDiscountCodeUsed } from "@/lib/discount-codes-server";
import { getServerSiteSettings } from "@/lib/site-settings-server";
import { recordAffiliateConversion } from "@/lib/affiliates-server";

export const runtime = "nodejs";

const ORDERS_FILE = "orders.json";

async function readOrders(): Promise<Order[]> {
  const raw = await readJsonFile<Partial<Order>[]>(ORDERS_FILE, []);
  return raw.map(normalizeOrder);
}

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
    const orderId = session.metadata?.orderId;
    const purchaseCode = session.metadata?.purchaseCode;

    if (!orderId || session.payment_status !== "paid") {
      return Response.json({
        ok: false,
        paid: false,
        message: "Plata nu a fost finalizată.",
      });
    }

    const orders = await readOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) {
      return Response.json({
        ok: true,
        paid: true,
        purchaseCode,
        order: null,
        message: "Plata a fost confirmată, dar comanda nu a fost găsită în sistem.",
      });
    }

    let order = orders[index];
    const alreadyPaid = order.paymentStatus === "paid";

    if (!alreadyPaid) {
      order = {
        ...order,
        paymentStatus: "paid",
        status: order.status === "pending" ? "processing" : order.status,
        stripeSessionId: sessionId,
        updatedAt: new Date().toISOString(),
      };
      orders[index] = order;
      await writeJsonFile(ORDERS_FILE, orders);

      if (order.discountCode) {
        await markDiscountCodeUsed(order.discountCode, order.id, order.userEmail);
      }

      if (order.affiliateCode) {
        await recordAffiliateConversion(order);
      }
    }

    const settings = await getServerSiteSettings();
    const sent = await trySendOrderConfirmationEmail(order, settings.orderEmailsEnabled);
    if (sent) {
      order = { ...order, confirmationEmailSent: true };
      orders[index] = order;
      await writeJsonFile(ORDERS_FILE, orders);
    }

    return Response.json({
      ok: true,
      paid: true,
      purchaseCode: order.purchaseCode,
      order,
      alreadyProcessed: alreadyPaid,
    });
  } catch (err) {
    console.error("[stripe] verify-session error:", err);
    return Response.json({ error: "Verificarea plății a eșuat." }, { status: 500 });
  }
}

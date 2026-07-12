import type { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { getStripeClient } from "@/lib/stripe-server";
import { normalizeOrder, type Order } from "@/lib/orders";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { markDiscountCodeUsed } from "@/lib/discount-codes-server";
import { getServerSiteSettings } from "@/lib/site-settings-server";

export const runtime = "nodejs";

const ORDERS_FILE = "orders.json";

async function readOrders(): Promise<Order[]> {
  const raw = await readJsonFile<Partial<Order>[]>(ORDERS_FILE, []);
  return raw.map(normalizeOrder);
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return Response.json({ error: "Missing session_id" }, { status: 400 });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
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
      return Response.json({ ok: true, paid: true, purchaseCode, order: null });
    }

    const updated: Order = {
      ...orders[index],
      paymentStatus: "paid",
      status: orders[index].status === "pending" ? "processing" : orders[index].status,
      stripeSessionId: sessionId,
      updatedAt: new Date().toISOString(),
    };

    orders[index] = updated;
    await writeJsonFile(ORDERS_FILE, orders);

    if (updated.discountCode) {
      await markDiscountCodeUsed(updated.discountCode, updated.id);
    }

    const settings = await getServerSiteSettings();
    if (settings.orderEmailsEnabled) {
      const sent = await sendOrderConfirmationEmail(updated);
      if (sent) {
        orders[index] = { ...orders[index], confirmationEmailSent: true };
        await writeJsonFile(ORDERS_FILE, orders);
        updated.confirmationEmailSent = true;
      }
    }

    return Response.json({ ok: true, paid: true, purchaseCode: updated.purchaseCode, order: updated });
  } catch (err) {
    console.error("[stripe] verify-session error:", err);
    return Response.json({ error: "Verificare eșuată" }, { status: 500 });
  }
}

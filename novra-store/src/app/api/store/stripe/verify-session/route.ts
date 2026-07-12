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

    const existing = orders[index];

    if (existing.paymentStatus === "paid") {
      return Response.json({
        ok: true,
        paid: true,
        purchaseCode: existing.purchaseCode,
        order: existing,
        alreadyProcessed: true,
      });
    }

    const updated: Order = {
      ...existing,
      paymentStatus: "paid",
      status: existing.status === "pending" ? "processing" : existing.status,
      stripeSessionId: sessionId,
      updatedAt: new Date().toISOString(),
    };

    orders[index] = updated;
    await writeJsonFile(ORDERS_FILE, orders);

    if (updated.discountCode) {
      await markDiscountCodeUsed(updated.discountCode, updated.id, updated.userEmail);
    }

    const settings = await getServerSiteSettings();
    if (settings.orderEmailsEnabled && !updated.confirmationEmailSent) {
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
    return Response.json({ error: "Verificarea plății a eșuat." }, { status: 500 });
  }
}

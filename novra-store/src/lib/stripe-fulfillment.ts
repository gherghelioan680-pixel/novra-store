import "server-only";

import type Stripe from "stripe";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { normalizeOrder, type Order } from "@/lib/orders";
import { trySendOrderConfirmationEmail } from "@/lib/email";
import { markDiscountCodeUsed } from "@/lib/discount-codes-server";
import { getServerSiteSettings } from "@/lib/site-settings-server";
import { recordAffiliateConversion } from "@/lib/affiliates-server";
import { fulfillCreditPurchase } from "@/lib/credits-server";
import { markAbandonedCartCompleted } from "@/lib/abandoned-cart-server";

const ORDERS_FILE = "orders.json";

async function readOrders(): Promise<Order[]> {
  const raw = await readJsonFile<Partial<Order>[]>(ORDERS_FILE, []);
  return raw.map(normalizeOrder);
}

export async function fulfillOrderFromStripeSession(
  session: Stripe.Checkout.Session
): Promise<{
  ok: boolean;
  order?: Order;
  alreadyProcessed?: boolean;
  message?: string;
}> {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    return { ok: false, message: "Lipsește orderId în metadata Stripe." };
  }

  if (session.payment_status !== "paid") {
    return { ok: false, message: "Plata nu este finalizată." };
  }

  const orders = await readOrders();
  const index = orders.findIndex((order) => order.id === orderId);
  if (index === -1) {
    return { ok: false, message: "Comanda nu a fost găsită." };
  }

  let order = orders[index];
  const alreadyPaid = order.paymentStatus === "paid";

  if (!alreadyPaid) {
    order = {
      ...order,
      paymentStatus: "paid",
      status: order.status === "pending" ? "processing" : order.status,
      stripeSessionId: session.id,
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

    if (order.userEmail) {
      await markAbandonedCartCompleted(order.userEmail);
    }
  }

  const settings = await getServerSiteSettings();
  const sent = await trySendOrderConfirmationEmail(order, settings.orderEmailsEnabled);
  if (sent) {
    order = { ...order, confirmationEmailSent: true };
    orders[index] = order;
    await writeJsonFile(ORDERS_FILE, orders);
  }

  return { ok: true, order, alreadyProcessed: alreadyPaid };
}

export async function fulfillCreditPurchaseFromStripeSession(
  session: Stripe.Checkout.Session
): Promise<{
  ok: boolean;
  alreadyProcessed?: boolean;
  message?: string;
}> {
  if (session.metadata?.type !== "credit_purchase") {
    return { ok: false, message: "Sesiune invalidă pentru achiziție credite." };
  }

  const purchaseId = session.metadata?.purchaseId;
  if (!purchaseId) {
    return { ok: false, message: "Lipsește purchaseId în metadata Stripe." };
  }

  if (session.payment_status !== "paid") {
    return { ok: false, message: "Plata nu este finalizată." };
  }

  const result = await fulfillCreditPurchase(purchaseId, session.id);
  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  return { ok: true, alreadyProcessed: result.alreadyCredited };
}

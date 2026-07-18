import type { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { getSessionFromRequest, isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import { normalizeOrder, generatePurchaseCode, resolveOrderCustomerEmail, type Order, type OrderStatus } from "@/lib/orders";
import { trySendOrderConfirmationEmail, sendTrackingEmail, trySendOrderStatusEmail, trySendAdminNewOrderEmail, scheduleReviewRequestAfterDelivery } from "@/lib/email";
import { markDiscountCodeUsed } from "@/lib/discount-codes-server";
import { getServerSiteSettings } from "@/lib/site-settings-server";
import { spendCreditsForOrder } from "@/lib/credits-server";
import { decrementStockForOrderItems, restoreStockForOrderItems } from "@/lib/stock-server";
import {
  getAffiliateRefFromRequest,
  recordAffiliateConversion,
} from "@/lib/affiliates-server";
import {
  getCampaignRefFromRequest,
  findCampaignBySlug,
  getCampaignDiscountForOrder,
} from "@/lib/campaigns-server";
import { processReferralRewardsForOrder } from "@/lib/referrals-server";
import { markAbandonedCartCompleted } from "@/lib/abandoned-cart-server";
import { isEmailBanned, BANNED_USER_MESSAGE } from "@/lib/user-ban-server";

export const runtime = "nodejs";

const ORDERS_FILE = "orders.json";
const USERS_FILE = "users.json";
const MAX_ORDERS = 10000;

type ServerUser = {
  id: string;
  email: string;
  orders?: string[];
  [key: string]: unknown;
};

async function readOrders(): Promise<Order[]> {
  const raw = await readJsonFile<Partial<Order>[]>(ORDERS_FILE, []);
  const orders = raw.map(normalizeOrder);
  const existingCodes = orders.map((order) => order.purchaseCode);
  let changed = false;

  const updated = orders.map((order, index) => {
    if (raw[index]?.purchaseCode) return order;
    changed = true;
    const purchaseCode = generatePurchaseCode(existingCodes);
    existingCodes.push(purchaseCode);
    return { ...order, purchaseCode };
  });

  if (changed) {
    await writeJsonFile(ORDERS_FILE, updated);
  }

  return updated;
}

async function applyStatusEmailUpdates(
  orders: Order[],
  index: number,
  previous: Order,
  orderEmailsEnabled: boolean
): Promise<Order> {
  let updated = orders[index];
  const statusResult = await trySendOrderStatusEmail(updated, previous.status, orderEmailsEnabled);

  if (!statusResult.sent || !statusResult.status) {
    return updated;
  }

  let statusEmailsSent = {
    ...updated.statusEmailsSent,
    [statusResult.status]: true,
  };
  let trackingEmailSent = updated.trackingEmailSent;

  if (statusResult.status === "shipped" && updated.awbTracking) {
    trackingEmailSent = true;
  }

  updated = { ...updated, statusEmailsSent, trackingEmailSent };
  orders[index] = updated;

  if (statusResult.scheduleReview) {
    const reviewResult = await scheduleReviewRequestAfterDelivery(updated);
    if (reviewResult === "sent") {
      updated = { ...updated, reviewEmailSent: true, reviewEmailDueAt: undefined };
    } else if (reviewResult) {
      updated = { ...updated, reviewEmailDueAt: reviewResult };
    }
    orders[index] = updated;
  }

  return updated;
}

async function addOrderToUser(orderId: string, userEmail: string): Promise<void> {
  const email = userEmail.toLowerCase();
  const users = await readJsonFile<ServerUser[]>(USERS_FILE, []);
  const index = users.findIndex((user) => user.email.toLowerCase() === email);
  if (index === -1) return;

  const orderIds = users[index].orders ?? [];
  if (!orderIds.includes(orderId)) {
    users[index] = { ...users[index], orders: [orderId, ...orderIds] };
    await writeJsonFile(USERS_FILE, users);
  }
}

async function removeOrderFromUser(orderId: string, userEmail: string): Promise<void> {
  const email = userEmail.toLowerCase();
  const users = await readJsonFile<ServerUser[]>(USERS_FILE, []);
  const index = users.findIndex((user) => user.email.toLowerCase() === email);
  if (index === -1) return;

  const orderIds = users[index].orders ?? [];
  if (orderIds.includes(orderId)) {
    users[index] = {
      ...users[index],
      orders: orderIds.filter((id) => id !== orderId),
    };
    await writeJsonFile(USERS_FILE, users);
  }
}

function searchOrders(orders: Order[], query: string): Order[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return orders.filter((order) => {
    const code = order.purchaseCode?.toLowerCase() ?? "";
    const id = order.id.toLowerCase();
    const email = order.userEmail.toLowerCase();
    return (
      code === normalized ||
      code.includes(normalized) ||
      id === normalized ||
      id.includes(normalized) ||
      email.includes(normalized)
    );
  });
}

function ordersForAccount(orders: Order[], email: string, userId?: string): Order[] {
  const normalizedEmail = email.toLowerCase();
  return orders.filter((order) => {
    const orderEmail = order.userEmail.toLowerCase();
    const addressEmail = order.address.email.toLowerCase();
    if (orderEmail === normalizedEmail || addressEmail === normalizedEmail) return true;
    if (userId && order.userId === userId) return true;
    return false;
  });
}

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  const emailParam = request.nextUrl.searchParams.get("email")?.toLowerCase();
  const searchParam = request.nextUrl.searchParams.get("search") ?? request.nextUrl.searchParams.get("code");
  const orders = await readOrders();

  if (searchParam) {
    if (!isAdminRequest(request)) return unauthorizedResponse();
    return Response.json({ orders: searchOrders(orders, searchParam) });
  }

  if (isAdminRequest(request)) {
    if (emailParam) {
      return Response.json({ orders: ordersForAccount(orders, emailParam) });
    }
    return Response.json({ orders });
  }

  if (session?.email) {
    const userEmail = session.email.toLowerCase();
    if (emailParam && emailParam !== userEmail) {
      return unauthorizedResponse();
    }
    return Response.json({
      orders: ordersForAccount(orders, userEmail, session.userId),
    });
  }

  if (emailParam) {
    return Response.json({ orders: ordersForAccount(orders, emailParam) });
  }

  return unauthorizedResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || !body.order) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const createdAt = new Date().toISOString();
    let order = normalizeOrder({
      ...(body.order as Partial<Order>),
      createdAt,
      updatedAt: createdAt,
    });

    const checkoutEmail = (order.userEmail || order.address?.email || "").trim().toLowerCase();
    if (checkoutEmail && (await isEmailBanned(checkoutEmail))) {
      return Response.json({ error: BANNED_USER_MESSAGE }, { status: 403 });
    }

    const cookieRef = getAffiliateRefFromRequest(request);
    if (!order.affiliateCode && cookieRef) {
      order.affiliateCode = cookieRef;
    }

    const cookieCampaign = getCampaignRefFromRequest(request);
    if (!order.campaignSlug && cookieCampaign) {
      order.campaignSlug = cookieCampaign;
      const campaign = await findCampaignBySlug(cookieCampaign);
      if (campaign) {
        const subtotal = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
        const { percent, amount } = getCampaignDiscountForOrder(campaign, subtotal);
        if (amount > 0 && !order.campaignDiscountAmount) {
          order.campaignDiscountPercent = percent;
          order.campaignDiscountAmount = amount;
          order.total = Math.max(0, Math.round((order.total - amount) * 100) / 100);
        }
      }
    }

    const orders = await readOrders();
    const existingCodes = orders.map((o) => o.purchaseCode).filter(Boolean);

    if (!body.order?.purchaseCode || existingCodes.includes(order.purchaseCode)) {
      order.purchaseCode = generatePurchaseCode(existingCodes);
    }

    const session = getSessionFromRequest(request);
    const creditsUsed = typeof order.creditsUsed === "number" ? Math.round(order.creditsUsed) : 0;

    if (creditsUsed > 0) {
      if (!session?.email) {
        return Response.json(
          { error: "Trebuie să fii autentificat pentru a folosi NovraCredits." },
          { status: 401 }
        );
      }
      if (order.userEmail.toLowerCase() !== session.email.toLowerCase()) {
        return Response.json({ error: "Email comandă invalid." }, { status: 400 });
      }
      if (order.isGuest || order.userId.startsWith("guest-")) {
        return Response.json(
          { error: "NovraCredits sunt disponibile doar pentru conturi înregistrate." },
          { status: 400 }
        );
      }
    }

    const stockItems = order.items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId as string,
        quantity: item.quantity,
      }));

    const stockResult = await decrementStockForOrderItems(stockItems);
    if (!stockResult.ok) {
      return Response.json({ error: stockResult.message }, { status: 400 });
    }

    orders.unshift(order);
    await writeJsonFile(ORDERS_FILE, orders.slice(0, MAX_ORDERS));

    const customerEmail = resolveOrderCustomerEmail(orders[0]);
    console.log(`[ORDER] Order created: ${orders[0].purchaseCode}, ${customerEmail || "—"}`);

    if (customerEmail && customerEmail !== orders[0].userEmail) {
      orders[0] = {
        ...orders[0],
        userEmail: customerEmail,
        address: { ...orders[0].address, email: customerEmail },
      };
      order = orders[0];
      await writeJsonFile(ORDERS_FILE, orders.slice(0, MAX_ORDERS));
    }

    // Card + NovraCredits: creditele se scad doar după confirmarea plății Stripe (webhook / verify-session).
    if (creditsUsed > 0 && session?.email && order.paymentMethod !== "card") {
      const spendResult = await spendCreditsForOrder(session.email, creditsUsed, order.id);
      if (!spendResult.ok) {
        orders.shift();
        await writeJsonFile(ORDERS_FILE, orders.slice(0, MAX_ORDERS));
        await restoreStockForOrderItems(stockItems);
        return Response.json({ error: spendResult.message }, { status: 400 });
      }
    }

    if (order.userEmail && !order.isGuest && !order.userId.startsWith("guest-")) {
      await addOrderToUser(order.id, order.userEmail);
    }

    if (order.discountCode && order.paymentMethod !== "card") {
      await markDiscountCodeUsed(order.discountCode, order.id, order.userEmail);
    }

    const settings = await getServerSiteSettings();
    if (order.paymentMethod !== "card") {
      const sent = await trySendOrderConfirmationEmail(order, settings.orderEmailsEnabled);
      if (sent) {
        orders[0] = { ...orders[0], confirmationEmailSent: true };
        await writeJsonFile(ORDERS_FILE, orders.slice(0, MAX_ORDERS));
      }
      void trySendAdminNewOrderEmail(orders[0], settings.orderEmailsEnabled);
    }

    if (order.affiliateCode && order.paymentMethod !== "card") {
      await recordAffiliateConversion(orders[0]);
    }

    if (order.paymentMethod !== "card") {
      await processReferralRewardsForOrder(orders[0]);
    }

    if (order.userEmail) {
      await markAbandonedCartCompleted(order.userEmail);
    }

    return Response.json({ ok: true, order: orders[0] });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const bulkOrderIds = Array.isArray(body?.orderIds)
      ? (body.orderIds as string[]).filter((id) => typeof id === "string" && id.trim())
      : [];
    const orderId = body?.orderId as string | undefined;
    const targetOrderIds = bulkOrderIds.length > 0 ? bulkOrderIds : orderId ? [orderId] : [];
    const status = body?.status as string | undefined;
    const awbTracking = body?.awbTracking as string | undefined;

    if (targetOrderIds.length === 0) {
      return Response.json({ error: "Missing orderId" }, { status: 400 });
    }

    if (targetOrderIds.length > 1) {
      const orders = await readOrders();
      const settings = await getServerSiteSettings();
      let updatedCount = 0;

      for (const id of targetOrderIds) {
        const index = orders.findIndex((order) => order.id === id);
        if (index === -1) continue;

        const previous = orders[index];
        const updates: Partial<Order> = { updatedAt: new Date().toISOString() };

        if (status) {
          const normalizedStatus = status === "processed" ? "processing" : status;
          if (
            normalizedStatus === "pending" ||
            normalizedStatus === "processing" ||
            normalizedStatus === "shipped" ||
            normalizedStatus === "delivered" ||
            normalizedStatus === "cancelled"
          ) {
            updates.status = normalizedStatus as OrderStatus;
          }
        }

        orders[index] = { ...previous, ...updates };
        updatedCount += 1;

        if (updates.status && updates.status !== previous.status) {
          await applyStatusEmailUpdates(orders, index, previous, settings.orderEmailsEnabled);
        }
      }

      await writeJsonFile(ORDERS_FILE, orders);
      return Response.json({ orders, updatedCount });
    }

    const singleOrderId = targetOrderIds[0];
    const orders = await readOrders();
    const index = orders.findIndex((order) => order.id === singleOrderId);
    if (index === -1) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const previous = orders[index];
    const updates: Partial<Order> = { updatedAt: new Date().toISOString() };

    if (status) {
      const normalizedStatus = status === "processed" ? "processing" : status;
      if (
        normalizedStatus === "pending" ||
        normalizedStatus === "processing" ||
        normalizedStatus === "shipped" ||
        normalizedStatus === "delivered" ||
        normalizedStatus === "cancelled"
      ) {
        updates.status = normalizedStatus as OrderStatus;
      }
    }

    if (typeof awbTracking === "string") {
      updates.awbTracking = awbTracking.trim() || undefined;
      if (updates.awbTracking && !status) {
        updates.status = "shipped";
      }
    }

    orders[index] = { ...previous, ...updates };
    await writeJsonFile(ORDERS_FILE, orders);

    let updated = orders[index];
    const settings = await getServerSiteSettings();
    let trackingEmailSent = updated.trackingEmailSent;
    let statusEmailsSent = { ...updated.statusEmailsSent };

    if (updates.status && updates.status !== previous.status) {
      updated = await applyStatusEmailUpdates(orders, index, previous, settings.orderEmailsEnabled);
      trackingEmailSent = updated.trackingEmailSent ?? trackingEmailSent;
      statusEmailsSent = { ...updated.statusEmailsSent };
      await writeJsonFile(ORDERS_FILE, orders);
    }

    if (
      typeof awbTracking === "string" &&
      awbTracking.trim() &&
      awbTracking.trim() !== previous.awbTracking
    ) {
      if (settings.orderEmailsEnabled && !trackingEmailSent && !statusEmailsSent.shipped) {
        const sent = await sendTrackingEmail(updated, awbTracking.trim());
        if (sent) {
          trackingEmailSent = true;
          updated = { ...updated, trackingEmailSent: true };
          orders[index] = updated;
          await writeJsonFile(ORDERS_FILE, orders);
        }
      }
    }

    return Response.json({ orders, order: updated, trackingEmailSent });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const orderIdFromQuery = request.nextUrl.searchParams.get("id");
    const body = orderIdFromQuery ? null : await request.json();
    const bulkOrderIds = Array.isArray(body?.orderIds)
      ? (body.orderIds as string[]).filter((id) => typeof id === "string" && id.trim())
      : [];
    const singleOrderId = orderIdFromQuery ?? (body?.orderId as string | undefined);
    const orderIds = bulkOrderIds.length > 0 ? bulkOrderIds : singleOrderId ? [singleOrderId] : [];

    if (orderIds.length === 0) {
      return Response.json({ error: "Missing orderId" }, { status: 400 });
    }

    const orders = await readOrders();
    const removedOrders: Order[] = [];

    for (const orderId of orderIds) {
      const index = orders.findIndex((order) => order.id === orderId);
      if (index === -1) continue;
      const [removed] = orders.splice(index, 1);
      removedOrders.push(removed);
      if (removed.userEmail) {
        await removeOrderFromUser(orderId, removed.userEmail);
      }
    }

    await writeJsonFile(ORDERS_FILE, orders);
    return Response.json({ ok: true, orders, deletedCount: removedOrders.length });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

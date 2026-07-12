import type { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { getSessionFromRequest, isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import { normalizeOrder, generatePurchaseCode, type Order, type OrderStatus } from "@/lib/orders";
import { sendOrderConfirmationEmail, sendTrackingEmail } from "@/lib/email";
import { markDiscountCodeUsed } from "@/lib/discount-codes-server";
import { getServerSiteSettings } from "@/lib/site-settings-server";

export const runtime = "nodejs";

const ORDERS_FILE = "orders.json";
const USERS_FILE = "users.json";
const MAX_ORDERS = 100;

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
      return Response.json({ orders: orders.filter((order) => order.userEmail === emailParam) });
    }
    return Response.json({ orders });
  }

  if (session?.email) {
    const userEmail = session.email.toLowerCase();
    if (emailParam && emailParam !== userEmail) {
      return unauthorizedResponse();
    }
    return Response.json({ orders: orders.filter((order) => order.userEmail === userEmail) });
  }

  if (emailParam) {
    return Response.json({ orders: orders.filter((order) => order.userEmail === emailParam) });
  }

  return unauthorizedResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || !body.order) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const order = normalizeOrder(body.order as Partial<Order>);
    const orders = await readOrders();
    const existingCodes = orders.map((o) => o.purchaseCode).filter(Boolean);

    if (!body.order?.purchaseCode || existingCodes.includes(order.purchaseCode)) {
      order.purchaseCode = generatePurchaseCode(existingCodes);
    }

    orders.unshift(order);
    await writeJsonFile(ORDERS_FILE, orders.slice(0, MAX_ORDERS));

    if (order.userEmail) {
      await addOrderToUser(order.id, order.userEmail);
    }

    if (order.discountCode && order.paymentMethod !== "card") {
      await markDiscountCodeUsed(order.discountCode, order.id);
    }

    const settings = await getServerSiteSettings();
    if (settings.orderEmailsEnabled && order.paymentMethod !== "card") {
      const sent = await sendOrderConfirmationEmail(order);
      if (sent) {
        orders[0] = { ...orders[0], confirmationEmailSent: true };
        await writeJsonFile(ORDERS_FILE, orders.slice(0, MAX_ORDERS));
      }
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
    const orderId = body?.orderId as string | undefined;
    const status = body?.status as string | undefined;
    const awbTracking = body?.awbTracking as string | undefined;

    if (!orderId) {
      return Response.json({ error: "Missing orderId" }, { status: 400 });
    }

    const orders = await readOrders();
    const index = orders.findIndex((order) => order.id === orderId);
    if (index === -1) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const previous = orders[index];
    const updates: Partial<Order> = { updatedAt: new Date().toISOString() };

    if (status) {
      const normalizedStatus = status === "processed" ? "processing" : status;
      updates.status = normalizedStatus as OrderStatus;
    }

    if (typeof awbTracking === "string") {
      updates.awbTracking = awbTracking.trim() || undefined;
      if (updates.awbTracking && !status) {
        updates.status = "shipped";
      }
    }

    orders[index] = { ...previous, ...updates };
    await writeJsonFile(ORDERS_FILE, orders);

    const updated = orders[index];
    let trackingEmailSent = updated.trackingEmailSent;

    if (typeof awbTracking === "string" && awbTracking.trim() && awbTracking.trim() !== previous.awbTracking) {
      const settings = await getServerSiteSettings();
      if (settings.orderEmailsEnabled) {
        const sent = await sendTrackingEmail(updated, awbTracking.trim());
        if (sent) {
          trackingEmailSent = true;
          orders[index] = { ...orders[index], trackingEmailSent: true };
          await writeJsonFile(ORDERS_FILE, orders);
        }
      }
    }

    return Response.json({ orders, trackingEmailSent });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const orderIdFromQuery = request.nextUrl.searchParams.get("id");
    const body = orderIdFromQuery ? null : await request.json();
    const orderId = orderIdFromQuery ?? (body?.orderId as string | undefined);

    if (!orderId) {
      return Response.json({ error: "Missing orderId" }, { status: 400 });
    }

    const orders = await readOrders();
    const index = orders.findIndex((order) => order.id === orderId);
    if (index === -1) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const [removed] = orders.splice(index, 1);
    await writeJsonFile(ORDERS_FILE, orders);

    if (removed.userEmail) {
      await removeOrderFromUser(orderId, removed.userEmail);
    }

    return Response.json({ ok: true, orders });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

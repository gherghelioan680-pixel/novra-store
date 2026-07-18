import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { normalizeOrder, type Order } from "@/lib/orders";
import { sendReviewRequestEmail } from "@/lib/email";

const ORDERS_FILE = "orders.json";

async function readOrders(): Promise<Order[]> {
  const raw = await readJsonFile<Partial<Order>[]>(ORDERS_FILE, []);
  return raw.map(normalizeOrder);
}

export async function processDueReviewRequests(): Promise<{ sent: number; checked: number }> {
  const orders = await readOrders();
  const now = Date.now();
  let sent = 0;
  let checked = 0;
  let changed = false;

  for (let index = 0; index < orders.length; index += 1) {
    const order = orders[index];
    if (order.reviewEmailSent) continue;
    if (!order.reviewEmailDueAt) continue;
    if (!order.userEmail?.trim()) continue;

    checked += 1;
    const dueAt = Date.parse(order.reviewEmailDueAt);
    if (!Number.isFinite(dueAt) || dueAt > now) continue;

    const ok = await sendReviewRequestEmail(order);
    if (ok) {
      orders[index] = {
        ...order,
        reviewEmailSent: true,
        reviewEmailDueAt: undefined,
        updatedAt: new Date().toISOString(),
      };
      sent += 1;
      changed = true;
    }
  }

  if (changed) {
    await writeJsonFile(ORDERS_FILE, orders);
  }

  return { sent, checked };
}

export async function markReviewEmailSent(orderId: string): Promise<void> {
  const orders = await readOrders();
  const index = orders.findIndex((order) => order.id === orderId);
  if (index === -1) return;

  orders[index] = {
    ...orders[index],
    reviewEmailSent: true,
    reviewEmailDueAt: undefined,
    updatedAt: new Date().toISOString(),
  };
  await writeJsonFile(ORDERS_FILE, orders);
}

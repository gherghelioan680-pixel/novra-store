import type { NextRequest } from "next/server";
import { readJsonFile } from "@/lib/server-data";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import { normalizeOrder, ORDER_STATUS_LABELS, type Order, type OrderStatus } from "@/lib/orders";
import { readAffiliateReferrals } from "@/lib/affiliates-server";

export const runtime = "nodejs";

const ORDERS_FILE = "orders.json";

type DayBucket = {
  date: string;
  label: string;
  orders: number;
  revenue: number;
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString("ro-RO", { day: "2-digit", month: "short" });
}

function buildDayBuckets(days: number): DayBucket[] {
  const buckets: DayBucket[] = [];
  const today = startOfDay(new Date());

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    buckets.push({
      date: date.toISOString().slice(0, 10),
      label: formatDayLabel(date),
      orders: 0,
      revenue: 0,
    });
  }

  return buckets;
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  const rangeParam = request.nextUrl.searchParams.get("range");
  const days = rangeParam === "30" ? 30 : 7;

  const rawOrders = await readJsonFile<Partial<Order>[]>(ORDERS_FILE, []);
  const orders = rawOrders.map(normalizeOrder);
  const referrals = await readAffiliateReferrals();

  const dayBuckets = buildDayBuckets(days);
  const bucketIndex = new Map(dayBuckets.map((bucket, index) => [bucket.date, index]));

  const productCounts = new Map<string, { title: string; quantity: number }>();
  let totalRevenue = 0;
  let affiliateCommissionTotal = 0;
  let affiliateReferralsCount = 0;

  for (const order of orders) {
    if (order.status !== "cancelled") {
      totalRevenue += order.total;
    }

    const dayKey = startOfDay(new Date(order.createdAt)).toISOString().slice(0, 10);
    const index = bucketIndex.get(dayKey);
    if (index !== undefined) {
      dayBuckets[index].orders += 1;
      if (order.status !== "cancelled") {
        dayBuckets[index].revenue += order.total;
      }
    }

    for (const item of order.items) {
      const key = item.productId ?? item.title;
      const existing = productCounts.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        productCounts.set(key, { title: item.title, quantity: item.quantity });
      }
    }
  }

  for (const referral of referrals) {
    affiliateReferralsCount += 1;
    affiliateCommissionTotal += referral.commission ?? 0;
  }

  const topProducts = Array.from(productCounts.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  const statusBreakdown: Record<OrderStatus, number> = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  for (const order of orders) {
    statusBreakdown[order.status] += 1;
  }

  return Response.json({
    rangeDays: days,
    totalOrders: orders.length,
    totalRevenue,
    ordersPerDay: dayBuckets,
    topProducts,
    affiliate: {
      referrals: affiliateReferralsCount,
      commissionTotal: affiliateCommissionTotal,
    },
    statusBreakdown: Object.entries(statusBreakdown).map(([status, count]) => ({
      status,
      label: ORDER_STATUS_LABELS[status as OrderStatus],
      count,
    })),
  });
}

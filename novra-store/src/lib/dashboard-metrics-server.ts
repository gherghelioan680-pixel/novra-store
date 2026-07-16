import "server-only";

import { CATALOG_PRODUCTS, type ProductOverride } from "@/lib/catalog";
import { normalizeOrder, type Order } from "@/lib/orders";
import { resolveStockQuantity } from "@/lib/stock-server";
import {
  getLiveVisitorCount,
  getUniqueVisitorsToday,
} from "@/lib/visitors-server";
import { readJsonFile } from "@/lib/server-data";

const ORDERS_FILE = "orders.json";
const PRODUCTS_FILE = "products.json";
export const LOW_STOCK_THRESHOLD = 10;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isToday(dateIso: string): boolean {
  const created = startOfDay(new Date(dateIso));
  const today = startOfDay(new Date());
  return created.getTime() === today.getTime();
}

export type DashboardMetrics = {
  revenueToday: number;
  ordersToday: number;
  liveVisitors: number;
  uniqueVisitorsToday: number;
  conversionRate: number;
  totalStockUnits: number;
  productsInStock: number;
  lowStockCount: number;
  formulas: {
    revenueToday: string;
    ordersToday: string;
    liveVisitors: string;
    conversionRate: string;
    totalStockUnits: string;
    lowStockCount: string;
  };
};

function computeStockMetrics(overrides: Record<string, ProductOverride>) {
  let totalStockUnits = 0;
  let productsInStock = 0;
  let lowStockCount = 0;

  for (const product of CATALOG_PRODUCTS) {
    const quantity = resolveStockQuantity(product.id, overrides);
    totalStockUnits += quantity;
    if (quantity > 0) productsInStock += 1;
    if (quantity > 0 && quantity < LOW_STOCK_THRESHOLD) lowStockCount += 1;
  }

  return { totalStockUnits, productsInStock, lowStockCount };
}

function computeTodayOrderMetrics(orders: Order[]) {
  let revenueToday = 0;
  let ordersToday = 0;

  for (const order of orders) {
    if (!isToday(order.createdAt)) continue;
    ordersToday += 1;
    if (order.status !== "cancelled") {
      revenueToday += order.total;
    }
  }

  return { revenueToday, ordersToday };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [rawOrders, overrides, liveVisitors, uniqueVisitorsToday] = await Promise.all([
    readJsonFile<Partial<Order>[]>(ORDERS_FILE, []),
    readJsonFile<Record<string, ProductOverride>>(PRODUCTS_FILE, {}),
    getLiveVisitorCount(),
    getUniqueVisitorsToday(),
  ]);

  const orders = rawOrders.map(normalizeOrder);
  const { revenueToday, ordersToday } = computeTodayOrderMetrics(orders);
  const { totalStockUnits, productsInStock, lowStockCount } = computeStockMetrics(overrides);

  const conversionRate =
    uniqueVisitorsToday > 0
      ? Math.round((ordersToday / uniqueVisitorsToday) * 1000) / 10
      : 0;

  return {
    revenueToday,
    ordersToday,
    liveVisitors,
    uniqueVisitorsToday,
    conversionRate,
    totalStockUnits,
    productsInStock,
    lowStockCount,
    formulas: {
      revenueToday:
        "Suma order.total pentru comenzile cu createdAt azi, excluzând status cancelled.",
      ordersToday: "Număr comenzi cu createdAt în ziua curentă (toate statusurile).",
      liveVisitors:
        "Sesiuni unice cu heartbeat în ultimele 5 minute (TTL Redis 300s).",
      conversionRate:
        "Comenzi azi ÷ vizitatori unici azi × 100 (%). Vizitator unic = sesiune cu cel puțin un heartbeat în ziua curentă.",
      totalStockUnits:
        "Suma cantităților de stoc pentru toate produsele din catalog (products.json + valori implicite).",
      lowStockCount: `Produse cu stoc > 0 și < ${LOW_STOCK_THRESHOLD} unități.`,
    },
  };
}

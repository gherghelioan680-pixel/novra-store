import type { NextRequest } from "next/server";
import { readJsonFile } from "@/lib/server-data";
import {
  normalizeOrder,
  ORDER_STATUS_LABELS,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { buildFanCourierTrackingUrl } from "@/lib/tracking";

export const runtime = "nodejs";

const ORDERS_FILE = "orders.json";

const TRACKABLE_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

type TimelineEntry = {
  status: OrderStatus;
  label: string;
  at: string;
};

function buildTimeline(order: Order): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      status: "pending",
      label: ORDER_STATUS_LABELS.pending,
      at: order.createdAt,
    },
  ];

  if (order.status !== "pending") {
    entries.push({
      status: order.status,
      label: ORDER_STATUS_LABELS[order.status],
      at: order.updatedAt,
    });
  }

  if (order.status === "shipped" || order.status === "delivered") {
    const shippedIndex = entries.findIndex((entry) => entry.status === "shipped");
    if (shippedIndex === -1 && order.awbTracking) {
      entries.push({
        status: "shipped",
        label: ORDER_STATUS_LABELS.shipped,
        at: order.updatedAt,
      });
    }
  }

  return entries;
}

function toPublicOrder(order: Order) {
  return {
    purchaseCode: order.purchaseCode,
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    total: order.total,
    shipping: order.shipping,
    items: order.items.map((item) => ({
      title: item.title,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    awbTracking: order.awbTracking,
    trackingUrl: order.awbTracking
      ? buildFanCourierTrackingUrl(order.awbTracking)
      : undefined,
    timeline: buildTimeline(order),
    paymentMethod:
      order.paymentMethod === "card"
        ? "Plată cu cardul"
        : order.paymentMethod === "credits"
          ? "NovraCredits"
          : "Ramburs",
    paymentStatus:
      order.paymentStatus === "paid"
        ? "Plătită"
        : order.paymentMethod === "ramburs"
          ? "De plătit la livrare"
          : "În așteptare",
  };
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  if (!code) {
    return Response.json({ error: "Introdu codul comenzii." }, { status: 400 });
  }

  const ip = getClientIp(request);
  const rate = await checkRateLimit(`track-order:${ip}`, 15, 60);
  if (!rate.allowed) {
    return Response.json(
      { error: "Prea multe încercări. Încearcă din nou peste un minut." },
      { status: 429 }
    );
  }

  const orders = (await readJsonFile<Partial<Order>[]>(ORDERS_FILE, [])).map(normalizeOrder);
  const order = orders.find((entry) => entry.purchaseCode.toUpperCase() === code);

  if (!order) {
    return Response.json({ error: "Comanda nu a fost găsită. Verifică codul și încearcă din nou." }, { status: 404 });
  }

  if (!TRACKABLE_STATUSES.includes(order.status)) {
    return Response.json({ error: "Status comandă indisponibil." }, { status: 404 });
  }

  return Response.json({ order: toPublicOrder(order) });
}

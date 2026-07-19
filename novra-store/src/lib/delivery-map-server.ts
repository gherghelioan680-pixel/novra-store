import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { getServerSiteSettings } from "@/lib/site-settings-server";
import type { Order, OrderStatus } from "@/lib/orders";
import { ROMANIAN_COUNTIES } from "@/lib/romanian-counties";
import { getCountyCode, resolveCountyName } from "@/lib/romania-county-codes";
import {
  createEmptyDeliveryMapPayload,
  type DeliveryCountyStat,
  type DeliveryMapData,
  type DeliveryMapPublicPayload,
} from "@/lib/delivery-map";

const FILE = "delivery-map.json";
const ORDERS_FILE = "orders.json";

function createDefaultCounties(): DeliveryCountyStat[] {
  return ROMANIAN_COUNTIES.map((countyName) => ({
    countyCode: getCountyCode(countyName),
    countyName,
    orderCount: 0,
  }));
}

function normalizeDeliveryMap(raw: Partial<DeliveryMapData> | null): DeliveryMapData {
  const defaults = createDefaultCounties();
  const byCode = new Map<string, DeliveryCountyStat>();

  for (const county of defaults) {
    byCode.set(county.countyCode, { ...county });
  }

  for (const entry of raw?.counties ?? []) {
    if (!entry?.countyCode) continue;
    const resolvedName = resolveCountyName(entry.countyName) ?? resolveCountyName(entry.countyCode);
    if (!resolvedName) continue;

    const code = getCountyCode(resolvedName);
    byCode.set(code, {
      countyCode: code,
      countyName: resolvedName,
      orderCount: Math.max(0, Number(entry.orderCount) || 0),
      lastDeliveryAt: entry.lastDeliveryAt,
      excluded: entry.excluded === true,
    });
  }

  return {
    counties: Array.from(byCode.values()).sort((a, b) => a.countyName.localeCompare(b.countyName, "ro")),
    updatedAt: raw?.updatedAt ?? new Date().toISOString(),
  };
}

export async function readDeliveryMap(): Promise<DeliveryMapData> {
  const raw = await readJsonFile<Partial<DeliveryMapData>>(FILE, {
    counties: createDefaultCounties(),
    updatedAt: new Date().toISOString(),
  });

  if ((raw?.counties?.length ?? 0) === 0) {
    return rebuildDeliveryMapFromOrders();
  }

  return normalizeDeliveryMap(raw);
}

export async function rebuildDeliveryMapFromOrders(): Promise<DeliveryMapData> {
  const orders = await readJsonFile<Order[]>(ORDERS_FILE, []);
  const data = normalizeDeliveryMap({
    counties: [],
    updatedAt: new Date().toISOString(),
  });

  for (const order of orders) {
    const countyName = order.address?.county ?? order.customer?.county;
    if (!countyName?.trim()) continue;

    const index = findCountyIndex(data.counties, countyName);
    if (index === -1) continue;

    data.counties[index] = {
      ...data.counties[index],
      orderCount: data.counties[index].orderCount + 1,
    };

    if (order.status === "delivered") {
      const deliveredAt = order.updatedAt ?? order.createdAt;
      const previous = data.counties[index].lastDeliveryAt;
      if (!previous || deliveredAt > previous) {
        data.counties[index].lastDeliveryAt = deliveredAt;
      }
    }
  }

  data.updatedAt = new Date().toISOString();
  await writeDeliveryMap(data);
  return data;
}

export async function writeDeliveryMap(data: DeliveryMapData): Promise<void> {
  await writeJsonFile(FILE, data);
}

export async function getPublicDeliveryMap(): Promise<DeliveryMapPublicPayload> {
  try {
    const settings = await getServerSiteSettings();
    const enabled = settings.deliveryMapPublicEnabled !== false;
    const data = await readDeliveryMap();
    const visible = data.counties.filter((county) => !county.excluded);
    const totalOrders = visible.reduce((sum, county) => sum + county.orderCount, 0);

    return {
      enabled,
      counties: visible,
      totalOrders,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error("[delivery-map] getPublicDeliveryMap failed:", error);
    return createEmptyDeliveryMapPayload(true);
  }
}

function findCountyIndex(counties: DeliveryCountyStat[], countyName: string): number {
  const resolved = resolveCountyName(countyName);
  if (!resolved) return -1;
  const code = getCountyCode(resolved);
  return counties.findIndex((entry) => entry.countyCode === code);
}

export async function recordOrderCounty(order: Order): Promise<void> {
  const countyName = order.address?.county;
  if (!countyName?.trim()) return;

  const data = await readDeliveryMap();
  const index = findCountyIndex(data.counties, countyName);
  if (index === -1) return;

  data.counties[index] = {
    ...data.counties[index],
    orderCount: data.counties[index].orderCount + 1,
  };
  data.updatedAt = new Date().toISOString();
  await writeDeliveryMap(data);
}

export async function recordDeliveredCounty(
  order: Order,
  previousStatus?: OrderStatus
): Promise<void> {
  if (order.status !== "delivered") return;
  if (previousStatus === "delivered") return;

  const countyName = order.address?.county;
  if (!countyName?.trim()) return;

  const data = await readDeliveryMap();
  const index = findCountyIndex(data.counties, countyName);
  if (index === -1) return;

  data.counties[index] = {
    ...data.counties[index],
    lastDeliveryAt: new Date().toISOString(),
  };
  data.updatedAt = new Date().toISOString();
  await writeDeliveryMap(data);
}

export async function resetDeliveryMapStats(): Promise<DeliveryMapData> {
  const data: DeliveryMapData = {
    counties: createDefaultCounties(),
    updatedAt: new Date().toISOString(),
  };
  await writeDeliveryMap(data);
  return data;
}

export async function setCountyExcluded(countyCode: string, excluded: boolean): Promise<DeliveryMapData> {
  const data = await readDeliveryMap();
  const index = data.counties.findIndex((entry) => entry.countyCode === countyCode);
  if (index === -1) throw new Error("Județ invalid.");

  data.counties[index] = {
    ...data.counties[index],
    excluded,
  };
  data.updatedAt = new Date().toISOString();
  await writeDeliveryMap(data);
  return data;
}

export async function adjustCountyCount(
  countyCode: string,
  orderCount: number
): Promise<DeliveryMapData> {
  const data = await readDeliveryMap();
  const index = data.counties.findIndex((entry) => entry.countyCode === countyCode);
  if (index === -1) throw new Error("Județ invalid.");

  data.counties[index] = {
    ...data.counties[index],
    orderCount: Math.max(0, Math.round(orderCount)),
  };
  data.updatedAt = new Date().toISOString();
  await writeDeliveryMap(data);
  return data;
}

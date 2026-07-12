import "server-only";

import { CATALOG_PRODUCTS, type ProductOverride } from "./catalog";
import { readJsonFile, writeJsonFile } from "./server-data";

const PRODUCTS_FILE = "products.json";
const MAX_RETRIES = 5;

export const DEFAULT_STOCK_QUANTITY = 100;

type StockLine = { productId: string; quantity: number };

function aggregateQuantities(items: StockLine[]): Map<string, number> {
  const required = new Map<string, number>();
  for (const item of items) {
    const productId = item.productId?.trim();
    if (!productId || item.quantity < 1) continue;
    required.set(productId, (required.get(productId) ?? 0) + item.quantity);
  }
  return required;
}

export function getDefaultStockForProduct(productId: string): number {
  const product = CATALOG_PRODUCTS.find((entry) => entry.id === productId);
  return product?.stockQuantity ?? DEFAULT_STOCK_QUANTITY;
}

export function resolveStockQuantity(
  productId: string,
  overrides: Record<string, ProductOverride>
): number {
  const override = overrides[productId]?.stockQuantity;
  if (override !== undefined) return Math.max(0, Math.floor(override));
  return getDefaultStockForProduct(productId);
}

function productTitle(productId: string): string {
  return CATALOG_PRODUCTS.find((entry) => entry.id === productId)?.title ?? productId;
}

function validateStockAvailability(
  required: Map<string, number>,
  overrides: Record<string, ProductOverride>
): string | null {
  const shortages: string[] = [];

  for (const [productId, qty] of required) {
    if (!CATALOG_PRODUCTS.some((entry) => entry.id === productId)) {
      return `Produs invalid în comandă: ${productId}`;
    }

    const available = resolveStockQuantity(productId, overrides);
    if (qty > available) {
      shortages.push(
        `${productTitle(productId)}: solicitat ${qty}, disponibil ${available}`
      );
    }
  }

  if (shortages.length === 0) return null;
  return `Stoc insuficient. ${shortages.join("; ")}`;
}

function applyStockDelta(
  overrides: Record<string, ProductOverride>,
  required: Map<string, number>,
  delta: -1 | 1
): Record<string, ProductOverride> {
  const updated = { ...overrides };

  for (const [productId, qty] of required) {
    const current = resolveStockQuantity(productId, overrides);
    const next = Math.max(0, current + delta * qty);
    updated[productId] = { ...updated[productId], stockQuantity: next };
  }

  return updated;
}

async function mutateStock(
  items: StockLine[],
  delta: -1 | 1
): Promise<{ ok: true } | { ok: false; message: string }> {
  const required = aggregateQuantities(items);
  if (required.size === 0) {
    return { ok: false, message: "Comanda nu conține produse valide." };
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const overrides = await readJsonFile<Record<string, ProductOverride>>(PRODUCTS_FILE, {});
    const shortage = validateStockAvailability(required, overrides);

    if (delta < 0 && shortage) {
      return { ok: false, message: shortage };
    }

    const updated = applyStockDelta(overrides, required, delta);
    await writeJsonFile(PRODUCTS_FILE, updated);
    return { ok: true };
  }

  return {
    ok: false,
    message: "Stocul nu a putut fi actualizat. Încearcă din nou.",
  };
}

export async function decrementStockForOrderItems(
  items: StockLine[]
): Promise<{ ok: true } | { ok: false; message: string }> {
  return mutateStock(items, -1);
}

export async function restoreStockForOrderItems(
  items: StockLine[]
): Promise<void> {
  await mutateStock(items, 1);
}

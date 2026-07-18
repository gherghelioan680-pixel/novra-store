import "server-only";

import { CATALOG_PRODUCTS, type ProductOverride } from "./catalog";
import { readCustomProducts } from "./products-server";
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

export function getDefaultStockForProduct(productId: string, customStock?: number): number {
  const product = CATALOG_PRODUCTS.find((entry) => entry.id === productId);
  if (product) return product.stockQuantity ?? DEFAULT_STOCK_QUANTITY;
  if (customStock !== undefined) return customStock;
  return DEFAULT_STOCK_QUANTITY;
}

export function resolveStockQuantity(
  productId: string,
  overrides: Record<string, ProductOverride>,
  customStockById?: Map<string, number>
): number {
  const override = overrides[productId]?.stockQuantity;
  if (override !== undefined) return Math.max(0, Math.floor(override));
  return getDefaultStockForProduct(productId, customStockById?.get(productId));
}

function productTitle(productId: string, customTitles?: Map<string, string>): string {
  const builtIn = CATALOG_PRODUCTS.find((entry) => entry.id === productId)?.title;
  if (builtIn) return builtIn;
  return customTitles?.get(productId) ?? productId;
}

function validateStockAvailability(
  required: Map<string, number>,
  overrides: Record<string, ProductOverride>,
  knownProductIds: Set<string>,
  customTitles?: Map<string, string>,
  customStockById?: Map<string, number>
): string | null {
  const shortages: string[] = [];

  for (const [productId, qty] of required) {
    if (!knownProductIds.has(productId)) {
      return `Produs invalid în comandă: ${productId}`;
    }

    const available = resolveStockQuantity(productId, overrides, customStockById);
    if (qty > available) {
      shortages.push(
        `${productTitle(productId, customTitles)}: solicitat ${qty}, disponibil ${available}`
      );
    }
  }

  if (shortages.length === 0) return null;
  return `Stoc insuficient. ${shortages.join("; ")}`;
}

function applyStockDelta(
  overrides: Record<string, ProductOverride>,
  required: Map<string, number>,
  delta: -1 | 1,
  customStockById?: Map<string, number>
): Record<string, ProductOverride> {
  const updated = { ...overrides };

  for (const [productId, qty] of required) {
    const current = resolveStockQuantity(productId, overrides, customStockById);
    const next = Math.max(0, current + delta * qty);
    updated[productId] = { ...updated[productId], stockQuantity: next };
  }

  return updated;
}

async function loadProductContext() {
  const [overrides, customProducts] = await Promise.all([
    readJsonFile<Record<string, ProductOverride>>(PRODUCTS_FILE, {}),
    readCustomProducts(),
  ]);

  const knownProductIds = new Set(CATALOG_PRODUCTS.map((product) => product.id));
  const customTitles = new Map<string, string>();
  const customStockById = new Map<string, number>();

  for (const product of customProducts) {
    knownProductIds.add(product.id);
    customTitles.set(product.id, product.title);
    customStockById.set(product.id, product.stockQuantity);
  }

  return { overrides, knownProductIds, customTitles, customStockById };
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
    const { overrides, knownProductIds, customTitles, customStockById } = await loadProductContext();
    const shortage = validateStockAvailability(
      required,
      overrides,
      knownProductIds,
      customTitles,
      customStockById
    );

    if (delta < 0 && shortage) {
      return { ok: false, message: shortage };
    }

    const updated = applyStockDelta(overrides, required, delta, customStockById);
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
